"use client";

import { useState } from "react";

type Day = { day: string; views: number; visitors: number };

const dateLabel = (day: string, long = false) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(long ? { weekday: "short" } : {}),
    timeZone: "UTC",
  });

/** Daily page views as bars; hovering or focusing a day shows its views and visitors. */
export function TrafficChart({ days }: { days: Day[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((d) => d.views));
  const shown = active !== null ? days[active] : null;
  // Label roughly five dates along the axis regardless of range.
  const every = Math.max(1, Math.ceil(days.length / 5));

  return (
    <figure>
      <div className="mb-2 flex h-5 items-baseline justify-between text-xs text-muted">
        <span>{max.toLocaleString()} views</span>
        {shown && (
          <span className="text-white">
            {dateLabel(shown.day, true)} · <span className="font-semibold tabular-nums">{shown.views.toLocaleString()}</span> views ·{" "}
            <span className="font-semibold tabular-nums">{shown.visitors.toLocaleString()}</span> visitors
          </span>
        )}
      </div>
      <div
        className="relative flex h-40 items-end gap-[2px] border-b border-edge"
        onMouseLeave={() => setActive(null)}
        aria-hidden="true"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-edge" />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-edge/60" />
        {days.map((d, i) => (
          <div
            key={d.day}
            onMouseEnter={() => setActive(i)}
            className="relative flex h-full flex-1 items-end"
          >
            <div
              className={`w-full rounded-t-[4px] transition-colors ${
                active === i ? "bg-acid" : active === null ? "bg-acid/80" : "bg-acid/40"
              }`}
              style={{ height: d.views ? `${Math.max(2, (d.views / max) * 100)}%` : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex text-[10px] text-muted" aria-hidden="true">
        {days.map((d, i) => (
          <span key={d.day} className="flex-1 overflow-visible whitespace-nowrap">
            {i % every === 0 ? dateLabel(d.day) : ""}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Page views and visitors per day</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Views</th>
            <th>Visitors</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.day}>
              <td>{dateLabel(d.day, true)}</td>
              <td>{d.views}</td>
              <td>{d.visitors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
