import type { Metadata } from "next";
import { StreamEmbed } from "@/components/StreamEmbed";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: `Streams | ${site.name}`,
};

export default function StreamsPage() {
  return (
    <>
      <section className="py-10 text-center">
        <h1 className="font-display text-6xl leading-none sm:text-7xl">
          Live <span className="text-acid">Streams</span>
        </h1>
        <p className="mt-4 text-muted">Catch the action live.</p>
      </section>

      {site.streams.length === 0 ? (
        <p className="rounded-2xl border border-edge bg-panel p-10 text-center text-muted">
          No streams yet. Check back soon.
        </p>
      ) : (
        <div className="space-y-10">
          {site.streams.map((s) => (
            <section key={`${s.platform}:${s.channel}`}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-3xl">{s.name ?? s.channel}</h2>
                <a
                  href={s.platform === "kick" ? `https://kick.com/${s.channel}` : `https://twitch.tv/${s.channel}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted capitalize hover:text-acid"
                >
                  Watch on {s.platform} ↗
                </a>
              </div>
              <StreamEmbed platform={s.platform} channel={s.channel} />
            </section>
          ))}
        </div>
      )}
    </>
  );
}
