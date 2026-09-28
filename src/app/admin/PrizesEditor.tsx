"use client";

import { useState, useTransition } from "react";
import { formatPrize } from "@/lib/format";
import { updatePrizes } from "./actions";

const ordinal = (n: number) => `${n}${["th", "st", "nd", "rd"][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10] ?? "th"}`;

export function PrizesEditor({ initial, maxPlaces }: { initial: number[]; maxPlaces: number }) {
  const [values, setValues] = useState(initial.map(String));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const numbers = values.map((v) => Number(v || 0));
  const total = numbers.reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      setMessage(null);
      try {
        const result = await updatePrizes(numbers);
        if (result.ok) {
          setValues(result.value.map(String));
          setMessage({ ok: true, text: result.value.length ? "Saved. The leaderboard shows the new prizes." : "Saved. Prizes are hidden on the leaderboard." });
        } else {
          setMessage({ ok: false, text: result.error });
        }
      } catch {
        setMessage({ ok: false, text: "Something went wrong. Your sign-in may have expired; reload the page." });
      }
    });
  };

  return (
    <form onSubmit={save}>
      {values.length === 0 && <p className="mb-3 text-sm text-muted">No prizes set, so the leaderboard hides the prize pool.</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        {values.map((v, i) => (
          <label key={i} className="flex items-center gap-3 rounded-lg border border-edge bg-ink px-3 py-2">
            <span className="w-10 text-xs font-bold uppercase tracking-widest text-muted">{ordinal(i + 1)}</span>
            <span className="text-muted">$</span>
            <input
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={v}
              onChange={(e) => setValues(values.map((old, j) => (j === i ? e.target.value : old)))}
              className="min-w-0 flex-1 bg-transparent text-sm tabular-nums outline-none"
              aria-label={`${ordinal(i + 1)} place prize in USD`}
            />
            {i === values.length - 1 && (
              <button
                type="button"
                onClick={() => setValues(values.slice(0, -1))}
                className="text-xs text-muted hover:text-red-300"
                aria-label={`Remove ${ordinal(i + 1)} place`}
              >
                ✕
              </button>
            )}
          </label>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {values.length < maxPlaces && (
          <button
            type="button"
            onClick={() => setValues([...values, ""])}
            className="rounded-lg border border-edge px-3 py-2 text-sm text-muted transition hover:border-acid hover:text-white"
          >
            + Add {ordinal(values.length + 1)} place
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-acid px-4 py-2 text-sm font-bold text-ink transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save prizes"}
        </button>
        <span className="text-sm text-muted">
          Pool: <span className="font-semibold text-white tabular-nums">{formatPrize(total)}</span>
        </span>
      </div>
      <div aria-live="polite">
        {message && (
          <p
            className={`mt-3 rounded-lg border p-3 text-sm ${
              message.ok ? "border-acid/30 bg-acid/10 text-acid" : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
