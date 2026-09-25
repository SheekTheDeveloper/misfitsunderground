import type { Metadata } from "next";
import { StreamEmbed } from "@/components/StreamEmbed";
import { site } from "@/config/site";
import { getLiveStatuses, streamKey } from "@/lib/live";

export const metadata: Metadata = {
  title: `Streams | ${site.name}`,
};

// Live status refreshes at most once a minute.
export const revalidate = 60;

export default async function StreamsPage() {
  const statuses = await getLiveStatuses(site.streams);
  const withStatus = site.streams.map((s) => ({ ...s, status: statuses.get(streamKey(s)) }));
  // Live channels first; otherwise keep the order from the config.
  const sorted = [...withStatus.filter((s) => s.status?.live), ...withStatus.filter((s) => !s.status?.live)];
  const liveCount = withStatus.filter((s) => s.status?.live).length;

  return (
    <>
      <section className="py-10 text-center">
        <h1 className="font-display text-6xl leading-none sm:text-7xl">
          Live <span className="text-acid">Streams</span>
        </h1>
        <p className="mt-4 text-muted">
          {liveCount > 0 ? `${liveCount} of the crew live right now.` : "Nobody's live right now. Check back soon."}
        </p>
      </section>

      {sorted.length === 0 ? (
        <p className="rounded-2xl border border-edge bg-panel p-10 text-center text-muted">
          No streams yet. Check back soon.
        </p>
      ) : (
        // Wider than the rest of the site so two players per row stay a watchable size.
        <div className="relative left-1/2 grid w-[min(72rem,calc(100vw-2rem))] -translate-x-1/2 gap-x-6 gap-y-10 md:grid-cols-2">
          {sorted.map((s) => (
            <section key={streamKey(s)}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <h2 className="truncate font-display text-3xl">{s.name ?? s.channel}</h2>
                  {s.status?.live && (
                    <span className="flex shrink-0 items-center gap-1.5 rounded bg-red-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                      Live
                      {s.status.viewers !== null && (
                        <span className="font-semibold normal-case tracking-normal text-white/80">
                          · {s.status.viewers.toLocaleString("en-US")}
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <a
                  href={s.platform === "kick" ? `https://kick.com/${s.channel}` : `https://twitch.tv/${s.channel}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-sm text-muted capitalize hover:text-acid"
                >
                  {s.platform} ↗
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
