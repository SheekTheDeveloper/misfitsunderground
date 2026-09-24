# Misfits Underground

Roobet affiliate leaderboard for misfitsunderground.com. Built with Next.js and Tailwind.

## Local development

```bash
cp .env.example .env.local   # then fill in the Roobet token and user ID
npm install
npm run dev                  # http://localhost:3000
```

## Customizing

Edit `src/config/site.ts` to change the promo code, referral link, prizes, number of players shown, and social links.

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

Add channels to `streams` in `src/config/site.ts`; they appear on the /streams page. The page uses the official Kick or Twitch player, set to autoplay muted. Keep it large and visible: players that are hidden, covered by other elements, or tiny go against Twitch's embed rules and may not count as views.
