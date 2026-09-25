"use client";

import { useState } from "react";
import { StreamEmbed, type StreamPlatform } from "./StreamEmbed";

type Props = {
  platform: StreamPlatform;
  channel: string;
  name: string;
  live: boolean;
  viewers: number | null;
  /** Whether this player has sound. */
  audible: boolean;
  onToggleAudio: () => void;
};

function chatUrl(platform: StreamPlatform, channel: string) {
  const slug = encodeURIComponent(channel.toLowerCase());
  return platform === "kick"
    ? `https://kick.com/popout/${slug}/chat`
    : `https://www.twitch.tv/embed/${slug}/chat?parent=${window.location.hostname}&darkpopout`;
}

function popoutUrl(platform: StreamPlatform, channel: string) {
  const slug = encodeURIComponent(channel.toLowerCase());
  return platform === "kick" ? `https://kick.com/popout/${slug}/chat` : `https://www.twitch.tv/popout/${slug}/chat`;
}

function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" />
      {on ? (
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" strokeLinecap="round" />
      ) : (
        <path d="m16 9 6 6m0-6-6 6" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function StreamCard({ platform, channel, name, live, viewers, audible, onToggleAudio }: Props) {
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
              onClick={onToggleAudio}
              aria-pressed={audible}
              aria-label={audible ? `Mute ${name}` : `Unmute ${name}`}
              title={audible ? "Mute" : "Unmute"}
              className={`rounded-md border p-1.5 transition ${
                audible ? "border-acid bg-acid text-ink" : "border-edge text-white hover:border-acid"
              }`}
            >
              <SpeakerIcon on={audible} />
            </button>
          )}
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

      <StreamEmbed platform={platform} channel={channel} muted={!audible} />

      {chatOpen && (
        <>
          <iframe
            src={chatUrl(platform, channel)}
            title={`${name} chat`}
            className="mt-3 h-105 w-full rounded-2xl border border-edge bg-panel"
          />
          {/* Browsers usually don't pass the viewer's Kick/Twitch login into an embedded frame, so
              typing works reliably only in the platform's own pop-out window. */}
          <p className="mt-2 text-right text-xs text-muted">
            Read-only here. To chat,{" "}
            <button
              type="button"
              onClick={() => window.open(popoutUrl(platform, channel), `${channel}-chat`, "width=400,height=700")}
              className="font-semibold text-white underline hover:text-acid"
            >
              Pop out chat ↗
            </button>
          </p>
        </>
      )}
    </section>
  );
}
