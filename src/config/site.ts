// Everything your friend is likely to want to tweak lives here.
export const site = {
  name: "Misfits Underground",
  domain: "misfitsunderground.com",

  affiliateCode: "kingviolence",
  referralUrl: "https://roobet.com/?ref=kingviolence",

  // Kick accounts that can sign in at /admin, matched by Kick user ID (usernames can change).
  admins: [
    { kickUserId: 1151117, name: "King_Violence" },
    { kickUserId: 106723284, name: "Queen_Violence" },
    { kickUserId: 63764815, name: "SheekTheDev" },
  ],

  // Starting list for the Streams page. Once anyone edits streams at /admin, the saved list replaces this one.
  streams: [
    { platform: "kick", channel: "king_violence", name: "King_Violence" },
    { platform: "kick", channel: "queen-violence", name: "Queen_Violence" },
    { platform: "kick", channel: "b8dk", name: "B8DK" },
    { platform: "kick", channel: "ismokethadank", name: "iSmokeThaDank" },
    { platform: "kick", channel: "sheekthedev", name: "SheekTheDev" },
    { platform: "kick", channel: "devvlin", name: "Devvlin" },
    { platform: "kick", channel: "p0tzombie420", name: "p0tzombie420" },
    { platform: "kick", channel: "mysticintentions", name: "MysticIntentions" },
    { platform: "kick", channel: "uubski", name: "Uubski" },
    { platform: "kick", channel: "hawkinsarcade", name: "HawkinsArcade" },
    { platform: "kick", channel: "youthcrewdre", name: "YouthCrewDre" },
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

  // Starting prizes per place, in USD (index 0 = 1st place). Edit them at /admin; the saved values replace these.
  // Empty hides prizes; the pool, podium badges, and Prize column appear once set.
  prizes: [250, 150, 100] as number[],

  // Socials. Leave a value empty to hide it.
  socials: {
    kick: "https://kick.com/king_violence",
    discord: "https://discord.gg/phHsDDBzmV",
    x: "https://x.com/King_violence69",
  },
};
