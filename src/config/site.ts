// Everything your friend is likely to want to tweak lives here.
export const site = {
  name: "Misfits Underground",
  domain: "misfitsunderground.com",

  affiliateCode: "kingviolence",
  referralUrl: "https://roobet.com/?ref=kingviolence",

  // Channels shown on the Streams page. `name` is optional (defaults to the channel).
  streams: [
    { platform: "kick", channel: "king_violence", name: "King_Violence" },
    { platform: "kick", channel: "queen-violence", name: "Queen_Violence" },
    { platform: "kick", channel: "b8dk", name: "B8DK" },
    { platform: "kick", channel: "ismokethadank", name: "iSmokeThaDank" },
    { platform: "kick", channel: "sheekthedev", name: "SheekTheDev" },
    { platform: "kick", channel: "devvlin", name: "Devvlin" },
    { platform: "kick", channel: "p0tzombie420", name: "p0tzombie420" },
    { platform: "kick", channel: "mysticintentions", name: "MysticIntentions" },
    { platform: "twitch", channel: "sheekthedev", name: "SheekTheDev" },
  ] as { platform: "kick" | "twitch"; channel: string; name?: string }[],

  // Kick channel whose gifted-sub leaderboard shows on the Gifters tab.
  giftersChannel: "king_violence",

  // Fourthwall shop. Products show on the Merch tab once FOURTHWALL_STOREFRONT_TOKEN is set.
  merchUrl: "https://izzythekid92-shop.fourthwall.com",

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
