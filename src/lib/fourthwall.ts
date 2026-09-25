import "server-only";
import { unstable_cache } from "next/cache";

const API_URL = "https://storefront-api.fourthwall.com/v1/collections/all/products";

type Money = { value: number; currency: string };
type Image = { url: string; transformedUrl?: string };

type FourthwallOffer = {
  type: "PRODUCT" | "BUNDLE";
  name: string;
  slug: string;
  state: { type: "AVAILABLE" | "SOLD_OUT" };
  images: Image[];
  variants?: { unitPrice: Money; compareAtPrice?: Money | null }[];
  price?: Money;
  compareAtPrice?: Money | null;
};

export type MerchItem = {
  name: string;
  url: string;
  image: string | null;
  price: Money | null;
  compareAtPrice: Money | null;
  soldOut: boolean;
};

/** Returns null when no storefront token is configured or the request fails. */
export async function getMerch(shopUrl: string): Promise<MerchItem[] | null> {
  const token = process.env.FOURTHWALL_STOREFRONT_TOKEN;
  if (!token) return null;

  try {
    return await cachedMerch(shopUrl, token);
  } catch (err) {
    console.error("Failed to load Fourthwall products:", err);
    return null;
  }
}

// Raw API pages are several MB each (too big for Next's fetch cache), so cache the trimmed list
// instead. Errors throw through so a failed load is never cached.
const cachedMerch = unstable_cache(
  async (shopUrl: string, token: string): Promise<MerchItem[]> => {
    const offers: FourthwallOffer[] = [];
    // The API pages at most 50 products at a time; cap the loop so a bad response can't spin forever.
    for (let page = 0; page < 20; page++) {
      const url = new URL(API_URL);
      url.searchParams.set("storefront_token", token);
      url.searchParams.set("currency", "USD");
      url.searchParams.set("size", "50");
      url.searchParams.set("page", String(page));

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Fourthwall responded ${res.status}`);

      const { results, paging } = (await res.json()) as {
        results: FourthwallOffer[];
        paging?: { hasNextPage: boolean };
      };
      offers.push(...results);
      if (!paging?.hasNextPage) break;
    }

    return offers.map((offer) => {
      // Products show their cheapest variant; bundles carry a price of their own.
      const cheapest = offer.variants?.reduce((min, v) => (v.unitPrice.value < min.unitPrice.value ? v : min));
      return {
        name: offer.name,
        url: `${shopUrl}/products/${offer.slug}`,
        image: offer.images[0]?.transformedUrl ?? offer.images[0]?.url ?? null,
        price: offer.type === "BUNDLE" ? (offer.price ?? null) : (cheapest?.unitPrice ?? null),
        compareAtPrice: offer.type === "BUNDLE" ? (offer.compareAtPrice ?? null) : (cheapest?.compareAtPrice ?? null),
        soldOut: offer.state.type === "SOLD_OUT",
      };
    });
  },
  ["fourthwall-merch"],
  { revalidate: 600 },
);
