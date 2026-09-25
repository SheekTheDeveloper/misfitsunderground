import "server-only";
import { unstable_cache } from "next/cache";
import { getBroadcasterToken } from "./kickAuth";

export type Gifter = { username: string; quantity: number };

export type GiftLeaderboards = {
  week: Gifter[];
  month: Gifter[];
  allTime: Gifter[];
};

type KickLeaderboardResponse = {
  gifts: Gifter[];
  gifts_week: Gifter[];
  gifts_month: Gifter[];
};

/**
 * Gifted-sub leaderboards from Kick's public website API. It's unofficial and sits behind
 * Cloudflare, so this returns null on any failure and the page hides the section.
 */
export async function getGiftLeaderboards(channel: string): Promise<GiftLeaderboards | null> {
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(channel)}/leaderboards`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Kick responded ${res.status}`);

    const data = (await res.json()) as KickLeaderboardResponse;
    const clean = (list: Gifter[] = []) =>
      list.map(({ username, quantity }) => ({ username, quantity })).filter((g) => g.quantity > 0);

    return { week: clean(data.gifts_week), month: clean(data.gifts_month), allTime: clean(data.gifts) };
  } catch (err) {
    console.error("Failed to load Kick gift leaderboards:", err);
    return null;
  }
}

export type KicksSupporter = { username: string; amount: number };

export type KicksLeaderboards = {
  week: KicksSupporter[];
  month: KicksSupporter[];
  allTime: KicksSupporter[];
};

type KicksEntry = { rank: number; username: string; gifted_amount: number };

/**
 * KICKs leaderboard from Kick's official API. Null until the broadcaster has connected.
 * Successful results are cached for 5 minutes so token reads and refreshes don't run on every
 * visit; failures throw inside the cache so they're never stored.
 */
export async function getKicksLeaderboards(): Promise<KicksLeaderboards | null> {
  try {
    return await cachedKicksLeaderboards();
  } catch (err) {
    if (err instanceof NotConnectedError) return null;
    console.error("Failed to load KICKs leaderboard:", err);
    return null;
  }
}

class NotConnectedError extends Error {}

const cachedKicksLeaderboards = unstable_cache(
  async (): Promise<KicksLeaderboards> => {
    const token = await getBroadcasterToken();
    if (!token) throw new NotConnectedError();

    const res = await fetch("https://api.kick.com/public/v1/kicks/leaderboard?top=10", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Kick responded ${res.status}`);

    const { data } = (await res.json()) as {
      data: { week?: KicksEntry[]; month?: KicksEntry[]; lifetime?: KicksEntry[] };
    };
    const clean = (list: KicksEntry[] = []) =>
      [...list]
        .sort((a, b) => a.rank - b.rank)
        .map((e) => ({ username: e.username, amount: e.gifted_amount }))
        .filter((e) => e.amount > 0);

    return { week: clean(data.week), month: clean(data.month), allTime: clean(data.lifetime) };
  },
  ["kicks-leaderboard"],
  { revalidate: 300 },
);
