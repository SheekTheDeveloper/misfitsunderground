"use client";

import { useEffect, useState } from "react";

function remaining(target: number) {
  const ms = Math.max(target - Date.now(), 0);
  return {
    d: Math.floor(ms / 86_400_000),
    h: Math.floor(ms / 3_600_000) % 24,
    m: Math.floor(ms / 60_000) % 60,
    s: Math.floor(ms / 1000) % 60,
  };
}

export function Countdown({ endsAt }: { endsAt: string }) {
  const target = new Date(endsAt).getTime();
  const [time, setTime] = useState<ReturnType<typeof remaining> | null>(null);

  useEffect(() => {
    setTime(remaining(target));
    const id = setInterval(() => setTime(remaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const units = [
    ["Days", time?.d],
    ["Hrs", time?.h],
    ["Min", time?.m],
    ["Sec", time?.s],
  ] as const;

  return (
    <div className="flex gap-2 sm:gap-3" aria-label="Time until leaderboard resets">
      {units.map(([label, value]) => (
        <div
          key={label}
          className="w-16 rounded-lg border border-edge bg-panel py-2 text-center sm:w-20"
        >
          <div className="font-display text-3xl tabular-nums text-acid sm:text-4xl">
            {value === undefined ? "--" : String(value).padStart(2, "0")}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
        </div>
      ))}
    </div>
  );
}
