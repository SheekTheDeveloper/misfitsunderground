import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { getAdmin } from "@/lib/adminSession";
import { getReport, type Ranked } from "@/lib/analytics";
import { getLog, getPrizes, getStreams } from "@/lib/content";
import { broadcasterConnection } from "@/lib/kickAuth";
import { redis } from "@/lib/redis";
import { signOut } from "./actions";
import { LocalTime } from "./LocalTime";
import { PrizesEditor } from "./PrizesEditor";
import { StreamsEditor } from "./StreamsEditor";
import { TrafficChart } from "./TrafficChart";

export const metadata: Metadata = {
  title: `Admin | ${site.name}`,
  robots: { index: false, follow: false },
};

const RANGES = [7, 30, 90] as const;

const ERRORS: Record<string, string> = {
  "not-admin": "That Kick account isn't on the admin list.",
  cancelled: "Kick sign-in was cancelled.",
  expired: "Sign-in expired. Try again.",
  kick: "Kick couldn't confirm who you are. If this keeps happening, King's Kick app may be missing the user:read scope.",
};

const PAGE_NAMES: Record<string, string> = { "/": "Leaderboard", "/streams": "Streams", "/gifters": "Gifters", "/merch": "Merch" };
const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryName = (code: string) => {
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
};

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-edge bg-panel p-5 sm:p-6 ${className}`}>
      <h2 className="mb-4 font-display text-2xl tracking-wide">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-edge bg-ink px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
      <div className="mt-1 truncate font-display text-3xl tabular-nums">{value}</div>
      {note && <div className="truncate text-xs text-muted">{note}</div>}
    </div>
  );
}

function RankedList({ title, rows, format = (s) => s, empty }: { title: string; rows: Ranked; format?: (s: string) => string; empty: string }) {
  const max = rows[0]?.count ?? 1;
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.slice(0, 8).map((r) => (
            <li key={r.label} className="relative flex justify-between gap-3 overflow-hidden rounded-md px-2 py-1 text-sm">
              <span className="absolute inset-y-0 left-0 rounded-md bg-violet/20" style={{ width: `${(r.count / max) * 100}%` }} />
              <span className="relative truncate">{format(r.label)}</span>
              <span className="relative tabular-nums text-muted">{r.count.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SignIn({ error }: { error?: string }) {
  return (
    <section className="mx-auto max-w-md py-16 text-center">
      <h1 className="font-display text-6xl leading-none">
        Admin <span className="text-acid">Panel</span>
      </h1>
      <p className="mt-4 text-sm text-muted">For the Misfits crew only. Sign in with your Kick account.</p>
      {error && (
        <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {ERRORS[error] ?? "Sign-in failed. Try again."}
        </p>
      )}
      {/* A plain link: this starts a redirect to Kick, not a client-side navigation. */}
      <a
        href="/api/admin/login"
        className="mt-8 inline-block rounded-lg bg-acid px-6 py-3 font-bold text-ink transition hover:brightness-110"
      >
        Log in with Kick
      </a>
      <p className="mt-4 text-xs text-muted">Kick only tells this site your username. No password or email is shared.</p>
    </section>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ days?: string; error?: string }> }) {
  const { days: daysParam, error } = await searchParams;
  const admin = await getAdmin();
  if (!admin) return <SignIn error={error} />;

  const days = RANGES.find((r) => String(r) === daysParam) ?? 30;
  const [report, streams, prizes, log, kicks] = await Promise.all([
    getReport(days).catch((err) => (console.error("Failed to load analytics:", err), null)),
    getStreams(),
    getPrizes(),
    getLog(),
    broadcasterConnection().catch(() => null),
  ]);

  const roobetClicks = report?.outbound.find((o) => o.label === "roobet.com")?.count ?? 0;
  const topPage = report?.pages[0];
  const checks: [string, boolean, string][] = [
    ["Database (Upstash)", Boolean(redis()), "Needed for admin edits, analytics, and KICKs."],
    ["Roobet leaderboard", Boolean(process.env.ROOBET_API_TOKEN && process.env.ROOBET_USER_ID), "ROOBET_API_TOKEN and ROOBET_USER_ID"],
    ["Kick app", Boolean(process.env.KICK_CLIENT_ID && process.env.KICK_CLIENT_SECRET), "KICK_CLIENT_ID and KICK_CLIENT_SECRET"],
    ["KICKs connection", Boolean(kicks), kicks ? "King's Kick account is connected." : "King needs to connect at /api/kick/login."],
    ["Merch products", Boolean(process.env.FOURTHWALL_STOREFRONT_TOKEN), "FOURTHWALL_STOREFRONT_TOKEN"],
  ];

  return (
    <div className="space-y-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl leading-none sm:text-6xl">
            Admin <span className="text-acid">Panel</span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            Signed in as <span className="font-semibold text-white">{admin.name}</span>
          </p>
        </div>
        <form action={signOut}>
          <button className="rounded-lg border border-edge px-4 py-2 text-sm text-muted transition hover:border-acid hover:text-white">
            Log out
          </button>
        </form>
      </div>

      <Panel title="Traffic">
        <div className="-mt-2 mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">Cookieless and anonymous. Bots and visitors with Do Not Track / GPC aren&apos;t counted.</p>
          <nav className="flex gap-1 rounded-lg border border-edge p-1" aria-label="Date range">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/admin?days=${r}`}
                aria-current={r === days ? "page" : undefined}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  r === days ? "bg-acid text-ink" : "text-muted hover:text-white"
                }`}
              >
                {r}d
              </Link>
            ))}
          </nav>
        </div>
        {!report ? (
          <p className="text-sm text-muted">Analytics need the Upstash database.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Page views" value={report.views.toLocaleString()} />
              <Stat label="Visitors" value={report.visitors.toLocaleString()} note="Unique, estimated" />
              <Stat label="Roobet clicks" value={roobetClicks.toLocaleString()} note="Clicks on Roobet links" />
              <Stat label="Top page" value={topPage ? (PAGE_NAMES[topPage.label] ?? topPage.label) : "—"} note={topPage ? `${topPage.count.toLocaleString()} views` : undefined} />
            </div>
            <div className="mt-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Daily page views (UTC days)</h3>
              <TrafficChart days={report.days} />
            </div>
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <RankedList title="Pages" rows={report.pages} format={(p) => PAGE_NAMES[p] ?? p} empty="No views yet." />
              <RankedList title="Referrers" rows={report.referrers} empty="No referrals yet. Direct visits aren't listed." />
              <RankedList title="Countries" rows={report.countries} format={countryName} empty="No views yet." />
              <RankedList title="Devices" rows={report.devices} format={(d) => d[0].toUpperCase() + d.slice(1)} empty="No views yet." />
              <RankedList title="Outbound clicks" rows={report.outbound} empty="No outbound clicks yet." />
            </div>
          </>
        )}
      </Panel>

      <Panel title="Streams">
        <StreamsEditor initial={streams} />
      </Panel>

      <Panel title="Leaderboard prizes">
        <PrizesEditor initial={prizes} maxPlaces={site.displayCount} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Site status">
          <ul className="space-y-3">
            {checks.map(([name, ok, detail]) => (
              <li key={name} className="flex items-start gap-3 text-sm">
                <span
                  className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                    ok ? "bg-acid/15 text-acid" : "bg-red-500/15 text-red-300"
                  }`}
                >
                  {ok ? "✓ OK" : "✕ Off"}
                </span>
                <div>
                  <div className="font-semibold">{name}</div>
                  <div className="text-xs text-muted">{detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Recent changes">
          {log.length === 0 ? (
            <p className="text-sm text-muted">Nothing yet. Changes made here are listed with who made them.</p>
          ) : (
            <ul className="space-y-2.5 text-sm">
              {log.map((entry, i) => (
                <li key={i}>
                  <span className="font-semibold">{entry.who}</span> <span className="text-muted">{entry.action}</span>
                  <div className="text-xs text-muted">
                    <LocalTime at={entry.at} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
