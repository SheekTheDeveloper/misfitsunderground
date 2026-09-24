import { Countdown } from "@/components/Countdown";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { Podium } from "@/components/Podium";
import { site, totalPrizePool } from "@/config/site";
import { formatPrize, formatUsd } from "@/lib/format";
import { currentMonthlyPeriod } from "@/lib/period";
import { getLeaderboard, type Leaderboard } from "@/lib/roobet";

// Re-render at most every 5 minutes; the Roobet fetch is cached for the same window.
export const revalidate = 300;

export default async function Home() {
  const period = currentMonthlyPeriod();

  let board: Leaderboard | null = null;
  try {
    board = await getLeaderboard(period, site.displayCount);
  } catch (err) {
    console.error("Failed to load leaderboard:", err);
  }
  const entries = board?.entries ?? [];

  const monthLabel = period.start.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <>
      <section className="flex flex-col items-center py-10 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-violet">{monthLabel}</p>
        <h1 className="mt-3 font-display text-6xl leading-none sm:text-8xl">
          {totalPrizePool > 0 ? (
            <>
              {formatPrize(totalPrizePool)} <span className="text-acid">Pool</span>
            </>
          ) : (
            <>
              Monthly <span className="text-acid">Leaderboard</span>
            </>
          )}
        </h1>
        {board && (
          <dl className="mt-6 flex gap-10">
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-muted">Wagered this month</dt>
              <dd className="font-display text-3xl tabular-nums">{formatUsd(board.totalWagered)}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-muted">Players</dt>
              <dd className="font-display text-3xl tabular-nums">{board.playerCount}</dd>
            </div>
          </dl>
        )}
        <div className="mt-8">
          <Countdown endsAt={period.end.toISOString()} />
        </div>
        <p className="mt-6 text-sm text-muted">
          Use code{" "}
          <span className="rounded bg-panel px-2 py-1 font-mono font-bold text-acid">{site.affiliateCode}</span>{" "}
          on Roobet
        </p>
      </section>

      {!board && (
        <p className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-300">
          Leaderboard data is temporarily unavailable. Check back in a few minutes.
        </p>
      )}

      <section className="mt-6 space-y-6">
        <Podium top={entries.slice(0, 3)} prizes={site.prizes} />
        <LeaderboardTable entries={entries} prizes={site.prizes} startRank={4} count={site.displayCount} />
        <p className="text-center text-xs text-muted">
          Updates every 5 minutes. Ranked by weighted wager. Resets 00:00 UTC on the 1st.
        </p>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-3">
        {[
          ["01", "Sign up", `Create a Roobet account using code ${site.affiliateCode}.`],
          ["02", "Wager", "Every bet counts toward your weighted wager for the month."],
          totalPrizePool > 0
            ? ["03", "Get paid", "Top players split the prize pool when the month ends."]
            : ["03", "Climb the board", "The biggest wagerers each month take the top spots."],
        ].map(([n, title, body]) => (
          <div key={n} className="rounded-2xl border border-edge bg-panel p-6">
            <div className="font-display text-3xl text-violet">{n}</div>
            <h3 className="mt-2 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </div>
        ))}
      </section>
    </>
  );
}
