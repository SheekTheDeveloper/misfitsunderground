import type { Metadata } from "next";
import { site } from "@/config/site";
import { getMerch } from "@/lib/fourthwall";

export const metadata: Metadata = {
  title: `Merch | ${site.name}`,
};

export const revalidate = 600;

const money = (m: { value: number; currency: string }) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: m.currency }).format(m.value);

export default async function MerchPage() {
  const items = await getMerch(site.merchUrl);

  return (
    <>
      <section className="py-10 text-center">
        <h1 className="font-display text-6xl leading-none sm:text-7xl">
          Official <span className="text-acid">Merch</span>
        </h1>
        <p className="mt-4 text-muted">Rep the crew.</p>
      </section>

      {items && items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {items.map((item) => (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group overflow-hidden rounded-2xl border border-edge bg-panel transition hover:border-acid/50"
            >
              <div className="relative aspect-square bg-ink">
                {item.image && (
                  // Plain <img>: Fourthwall serves already-resized images from its own CDN.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                )}
                {item.soldOut && (
                  <span className="absolute left-2 top-2 rounded bg-ink/80 px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
                    Sold out
                  </span>
                )}
              </div>
              <div className="p-3 sm:p-4">
                <h2 className="truncate text-sm font-semibold sm:text-base">{item.name}</h2>
                {item.price && (
                  <p className="mt-1 text-sm">
                    <span className="font-semibold text-acid">{money(item.price)}</span>
                    {item.compareAtPrice && item.compareAtPrice.value > item.price.value && (
                      <span className="ml-2 text-muted line-through">{money(item.compareAtPrice)}</span>
                    )}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      ) : null}

      <div className="mt-8 text-center">
        <a
          href={site.merchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg bg-acid px-6 py-3 font-bold text-ink transition hover:brightness-110"
        >
          {items && items.length > 0 ? "View full shop" : "Shop the merch"} ↗
        </a>
      </div>
    </>
  );
}
