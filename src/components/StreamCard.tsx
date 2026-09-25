"use client";

import { useState } from "react";
import { StreamEmbed, type StreamPlatform } from "./StreamEmbed";

type Props = {
  platform: StreamPlatform;
  channel: string;
  name: string;
  live: boolean;
  viewers: number | null;
};

function chatUrl(platform: StreamPlatform, channel: string) {
  const slug = encodeURIComponent(channel.toLowerCase());
  return platform === "kick"
    ? `https://kick.com/popout/${slug}/chat`
    : `https://www.twitch.tv/embed/${slug}/chat?parent=${window.location.hostname}&darkpopout`;
}

export function StreamCard({ platform, channel, name, live, viewers }: Props) {
  // Chat stays closed (and unloaded) until asked for, so several live channels don't bury the page.
  const [chatOpen, setChatOpen] = useState(false);
  const channelUrl = platform === "kick" ? `https://kick.com/${channel}` : `https://twitch.tv/${channel}`;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="truncate font-display text-3xl">{name}</h2>
          {live && (
            <span className="flex shrink-0 items-center gap-1.5 rounded bg-red-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Live
              {viewers !== null && (
                <span className="font-semibold normal-case tracking-normal text-white/80">
                  · {viewers.toLocaleString("en-US")}
                </span>
              )}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-sm">
          {live && (
            <button
              type="button"
              onClick={() => setChatOpen((open) => !open)}
              aria-expanded={chatOpen}
              className={`rounded-md border px-2.5 py-1 font-semibold transition ${
                chatOpen ? "border-acid bg-acid text-ink" : "border-edge text-white hover:border-acid"
              }`}
            >
              {chatOpen ? "Hide chat" : "Chat"}
            </button>
          )}
          <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="text-muted capitalize hover:text-acid">
            {platform} ↗
          </a>
        </div>
      </div>

      <StreamEmbed platform={platform} channel={channel} />

      {chatOpen && (
        <iframe
          src={chatUrl(platform, channel)}
          title={`${name} chat`}
          className="mt-3 h-[420px] w-full rounded-2xl border border-edge bg-panel"
        />
      )}
    </section>
  );
}
