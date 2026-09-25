import "server-only";

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
    const url = new URL(API_URL);
    url.searchParams.set("storefront_token", token);
    url.searchParams.set("currency", "USD");
    url.searchParams.set("size", "50");

    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`Fourthwall responded ${res.status}`);

    const { results } = (await res.json()) as { results: FourthwallOffer[] };
    return results.map((offer) => {
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
  } catch (err) {
    console.error("Failed to load Fourthwall products:", err);
    return null;
  }
}
