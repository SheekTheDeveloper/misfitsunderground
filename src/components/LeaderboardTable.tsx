import type { LeaderboardEntry } from "@/lib/roobet";
import { formatPrize, formatUsd } from "@/lib/format";

export function LeaderboardTable({
  entries,
  prizes,
  startRank,
  count,
}: {
  entries: LeaderboardEntry[];
  prizes: number[];
  startRank: number;
  count: number;
}) {
  const rows = Array.from({ length: Math.max(count - startRank + 1, 0) }, (_, i) => {
    const rank = startRank + i;
    return { rank, entry: entries[rank - 1] };
  });

  if (rows.length === 0) return null;
  const showPrizes = prizes.length > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-panel">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-edge text-xs uppercase tracking-widest text-muted">
          <tr>
            <th className="px-4 py-3 sm:px-6">Rank</th>
            <th className="px-4 py-3 sm:px-6">Player</th>
            <th className="px-4 py-3 text-right sm:px-6">Wagered</th>
            {showPrizes && <th className="px-4 py-3 text-right sm:px-6">Prize</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ rank, entry }) => (
            <tr key={rank} className="border-b border-edge/60 last:border-0">
              <td className="px-4 py-3 font-display text-xl text-muted sm:px-6">#{rank}</td>
              <td className="max-w-32 truncate px-4 py-3 font-medium sm:px-6">
                {entry?.username ?? <span className="text-muted">—</span>}
              </td>
              <td className="px-4 py-3 text-right tabular-nums sm:px-6">
                {entry ? formatUsd(entry.wagered) : <span className="text-muted">—</span>}
              </td>
              {showPrizes && (
                <td className="px-4 py-3 text-right font-semibold text-acid sm:px-6">
                  {formatPrize(prizes[rank - 1] ?? 0)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
