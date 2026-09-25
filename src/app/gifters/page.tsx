import type { Metadata } from "next";
import { site } from "@/config/site";
import { getGiftLeaderboards, getKicksLeaderboards } from "@/lib/kick";

export const metadata: Metadata = {
  title: `Top Gifters | ${site.name}`,
};

export const revalidate = 300;

const rankColors = ["text-gold", "text-silver", "text-bronze"];

type Row = { username: string; value: number };

function GifterList({
  title,
  rows,
  empty,
  highlight,
}: {
  title: string;
  rows: Row[];
  empty: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border bg-panel p-5 ${highlight ? "border-acid/40" : "border-edge"}`}>
      <h3 className="font-display text-3xl">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{empty}</p>
      ) : (
        <ol className="mt-3 divide-y divide-edge/60">
          {rows.slice(0, 10).map((g, i) => (
            <li key={g.username} className="flex items-center gap-3 py-2.5">
              <span className={`w-8 font-display text-xl ${rankColors[i] ?? "text-muted"}`}>#{i + 1}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{g.username}</span>
              <span className="font-semibold tabular-nums text-acid">{g.value.toLocaleString("en-US")}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default async function GiftersPage() {
  const [subs, kicks] = await Promise.all([getGiftLeaderboards(site.giftersChannel), getKicksLeaderboards()]);
  const subRows = (list: { username: string; quantity: number }[]) =>
    list.map((g) => ({ username: g.username, value: g.quantity }));
  const kickRows = (list: { username: string; amount: number }[]) =>
    list.map((k) => ({ username: k.username, value: k.amount }));

  return (
    <>
      <section className="py-10 text-center">
        <h1 className="font-display text-6xl leading-none sm:text-7xl">
          Top <span className="text-acid">Gifters</span>
        </h1>
        <p className="mt-4 text-muted">
          Gifted subs and KICKs on{" "}
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

      <h2 className="mb-4 font-display text-4xl">Gifted Subs</h2>
      {subs ? (
        <div className="grid gap-4 md:grid-cols-3">
          <GifterList title="This Week" rows={subRows(subs.week)} empty="No gifted subs yet. Be the first." />
          <GifterList title="This Month" rows={subRows(subs.month)} empty="No gifted subs yet. Be the first." highlight />
          <GifterList title="All Time" rows={subRows(subs.allTime)} empty="No gifted subs yet. Be the first." />
        </div>
      ) : (
        <p className="rounded-2xl border border-edge bg-panel p-10 text-center text-muted">
          Gifted sub stats are temporarily unavailable. Check back in a few minutes.
        </p>
      )}

      {kicks && (
        <>
          <h2 className="mb-4 mt-12 font-display text-4xl">
            Top <span className="text-acid">KICKs</span>
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <GifterList title="This Week" rows={kickRows(kicks.week)} empty="No KICKs yet. Be the first." />
            <GifterList title="This Month" rows={kickRows(kicks.month)} empty="No KICKs yet. Be the first." highlight />
            <GifterList title="All Time" rows={kickRows(kicks.allTime)} empty="No KICKs yet. Be the first." />
          </div>
        </>
      )}

      <p className="mt-6 text-center text-xs text-muted">Updates every 5 minutes.</p>
    </>
  );
}
