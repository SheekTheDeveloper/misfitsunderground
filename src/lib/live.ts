import "server-only";
import { unstable_cache } from "next/cache";

export type StreamRef = { platform: "kick" | "twitch"; channel: string };
export type LiveStatus = { live: boolean; viewers: number | null };

export const streamKey = (s: StreamRef) => `${s.platform}:${s.channel.toLowerCase()}`;

// App access tokens last ~60 days; reuse one for a day instead of requesting per page render.
const kickAppToken = unstable_cache(
  async (): Promise<string> => {
    const clientId = process.env.KICK_CLIENT_ID;
    const clientSecret = process.env.KICK_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error("KICK_CLIENT_ID and KICK_CLIENT_SECRET must be set");

    const res = await fetch("https://id.kick.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Kick token endpoint responded ${res.status}`);
    return ((await res.json()) as { access_token: string }).access_token;
  },
  ["kick-app-token"],
  { revalidate: 86_400 },
);

async function kickStatuses(channels: string[]): Promise<Map<string, LiveStatus>> {
  const out = new Map<string, LiveStatus>();
  if (channels.length === 0) return out;

  const url = new URL("https://api.kick.com/public/v1/channels");
  for (const c of channels) url.searchParams.append("slug", c.toLowerCase());
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${await kickAppToken()}`, Accept: "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Kick channels API responded ${res.status}`);

  const { data } = (await res.json()) as {
    data: { slug: string; stream?: { is_live: boolean; viewer_count: number } | null }[];
  };
  for (const c of data) {
    out.set(`kick:${c.slug.toLowerCase()}`, {
      live: Boolean(c.stream?.is_live),
      viewers: c.stream?.is_live ? c.stream.viewer_count : null,
    });
  }
  return out;
}

/** Twitch via decapi.me, which needs no credentials: it returns an uptime like "1 hour, 5 minutes" when live. */
async function twitchStatus(channel: string): Promise<LiveStatus> {
  const res = await fetch(`https://decapi.me/twitch/uptime/${encodeURIComponent(channel)}`, {
    next: { revalidate: 60 },
  });
  const text = res.ok ? await res.text() : "";
  return { live: /\d+ (second|minute|hour|day)/.test(text), viewers: null };
}

/** Live status per stream, keyed by streamKey(). Any lookup that fails counts as offline. */
export async function getLiveStatuses(streams: StreamRef[]): Promise<Map<string, LiveStatus>> {
  const kick = streams.filter((s) => s.platform === "kick").map((s) => s.channel);
  const twitch = streams.filter((s) => s.platform === "twitch").map((s) => s.channel);

  const [kickResult, ...twitchResults] = await Promise.allSettled([
    kickStatuses(kick),
    ...twitch.map(twitchStatus),
  ]);

  const statuses = new Map<string, LiveStatus>();
  if (kickResult.status === "fulfilled") {
    for (const [key, status] of kickResult.value) statuses.set(key, status);
  } else {
    console.error("Failed to load Kick live statuses:", kickResult.reason);
  }
  twitchResults.forEach((result, i) => {
    if (result.status === "fulfilled") statuses.set(`twitch:${twitch[i].toLowerCase()}`, result.value);
    else console.error(`Failed to load Twitch status for ${twitch[i]}:`, result.reason);
  });
  return statuses;
}
