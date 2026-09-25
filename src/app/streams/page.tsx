import type { Metadata } from "next";
import { StreamCard } from "@/components/StreamCard";
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
            <StreamCard
              key={streamKey(s)}
              platform={s.platform}
              channel={s.channel}
              name={s.name ?? s.channel}
              live={Boolean(s.status?.live)}
              viewers={s.status?.viewers ?? null}
            />
          ))}
        </div>
      )}
    </>
  );
}
