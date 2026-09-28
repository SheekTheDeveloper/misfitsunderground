import "server-only";
import { unstable_cache } from "next/cache";
import { site } from "@/config/site";
import { kickAppToken } from "./live";
import { redis } from "./redis";

export type Stream = { platform: "kick" | "twitch"; channel: string; name?: string };
export type LogEntry = { at: number; who: string; action: string };

const STREAMS_KEY = "site:streams";
const PRIZES_KEY = "site:prizes";
const LOG_KEY = "admin:log";

// Pages read these through the cache; admin saves expire the tag so changes show right away.
// The keys include the site.ts defaults, so editing a default also skips the old cached value.
export const CONTENT_TAG = "site-content";

/** Streams saved from /admin, or the starting list in site.ts. */
export const getStreams = unstable_cache(
  async (): Promise<Stream[]> => (await redis()?.get<Stream[]>(STREAMS_KEY)) ?? site.streams,
  ["streams", JSON.stringify(site.streams)],
  { tags: [CONTENT_TAG] },
);

/** Prizes saved from /admin, or the starting values in site.ts. */
export const getPrizes = unstable_cache(
  async (): Promise<number[]> => (await redis()?.get<number[]>(PRIZES_KEY)) ?? site.prizes,
  ["prizes", JSON.stringify(site.prizes)],
  { tags: [CONTENT_TAG] },
);

function db() {
  const client = redis();
  if (!client) throw new Error("Upstash Redis is not configured");
  return client;
}

export async function saveStreams(streams: Stream[]) {
  await db().set(STREAMS_KEY, streams);
}

export async function savePrizes(prizes: number[]) {
  await db().set(PRIZES_KEY, prizes);
}

export async function logAction(who: string, action: string) {
  const entry: LogEntry = { at: Date.now(), who, action };
  await db().pipeline().lpush(LOG_KEY, entry).ltrim(LOG_KEY, 0, 99).exec();
}

export async function getLog(count = 25): Promise<LogEntry[]> {
  return (await redis()?.lrange<LogEntry>(LOG_KEY, 0, count - 1)) ?? [];
}

/**
 * Checks a channel exists and returns its canonical slug, or null if it doesn't.
 * Matters for Kick: one unknown slug makes Kick reject the whole live-status request.
 */
export async function verifyChannel(platform: Stream["platform"], channel: string): Promise<string | null> {
  if (platform === "kick") {
    const url = new URL("https://api.kick.com/public/v1/channels");
    url.searchParams.set("slug", channel.toLowerCase());
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${await kickAppToken()}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (res.status === 400 || res.status === 404) return null;
    if (!res.ok) throw new Error(`Kick channels API responded ${res.status}`);
    const { data } = (await res.json()) as { data: { slug: string }[] };
    return data[0]?.slug ?? null;
  }

  const res = await fetch(`https://decapi.me/twitch/id/${encodeURIComponent(channel)}`, { cache: "no-store" });
  // decapi answers 400 for usernames that don't exist.
  if (res.status === 400 || res.status === 404) return null;
  if (!res.ok) throw new Error(`decapi responded ${res.status}`);
  return /^\d+$/.test((await res.text()).trim()) ? channel.toLowerCase() : null;
}
