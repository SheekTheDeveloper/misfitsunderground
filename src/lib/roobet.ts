import "server-only";
import type { Period } from "./period";

const API_URL = "https://roobetconnect.com/affiliate/v2/stats";

type RoobetStat = {
  uid: string;
  username: string;
  wagered: number;
  weightedWagered: number;
  favoriteGameTitle?: string;
  rankLevel?: number;
};

export type LeaderboardEntry = {
  rank: number;
  username: string;
  wagered: number;
};

export type Leaderboard = {
  entries: LeaderboardEntry[];
  /** Weighted wager across every player under the code, not just those shown. */
  totalWagered: number;
  playerCount: number;
};

/** "Onlyrocko" -> "On*****ko". Keeps players from being easily looked up. */
export function maskUsername(name: string): string {
  if (name.length <= 3) return name[0] + "*".repeat(Math.max(name.length - 1, 1));
  const keep = name.length <= 5 ? 1 : 2;
  return name.slice(0, keep) + "*".repeat(name.length - keep * 2) + name.slice(-keep);
}

export async function getLeaderboard(period: Period, limit: number): Promise<Leaderboard> {
  const token = process.env.ROOBET_API_TOKEN;
  const userId = process.env.ROOBET_USER_ID;
  if (!token || !userId) {
    throw new Error("ROOBET_API_TOKEN and ROOBET_USER_ID must be set");
  }

  const url = new URL(API_URL);
  url.searchParams.set("userId", userId);
  url.searchParams.set("startDate", period.start.toISOString());
  // Roobet's endDate is inclusive, so stop 1ms before the reset.
  url.searchParams.set("endDate", new Date(period.end.getTime() - 1).toISOString());

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Roobet API responded ${res.status}`);
  }

  // Rank by weighted wager: Roobet counts slots at 100% and lower-edge games at a reduced rate.
  const players = ((await res.json()) as RoobetStat[])
    .filter((s) => s.weightedWagered > 0)
    .sort((a, b) => b.weightedWagered - a.weightedWagered);

  return {
    entries: players.slice(0, limit).map((s, i) => ({
      rank: i + 1,
      username: maskUsername(s.username),
      wagered: s.weightedWagered,
    })),
    totalWagered: players.reduce((sum, s) => sum + s.weightedWagered, 0),
    playerCount: players.length,
  };
}
