"use client";

import { useState } from "react";
import { StreamCard } from "./StreamCard";
import type { StreamPlatform } from "./StreamEmbed";

export type GridStream = {
  key: string;
  platform: StreamPlatform;
  channel: string;
  name: string;
  live: boolean;
  viewers: number | null;
};

export function StreamGrid({ streams }: { streams: GridStream[] }) {
  // Streams with sound on. Each toggles independently, so several can play audio at once.
  const [audible, setAudible] = useState<ReadonlySet<string>>(new Set());

  const toggleAudio = (key: string) =>
    setAudible((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    // Wider than the rest of the site so two players per row stay a watchable size.
    <div className="relative left-1/2 grid w-[min(72rem,calc(100vw-2rem))] -translate-x-1/2 gap-x-6 gap-y-10 md:grid-cols-2">
      {streams.map(({ key, ...s }) => (
        <StreamCard
          key={key}
          {...s}
          audible={audible.has(key)}
          onToggleAudio={() => toggleAudio(key)}
        />
      ))}
    </div>
  );
}
