// Everything your friend is likely to want to tweak lives here.
export const site = {
  name: "Misfits Underground",
  domain: "misfitsunderground.com",

  affiliateCode: "kingviolence",
  referralUrl: "https://roobet.com/?ref=kingviolence",

  // Channels shown on the Streams page. `name` is optional (defaults to the channel).
  streams: [
    { platform: "kick", channel: "king_violence", name: "King_Violence" },
    { platform: "kick", channel: "queenq", name: "QueenQ" },
    { platform: "kick", channel: "b8dk", name: "B8DK" },
    { platform: "kick", channel: "ismokethadank", name: "iSmokeThaDank" },
  ] as { platform: "kick" | "twitch"; channel: string; name?: string }[],

  // Leaderboard period. "monthly" resets at 00:00 UTC on the 1st of each month.
  period: "monthly" as const,

  // Number of players shown on the board.
  displayCount: 10,

  // Prize for each place, in USD. Index 0 = 1st place, e.g. [500, 250, 100].
  // Leave empty to hide prizes; the pool, podium badges, and Prize column appear once set.
  prizes: [] as number[],

  // Socials. Leave a value empty to hide it.
  socials: {
    kick: "https://kick.com/king_violence",
    discord: "https://discord.gg/phHsDDBzmV",
    x: "https://x.com/King_violence69",
  },
};

export const totalPrizePool = site.prizes.reduce((sum, p) => sum + p, 0);
