"use client";

import { useEffect, useState } from "react";

export type StreamPlatform = "kick" | "twitch";

/**
 * Official Kick/Twitch player. Views count toward the channel as long as the player is
 * visible, playing, and not covered by other elements, so keep it large and unobstructed.
 */
export function StreamEmbed({ platform, channel }: { platform: StreamPlatform; channel: string }) {
  // Twitch requires the embedding hostname as `parent`, which is only known in the browser.
  const [host, setHost] = useState<string | null>(null);
  useEffect(() => setHost(window.location.hostname), []);

  const slug = encodeURIComponent(channel.trim().toLowerCase());
  const src =
    platform === "kick"
      ? `https://player.kick.com/${slug}?autoplay=true&muted=true`
      : host && `https://player.twitch.tv/?channel=${slug}&parent=${host}&autoplay=true&muted=true`;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-edge bg-panel">
      {src && (
        <iframe
          src={src}
          title={`${channel} live stream`}
          className="h-full w-full"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
}
