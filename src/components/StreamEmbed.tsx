"use client";

import { useEffect, useRef, useState } from "react";

export type StreamPlatform = "kick" | "twitch";

/**
 * Official Kick/Twitch player. Views only count while the player is actually playing, so it
 * should stay large, visible, and not covered by other elements.
 */
export function StreamEmbed({
  platform,
  channel,
  muted = true,
}: {
  platform: StreamPlatform;
  channel: string;
  muted?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  // Twitch requires the embedding hostname as `parent`, which is only known in the browser.
  const [host, setHost] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Browsers refuse autoplay in background tabs, and the Kick player never retries, so only
  // load the player once the tab is in front and the embed is on screen.
  useEffect(() => {
    setHost(window.location.hostname);
    const box = boxRef.current;
    if (!box) return;

    let onScreen = false;
    const check = () => {
      if (onScreen && document.visibilityState === "visible") setReady(true);
    };
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      check();
    });
    observer.observe(box);
    document.addEventListener("visibilitychange", check);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  const slug = encodeURIComponent(channel.trim().toLowerCase());
  const src =
    platform === "kick"
      ? `https://player.kick.com/${slug}?autoplay=true&muted=${muted}`
      : host && `https://player.twitch.tv/?channel=${slug}&parent=${host}&autoplay=true&muted=${muted}`;

  return (
    <div ref={boxRef} className="aspect-video w-full overflow-hidden rounded-2xl border border-edge bg-panel">
      {ready && src && (
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
