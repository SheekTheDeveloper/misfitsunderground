"use client";

import { useState, useTransition } from "react";
import type { Stream } from "@/lib/content";
import { addStream, moveStream, removeStream, renameStream } from "./actions";

const keyOf = (s: Stream) => `${s.platform}:${s.channel.toLowerCase()}`;
const input = "rounded-lg border border-edge bg-ink px-3 py-2 text-sm outline-none focus:border-acid";
const iconButton = "rounded-md border border-edge px-2 py-1 text-xs text-muted transition hover:border-acid hover:text-white disabled:opacity-30";

export function StreamsEditor({ initial }: { initial: Stream[] }) {
  const [streams, setStreams] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [platform, setPlatform] = useState<Stream["platform"]>("kick");
  const [channel, setChannel] = useState("");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const run = (action: () => Promise<{ ok: true; value: Stream[] } | { ok: false; error: string }>, success?: string) =>
    startTransition(async () => {
      setError(null);
      setNotice(null);
      try {
        const result = await action();
        if (result.ok) {
          setStreams(result.value);
          if (success) setNotice(success);
        } else {
          setError(result.error);
        }
      } catch {
        setError("Something went wrong. Your sign-in may have expired; reload the page.");
      }
    });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel.trim()) return;
    run(async () => {
      const result = await addStream({ platform, channel, name });
      if (result.ok) {
        setChannel("");
        setName("");
      }
      return result;
    }, "Added. It's on the Streams page now.");
  };

  return (
    <div>
      <form onSubmit={add} className="grid gap-2 sm:grid-cols-[auto_1fr_1fr_auto]">
        <select
          aria-label="Platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value as Stream["platform"])}
          className={input}
        >
          <option value="kick">Kick</option>
          <option value="twitch">Twitch</option>
        </select>
        <input
          aria-label="Channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          placeholder="Channel name or link"
          className={input}
          required
        />
        <input
          aria-label="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Display name (optional)"
          className={input}
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-acid px-4 py-2 text-sm font-bold text-ink transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Checking…" : "Add"}
        </button>
      </form>
      <p className="mt-2 text-xs text-muted">
        Pasting a kick.com or twitch.tv link picks the platform for you. The channel is checked before it&apos;s saved.
      </p>
      <div aria-live="polite">
        {error && <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        {notice && <p className="mt-3 rounded-lg border border-acid/30 bg-acid/10 p-3 text-sm text-acid">{notice}</p>}
      </div>

      <ul className="mt-5 divide-y divide-edge rounded-xl border border-edge">
        {streams.length === 0 && <li className="p-4 text-sm text-muted">No streams yet.</li>}
        {streams.map((s, i) => {
          const key = keyOf(s);
          return (
            <li key={key} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
              <span
                className={`w-14 shrink-0 rounded px-1.5 py-0.5 text-center text-[10px] font-bold uppercase tracking-widest ${
                  s.platform === "kick" ? "bg-acid/15 text-acid" : "bg-violet/20 text-violet"
                }`}
              >
                {s.platform}
              </span>
              <div className="min-w-[10rem] flex-1">
                {editing === key ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const value = new FormData(e.currentTarget).get("name") as string;
                      setEditing(null);
                      run(() => renameStream(key, value));
                    }}
                    className="flex gap-2"
                  >
                    <input name="name" defaultValue={s.name ?? ""} placeholder={s.channel} autoFocus className={`${input} min-w-0 flex-1 py-1`} />
                    <button type="submit" className={iconButton}>Save</button>
                    <button type="button" onClick={() => setEditing(null)} className={iconButton}>Cancel</button>
                  </form>
                ) : (
                  <>
                    <div className="truncate font-semibold">{s.name ?? s.channel}</div>
                    <div className="truncate text-xs text-muted">
                      {s.platform === "kick" ? "kick.com" : "twitch.tv"}/{s.channel}
                    </div>
                  </>
                )}
              </div>
              {editing !== key && (
                <div className="ml-auto flex gap-1.5">
                  <button type="button" disabled={pending || i === 0} onClick={() => run(() => moveStream(key, -1))} className={iconButton} aria-label={`Move ${s.name ?? s.channel} up`}>↑</button>
                  <button type="button" disabled={pending || i === streams.length - 1} onClick={() => run(() => moveStream(key, 1))} className={iconButton} aria-label={`Move ${s.name ?? s.channel} down`}>↓</button>
                  <button type="button" disabled={pending} onClick={() => setEditing(key)} className={iconButton}>Rename</button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (confirm(`Remove ${s.name ?? s.channel} from the Streams page?`)) run(() => removeStream(key));
                    }}
                    className={`${iconButton} hover:border-red-400 hover:text-red-300`}
                  >
                    Remove
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-muted">Live channels always sort to the top on the public page; otherwise this order is used.</p>
    </div>
  );
}
