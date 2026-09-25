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
  // Key of the one stream with sound; unmuting another mutes this one so streams never talk over each other.
  const [audibleKey, setAudibleKey] = useState<string | null>(null);

  return (
    // Wider than the rest of the site so two players per row stay a watchable size.
    <div className="relative left-1/2 grid w-[min(72rem,calc(100vw-2rem))] -translate-x-1/2 gap-x-6 gap-y-10 md:grid-cols-2">
      {streams.map(({ key, ...s }) => (
        <StreamCard
          key={key}
          {...s}
          audible={audibleKey === key}
          onToggleAudio={() => setAudibleKey((current) => (current === key ? null : key))}
        />
      ))}
    </div>
  );
}
