"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/config/site";

const tabs = [
  { href: "/", label: "Leaderboard" },
  { href: "/streams", label: "Streams" },
  { href: "/gifters", label: "Gifters" },
  { href: "/merch", label: "Merch" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-edge">
      <div className="flex items-center justify-between py-6">
        <Link href="/" className="font-display text-2xl tracking-wide">
          Misfits <span className="text-acid">Underground</span>
        </Link>
        <a
          href={site.referralUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-acid px-4 py-2 text-sm font-bold text-ink transition hover:brightness-110"
        >
          Join Roobet
        </a>
      </div>
      <nav className="-mb-px flex gap-5 overflow-x-auto sm:gap-6">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 border-b-2 pb-3 text-xs font-semibold sm:text-sm uppercase tracking-widest transition ${
                active ? "border-acid text-white" : "border-transparent text-muted hover:text-white"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
