// Everything your friend is likely to want to tweak lives here.
export const site = {
  name: "Misfits Underground",
  domain: "misfitsunderground.com",
  tagline: "Wager under code. Climb the board. Get paid.",

  affiliateCode: "kingviolence",
  referralUrl: "https://roobet.com/?ref=kingviolence",

  // Channels shown on the Streams page. `name` is optional (defaults to the channel).
  streams: [
    { platform: "kick", channel: "king_violence" },
    { platform: "kick", channel: "queenq" },
    { platform: "kick", channel: "b8dk" },
  ] as { platform: "kick" | "twitch"; channel: string; name?: string }[],

  // Leaderboard period. "monthly" resets at 00:00 UTC on the 1st of each month.
  period: "monthly" as const,

  // Number of players shown on the board.
  displayCount: 10,

  // Prize for each place, in USD. Index 0 = 1st place.
  // TODO: set the real prize pool.
  prizes: [500, 250, 125, 50, 25, 20, 10, 10, 5, 5],

  // Socials. Leave a value empty to hide it.
  socials: {
    kick: "",
    twitch: "",
    x: "",
    discord: "",
    youtube: "",
  },
};

export const totalPrizePool = site.prizes.reduce((sum, p) => sum + p, 0);
