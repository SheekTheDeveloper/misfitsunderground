# Misfits Underground

Roobet affiliate leaderboard for misfitsunderground.com. Built with Next.js and Tailwind.

## Local development

```bash
cp .env.example .env.local   # then fill in the Roobet token and user ID
npm install
npm run dev                  # http://localhost:3000
```

## Customizing

Streams and prizes are edited on the site at **/admin** (see below). Edit `src/config/site.ts` for everything else: the promo code, referral link, number of players shown, social links, and who can sign in to /admin.

## Admin panel (/admin)

King, Queen, and the site owner sign in with "Log in with Kick". Only the Kick user IDs in `site.admins` get in. From there they can:

- add, rename, reorder, and remove streams (each channel is checked on Kick or Twitch before it's saved, because one bad Kick slug breaks live status for every Kick stream)
- set the leaderboard prizes
- see traffic: page views, unique visitors, Roobet link clicks, pages, referrers, countries, and devices
- see site status (which services are configured, whether the KICKs connection is live) and a log of who changed what

Sign-in uses King's Kick developer app, which must have the **user:read** scope ticked (kick.com/settings/developer). The session cookie is signed with `KICK_ADMIN_KEY`, so rotating that key signs everyone out.

Edits are saved in Upstash Redis (`site:streams`, `site:prizes`). Until something is saved, the pages use `streams` and `prizes` from `site.ts`.

## Analytics

`src/components/Tracker.tsx` sends a beacon to `/api/track` on each page view and on clicks to other sites. It sets no cookies and stores no IP addresses: daily counts go in a Redis hash, and unique visitors are estimated with a HyperLogLog of salted hashes. Bots and visitors with Do Not Track or Global Privacy Control are skipped. Only production records hits (`VERCEL_ENV=production`), because local runs share the production database. Each page view costs about 6 Upstash commands; the free plan allows 500K a month.

## How it works

- `src/lib/roobet.ts` calls `https://roobetconnect.com/affiliate/v2/stats` on the server. The API token never reaches the browser.
- Results are cached for 5 minutes, so traffic spikes don't hit Roobet's API.
- Players are ranked by `weightedWagered`, and usernames are masked (`On*****ko`).
- The board covers the current calendar month in UTC.

## Deploying (Vercel)

1. Push this repo to GitHub. `.env.local` is gitignored, but double-check it isn't committed.
2. On vercel.com, click Add New → Project and import the repo. The defaults work as they are.
3. Before deploying, open Environment Variables and add `ROOBET_API_TOKEN` and `ROOBET_USER_ID`.
4. Under Settings → Domains, add `misfitsunderground.com` and `www.misfitsunderground.com`, then add the DNS records Vercel shows at your domain registrar.

Every push to the main branch redeploys automatically.

## Stream embed

Add channels at /admin; they appear on the /streams page. The page uses the official Kick or Twitch player, set to autoplay muted. Keep it large and visible: players that are hidden, covered by other elements, or tiny go against Twitch's embed rules and may not count as views.
