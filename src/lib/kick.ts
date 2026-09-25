import "server-only";

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
