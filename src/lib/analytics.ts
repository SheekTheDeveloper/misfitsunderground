import "server-only";
import { createHmac } from "node:crypto";
import { redis } from "./redis";

// Everything for one UTC day lives in a hash of counters plus a HyperLogLog of visitor hashes.
// No cookies and no raw IPs: a visitor is an HMAC of day + IP + user agent, which the HyperLogLog
// only uses to estimate a count. Data expires after ~13 months.
const TTL = 400 * 24 * 60 * 60;
const countsKey = (day: string) => `a:d:${day}`;
const visitorsKey = (day: string) => `a:u:${day}`;

export const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export type Hit =
  | { type: "view"; path: string; referrer: string | null; country: string | null; device: string; visitor: string }
  | { type: "out"; host: string };

const BOTS = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|curl|wget|python|node-fetch/i;

export const isBot = (ua: string) => !ua || BOTS.test(ua);

export const deviceType = (ua: string) => (/iPad|Tablet/i.test(ua) ? "tablet" : /Mobi|Android/i.test(ua) ? "mobile" : "desktop");

export function visitorHash(day: string, ip: string, ua: string) {
  const secret = process.env.KICK_ADMIN_KEY ?? "";
  return createHmac("sha256", `analytics:${secret}`).update(`${day}|${ip}|${ua}`).digest("base64url").slice(0, 16);
}

export async function recordHit(hit: Hit) {
  const db = redis();
  if (!db) return;
  const day = dayKey(new Date());
  const key = countsKey(day);

  if (hit.type === "out") {
    await db.hincrby(key, `o:${hit.host}`, 1);
    return;
  }

  const p = db.pipeline();
  p.hincrby(key, "pv", 1);
  p.hincrby(key, `p:${hit.path}`, 1);
  p.hincrby(key, `d:${hit.device}`, 1);
  if (hit.country) p.hincrby(key, `c:${hit.country}`, 1);
  if (hit.referrer) p.hincrby(key, `r:${hit.referrer}`, 1);
  p.pfadd(visitorsKey(day), hit.visitor);
  const [views] = (await p.exec()) as [number];
  // Set the expiry once, on the day's first view, instead of on every hit.
  if (views === 1) await db.pipeline().expire(key, TTL).expire(visitorsKey(day), TTL).exec();
}

export type Ranked = { label: string; count: number }[];
export type Report = {
  days: { day: string; views: number; visitors: number }[];
  views: number;
  visitors: number;
  pages: Ranked;
  referrers: Ranked;
  countries: Ranked;
  devices: Ranked;
  outbound: Ranked;
};

/** Traffic for the last `count` days, today included. Null when Redis isn't configured. */
export async function getReport(count: number): Promise<Report | null> {
  const db = redis();
  if (!db) return null;

  const today = new Date();
  const days = Array.from({ length: count }, (_, i) => dayKey(new Date(today.getTime() - (count - 1 - i) * 86_400_000)));

  const p = db.pipeline();
  for (const day of days) p.hgetall(countsKey(day)).pfcount(visitorsKey(day));
  p.pfcount(visitorsKey(days[0]), ...days.slice(1).map(visitorsKey));
  const results = (await p.exec()) as unknown[];

  const totals = new Map<string, number>();
  const perDay = days.map((day, i) => {
    const counts = (results[i * 2] as Record<string, number> | null) ?? {};
    for (const [field, n] of Object.entries(counts)) totals.set(field, (totals.get(field) ?? 0) + Number(n));
    return { day, views: Number(counts.pv ?? 0), visitors: results[i * 2 + 1] as number };
  });

  const ranked = (prefix: string): Ranked =>
    [...totals]
      .filter(([field]) => field.startsWith(prefix))
      .map(([field, n]) => ({ label: field.slice(prefix.length), count: n }))
      .sort((a, b) => b.count - a.count);

  return {
    days: perDay,
    views: totals.get("pv") ?? 0,
    // Union across days, so someone visiting on three days counts once.
    visitors: results[results.length - 1] as number,
    pages: ranked("p:"),
    referrers: ranked("r:"),
    countries: ranked("c:"),
    devices: ranked("d:"),
    outbound: ranked("o:"),
  };
}
