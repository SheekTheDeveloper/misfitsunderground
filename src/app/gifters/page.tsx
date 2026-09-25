import type { Metadata } from "next";
import { site } from "@/config/site";
import { getGiftLeaderboards, type Gifter } from "@/lib/kick";

export const metadata: Metadata = {
  title: `Top Gifters | ${site.name}`,
};

export const revalidate = 300;

const rankColors = ["text-gold", "text-silver", "text-bronze"];

function GifterList({ title, gifters, highlight }: { title: string; gifters: Gifter[]; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-panel p-5 ${highlight ? "border-acid/40" : "border-edge"}`}>
      <h2 className="font-display text-3xl">{title}</h2>
      {gifters.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No gifted subs yet. Be the first.</p>
      ) : (
        <ol className="mt-3 divide-y divide-edge/60">
          {gifters.slice(0, 10).map((g, i) => (
            <li key={g.username} className="flex items-center gap-3 py-2.5">
              <span className={`w-8 font-display text-xl ${rankColors[i] ?? "text-muted"}`}>#{i + 1}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{g.username}</span>
              <span className="font-semibold tabular-nums text-acid">{g.quantity}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default async function GiftersPage() {
  const boards = await getGiftLeaderboards(site.giftersChannel);

  return (
    <>
      <section className="py-10 text-center">
        <h1 className="font-display text-6xl leading-none sm:text-7xl">
          Top <span className="text-acid">Gifters</span>
        </h1>
        <p className="mt-4 text-muted">
          Gifted subs on{" "}
          <a
            href={`https://kick.com/${site.giftersChannel}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline hover:text-acid"
          >
            King_Violence&apos;s Kick
          </a>
          . Thank you for the support.
        </p>
      </section>

      {boards ? (
        <div className="grid gap-4 md:grid-cols-3">
          <GifterList title="This Week" gifters={boards.week} />
          <GifterList title="This Month" gifters={boards.month} highlight />
          <GifterList title="All Time" gifters={boards.allTime} />
        </div>
      ) : (
        <p className="rounded-2xl border border-edge bg-panel p-10 text-center text-muted">
          Gifter stats are temporarily unavailable. Check back in a few minutes.
        </p>
      )}

      <p className="mt-6 text-center text-xs text-muted">Updates every 5 minutes. Counts are gifted subs.</p>
    </>
  );
}
