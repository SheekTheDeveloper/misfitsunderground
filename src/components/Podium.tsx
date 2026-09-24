import type { LeaderboardEntry } from "@/lib/roobet";
import { formatPrize, formatUsd } from "@/lib/format";

const styles = {
  1: { ring: "border-gold/60 shadow-[0_0_40px_-10px] shadow-gold/50", text: "text-gold", lift: "sm:-translate-y-6" },
  2: { ring: "border-silver/40", text: "text-silver", lift: "" },
  3: { ring: "border-bronze/40", text: "text-bronze", lift: "" },
} as const;

export function Podium({ top, prizes }: { top: (LeaderboardEntry | undefined)[]; prizes: number[] }) {
  // Display order: 2nd, 1st, 3rd.
  const order = [2, 1, 3] as const;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
      {order.map((place) => {
        const entry = top[place - 1];
        const s = styles[place];
        return (
          <div
            key={place}
            className={`rounded-2xl border bg-panel p-6 text-center ${s.ring} ${s.lift} ${
              place === 1 ? "order-first sm:order-none" : ""
            }`}
          >
            <div className={`font-display text-6xl leading-none ${s.text}`}>#{place}</div>
            <div className="mt-3 truncate text-lg font-semibold">
              {entry?.username ?? <span className="text-muted">Open spot</span>}
            </div>
            <div className="mt-1 text-sm text-muted">
              {entry ? `${formatUsd(entry.wagered)} wagered` : "Be the one"}
            </div>
            {prizes[place - 1] > 0 && (
              <div className="mt-4 inline-block rounded-full bg-acid/10 px-4 py-1 font-display text-2xl text-acid">
                {formatPrize(prizes[place - 1])}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
