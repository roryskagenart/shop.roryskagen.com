import { PRODUCT_COLLECTIONS } from "lib/taxonomy";
import { Cart, Collection, Product } from "lib/types";
import { cleanEnv } from "lib/utils";
import { RoryArtwork } from "./importer";
import originalsData from "./originals-data.json";
import { reshapeCart, reshapeProduct, reshapeProducts } from "./reshape";
import roryArtworksData from "./rory-artworks-data.json";
import { FourthwallCart, FourthwallCollection, FourthwallOgImageResponse, FourthwallProduct, FourthwallShop } from "./types";

export interface RoryOriginal {
  id: string;
  slug: string;
  title: string;
  originalTitle: string;
  priceUSD: number;
  medium: string;
  dimensions: string;
  year: string;
  series: string;
  status: string;
  provenance: string;
  description: string;
  image: {
    url: string;
    transformedUrl: string;
    width: number;
    height: number;
    altText: string;
  };
  collections: string[];
  variants: {
    id: string;
    name: string;
    price: number;
    description: string;
  }[];
}

const ORIGINALS: RoryOriginal[] = originalsData as RoryOriginal[];

function getBaseApiUrl(): string {
  let url = cleanEnv(process.env.NEXT_PUBLIC_FW_API_URL) || 'https://storefront-api.fourthwall.com/v1';
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  if (!url.endsWith('/v1')) {
    url += '/v1';
  }
  return url;
}

const API_URL = getBaseApiUrl();
const STOREFRONT_TOKEN = cleanEnv(process.env.NEXT_PUBLIC_FW_STOREFRONT_TOKEN);

/**
 * Helpers
 */
class FourthwallError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const isTokenPlaceholderOrEmpty = !STOREFRONT_TOKEN || STOREFRONT_TOKEN.startsWith('ptkn_...') || STOREFRONT_TOKEN.includes('xxx');

async function fourthwallGet<T>(
  url: string,
  query: Record<string, string | number | undefined>,
  options: RequestInit & { next?: NextFetchRequestConfig } = {}
): Promise<{ status: number; body: T }> {
  if (isTokenPlaceholderOrEmpty) {
    throw new FourthwallError("Storefront token not configured or placeholder", 401);
  }

  const constructedUrl = new URL(url);
  Object.keys(query).forEach((key) => {
    if (query[key] !== undefined) {
      constructedUrl.searchParams.append(key, query[key]!.toString());
    }
  });
  constructedUrl.searchParams.append('storefront_token', STOREFRONT_TOKEN);

  const { next, ...fetchOptions } = options;

  let result: Response;
  try {
    result = await fetch(
      constructedUrl.toString(),
      {
        method: 'GET',
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers
        },
        next,
      }
    );
  } catch (netErr: any) {
    throw new FourthwallError(netErr.message || "Network error fetching from Fourthwall", 500);
  }

  const bodyRaw = await result.text();
  let body: T;
  try {
    const trimmed = bodyRaw.trim();
    if (trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE')) {
      throw new FourthwallError("Received HTML document instead of JSON", result.status);
    }
    body = JSON.parse(trimmed);
  } catch (parseErr: any) {
    throw new FourthwallError(parseErr.message || "Failed to parse Fourthwall response", result.status || 500);
  }

  if (result.status !== 200) {
    console.warn(`[AI Studio] Fourthwall API returned status ${result.status}`);
    throw new FourthwallError("Failed to fetch from Fourthwall", result.status);
  }

  return {
    status: result.status,
    body,
  };
}

async function fourthwallPost<T>(url: string, data: any, options: RequestInit = {}): Promise<{ status: number; body: T }> {
  if (isTokenPlaceholderOrEmpty) {
    throw new FourthwallError("Storefront token not configured or placeholder", 401);
  }

  try {
    const result = await fetch(`${url}?storefront_token=${STOREFRONT_TOKEN}`, {
      method: 'POST',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data)
    });

    const bodyRaw = await result.text();
    const body = JSON.parse(bodyRaw);

    if (result.status < 200 || result.status >= 300) {
      throw new FourthwallError("Failed Fourthwall POST", result.status);
    }

    return {
      status: result.status,
      body
    };
  } catch (e) {
    throw {
      error: e,
      url,
      data
    };
  }
}

/**
 * Fallback Mock Data for Rory Skagen Art
 */
const MOCK_SHOP: FourthwallShop = {
  id: 'rory-skagen-art',
  name: 'Rory Skagen Art',
  domain: 'shop.roryskagen.com',
  publicDomain: 'shop.roryskagen.com'
};

// NOTE: a `MOCK_COLLECTIONS` list lived here — a second, hand-maintained copy of the same eight
// categories as `lib/taxonomy.ts`, with different titles and no badges, price ranges or audiences.
// It was unreachable (see `getCollections`) and duplicating the taxonomy is what let the two drift
// apart. Navigation now comes from `PRODUCT_COLLECTIONS` in one place.

const RORY_ARTWORKS: RoryArtwork[] = roryArtworksData as RoryArtwork[];

function buildOriginalProduct(raw: RoryOriginal, currency = 'USD'): FourthwallProduct {
  const currencyRates: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    CAD: 1.36,
    AUD: 1.52
  };
  const rate = currencyRates[currency] || 1;

  const imageObj = {
    id: `${raw.id}-img`,
    url: raw.image.url,
    transformedUrl: raw.image.transformedUrl,
    width: raw.image.width || 1200,
    height: raw.image.height || 800
  };

  const variants = raw.variants.map((v, idx) => {
    const rawVal = Math.round(v.price * rate * 100) / 100;
    return {
      id: v.id,
      name: v.name,
      sku: `ORIG-${raw.slug.substring(0, 8).toUpperCase()}-${idx}`,
      unitPrice: {
        value: rawVal,
        currency
      },
      images: [imageObj],
      stock: {
        type: 'UNLIMITED' as const
      },
      attributes: {
        description: v.description,
        edition: '1-of-1 Original Masterwork',
        medium: raw.medium,
        dimensions: raw.dimensions,
        size: { name: v.name }
      },
      product: {
        id: raw.id,
        slug: raw.slug,
        name: raw.title
      }
    };
  });

  return {
    id: raw.id,
    name: raw.title,
    slug: raw.slug,
    description: `${raw.description}\n\n**Authenticity & Delivery:**\n- Certified 1-of-1 Original Enamel Artwork\n- Hand-signed Certificate of Authenticity (CoA)\n- Heavy-duty French cleat hanging hardware pre-installed\n- Insured freight delivery in custom wooden crate included`,
    images: [imageObj],
    variants,
    updatedAt: new Date().toISOString()
  };
}

function buildRoryProduct(raw: RoryArtwork, currency = 'USD'): FourthwallProduct {
  const currencyRates: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    CAD: 1.36,
    AUD: 1.52
  };
  const rate = currencyRates[currency] || 1;

  const imageObj = {
    id: `${raw.id}-img`,
    url: raw.image.url,
    transformedUrl: raw.image.transformedUrl,
    width: raw.image.width || 1200,
    height: raw.image.height || 800
  };

  const variants = raw.variantOptions.map((opt, idx) => {
    const rawVal = Math.round(raw.basePriceUSD * opt.priceMultiplier * rate * 100) / 100;
    return {
      id: `${raw.id}-var-${idx}`,
      name: opt.name,
      sku: `${raw.slug.substring(0, 8).toUpperCase()}-${idx}`,
      unitPrice: {
        value: rawVal,
        currency
      },
      images: [imageObj],
      stock: {
        type: 'UNLIMITED' as const
      },
      attributes: {
        description: opt.name,
        size: { name: opt.size || opt.name }
      },
      product: {
        id: raw.id,
        slug: raw.slug,
        name: raw.title
      }
    };
  });

  return {
    id: raw.id,
    name: raw.title,
    slug: raw.slug,
    description: raw.description,
    images: [imageObj],
    variants,
    updatedAt: raw.date ? new Date(raw.date).toISOString() : new Date().toISOString()
  };
}

/**
 * In-Memory Cart Store
 */
const inMemoryCarts = new Map<string, FourthwallCart>();

/**
 * Collection operations
 */
/**
 * Storefront navigation.
 *
 * `lib/taxonomy.ts` is the navigation DESIGN: it carries the badge, price range, hero tagline and
 * target audiences that the UI renders, and it marks categories as `active` / `inquiry` / `roadmap`.
 * Roadmap categories are not dead entries — the collection page has a purpose-built "Collection in
 * Production" empty state that lists their `sampleProducts`.
 *
 * This function used to discard that entire design the moment Fourthwall returned anything at all:
 *
 *     if (res.body?.results?.length) return res.body.results.map(...)
 *     return MOCK_COLLECTIONS
 *
 * Fourthwall answers with its two built-in collections (`featured`, `all`), so the branch always
 * won and an eight-category navigation silently collapsed to two. `MOCK_COLLECTIONS` — the curated
 * fallback — was unreachable code, and `PRODUCT_COLLECTIONS` was imported here but never used.
 *
 * Fourthwall is now a SUPPLEMENT rather than a replacement: its collections are appended when they
 * are not already part of the taxonomy, so a collection created in the dashboard still surfaces.
 */
export async function getCollections(): Promise<Collection[]> {
  const curated: Collection[] = PRODUCT_COLLECTIONS.map((collection) => ({
    handle: collection.handle,
    title: collection.title,
    description: collection.description,
  }));

  const allProducts: Collection = {
    handle: 'all',
    title: 'All Products',
    description: 'Browse the entire Rory Skagen studio archive.',
  };

  let remote: Collection[] = [];
  try {
    const res = await fourthwallGet<{ results: FourthwallCollection[] }>(
      `${API_URL}/collections`,
      {},
      { next: { revalidate: 3600 } }
    );

    remote = (res.body?.results ?? []).map((collection) => ({
      handle: collection.slug,
      title: collection.name,
      description: collection.description,
    }));
  } catch {
    // Fourthwall unreachable — the curated taxonomy is still a complete navigation on its own,
    // which is precisely why it must not be treated as a fallback.
  }

  const known = new Set<string>([...curated.map((c) => c.handle), allProducts.handle]);
  const extras = remote.filter((collection) => collection.handle && !known.has(collection.handle));

  return [...curated, allProducts, ...extras];
}

export async function getCollectionProducts({
  collection,
  currency = 'USD',
  limit,
}: {
  collection: string;
  currency: string;
  limit?: number;
}): Promise<Product[]> {
  const normCollection = (collection || 'fine-art-originals').toLowerCase();

  try {
    const res = await fourthwallGet<{ results: FourthwallProduct[] }>(
      `${API_URL}/collections/${collection}/products`,
      { currency, limit },
      { next: { revalidate: 3600, tags: [`collection-${collection}`] } }
    );

    if (res.body?.results && res.body.results.length > 0) {
      return reshapeProducts(res.body.results);
    }
  } catch {
    // Fall back to catalog artworks
  }

  // 1. If requesting the Premier Studio Collection "fine-art-originals", or default "launch" or empty
  if (normCollection === 'fine-art-originals' || normCollection === 'launch' || normCollection === '') {
    const list = limit ? ORIGINALS.slice(0, limit) : ORIGINALS;
    return reshapeProducts(list.map((o) => buildOriginalProduct(o, currency)));
  }

  // 2. If requesting "all"
  if (normCollection === 'all') {
    const originalProds = ORIGINALS.map((o) => buildOriginalProduct(o, currency));
    const artworkProds = RORY_ARTWORKS.map((p) => buildRoryProduct(p, currency));
    const combined = [...originalProds, ...artworkProds];
    const sliced = limit ? combined.slice(0, limit) : combined;
    return reshapeProducts(sliced);
  }

  // 3. Check if matching originals belong to this collection handle
  const matchingOriginals = ORIGINALS.filter((o) =>
    o.collections.some((c) => c.toLowerCase() === normCollection)
  );

  // 4. Check if matching artworks belong to this collection handle
  const matchingArtworks = RORY_ARTWORKS.filter((p) =>
    p.collections.some((c) => c.toLowerCase() === normCollection)
  );

  if (matchingOriginals.length > 0 || matchingArtworks.length > 0) {
    const originalProds = matchingOriginals.map((o) => buildOriginalProduct(o, currency));
    const artworkProds = matchingArtworks.map((p) => buildRoryProduct(p, currency));
    const combined = [...originalProds, ...artworkProds];
    const sliced = limit ? combined.slice(0, limit) : combined;
    return reshapeProducts(sliced);
  }

  // Nothing matched this handle. Return empty so the collection page renders its designed
  // "Collection in Production" empty state.
  //
  // This used to return the fifteen fine-art originals for ANY unmatched handle. The effect was that
  // every category without products — `apparel`, `desk-art`, `metal-litho`, `canvas-prints`,
  // `b2b-corporate-gifts` — silently rendered the same fifteen $4k–$28k originals, and the empty
  // state could never render because `products.length` was never 0. A category that lies about its
  // contents is worse than a category that admits it is empty.
  return [];
}

/**
 * Product operations
 */
export async function getProduct({ handle, currency = 'USD' }: { handle: string; currency: string }): Promise<Product | undefined> {
  try {
    const res = await fourthwallGet<FourthwallProduct>(
      `${API_URL}/products/${handle}`,
      { currency },
      { next: { revalidate: 3600, tags: [`product-${handle}`] } }
    );

    if (res.body) {
      return reshapeProduct(res.body);
    }
  } catch (e) {
    if (e instanceof FourthwallError && e.status === 404) {
      // Check catalog artworks before failing
    }
  }

  // Check in 15 Fine Art Originals first!
  const foundOriginal = ORIGINALS.find((o) => o.slug === handle || o.id === handle);
  if (foundOriginal) {
    return reshapeProduct(buildOriginalProduct(foundOriginal, currency));
  }

  // Check in general archive
  const found = RORY_ARTWORKS.find((p) => p.slug === handle || p.id === handle);
  if (!found) {
    return undefined;
  }

  const fwProduct = buildRoryProduct(found, currency);
  return reshapeProduct(fwProduct);
}

/**
 * Cart operations
 */
export async function getCart(cartId: string | undefined, currency: string = 'USD'): Promise<Cart | undefined> {
  if (!cartId) {
    return undefined;
  }

  try {
    const res = await fourthwallGet<FourthwallCart>(`${API_URL}/carts/${cartId}`, {
      currency
    }, {
      cache: 'no-store'
    });

    return reshapeCart(res.body);
  } catch {
    // In-memory cart fallback
    const cart = inMemoryCarts.get(cartId);
    if (cart) {
      return reshapeCart(cart);
    }
    return undefined;
  }
}

export async function createCart(): Promise<Cart> {
  try {
    const res = await fourthwallPost<FourthwallCart>(`${API_URL}/carts`, {
      items: []
    });

    return reshapeCart(res.body);
  } catch {
    const newCartId = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newCart: FourthwallCart = {
      id: newCartId,
      items: []
    };
    inMemoryCarts.set(newCartId, newCart);
    return reshapeCart(newCart);
  }
}

export async function addToCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const items = lines.map((line) => ({
    variantId: line.merchandiseId,
    quantity: line.quantity
  }));

  try {
    const res = await fourthwallPost<FourthwallCart>(`${API_URL}/carts/${cartId}/add`, {
      items,
    }, {
      cache: 'no-store'
    });

    return reshapeCart(res.body);
  } catch {
    let cart = inMemoryCarts.get(cartId);
    if (!cart) {
      cart = { id: cartId, items: [] };
      inMemoryCarts.set(cartId, cart);
    }

    for (const line of lines) {
      let matchedVariant: any = null;

      // 1. Check in 15 Originals
      for (const orig of ORIGINALS) {
        const prod = buildOriginalProduct(orig, 'USD');
        const v = prod.variants.find((item) => item.id === line.merchandiseId);
        if (v) {
          matchedVariant = v;
          break;
        }
      }

      // 2. Check in standard archive
      if (!matchedVariant) {
        for (const p of RORY_ARTWORKS) {
          const prod = buildRoryProduct(p, 'USD');
          const v = prod.variants.find((item) => item.id === line.merchandiseId);
          if (v) {
            matchedVariant = v;
            break;
          }
        }
      }

      if (!matchedVariant) {
        matchedVariant = {
          id: line.merchandiseId,
          name: 'Artwork Variant',
          sku: 'SKU-ART',
          unitPrice: { value: 35, currency: 'USD' },
          images: [{
            id: 'mock-img',
            url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
            transformedUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
            width: 800,
            height: 800
          }],
          stock: { type: 'UNLIMITED' },
          attributes: { description: 'Art Print' }
        };
      }

      const existingIndex = cart.items.findIndex(item => item.variant.id === line.merchandiseId);
      if (existingIndex > -1) {
        cart.items[existingIndex]!.quantity += line.quantity;
      } else {
        cart.items.push({
          variant: matchedVariant,
          quantity: line.quantity
        });
      }
    }

    return reshapeCart(cart);
  }
}

export async function removeFromCart(cartId: string, lineIds: string[]): Promise<Cart> {
  const items = lineIds.map((id) => ({
    variantId: id
  }));

  try {
    const res = await fourthwallPost<FourthwallCart>(`${API_URL}/carts/${cartId}/remove`, {
      items,
    }, {
      cache: 'no-store'
    });

    return reshapeCart(res.body);
  } catch {
    const cart = inMemoryCarts.get(cartId);
    if (cart) {
      cart.items = cart.items.filter(item => !lineIds.includes(item.variant.id));
      return reshapeCart(cart);
    }
    return reshapeCart({ id: cartId, items: [] });
  }
}

export async function updateCart(
  cartId: string,
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const items = lines.map((line) => ({
    variantId: line.merchandiseId,
    quantity: line.quantity
  }));

  try {
    const res = await fourthwallPost<FourthwallCart>(`${API_URL}/carts/${cartId}/change`, {
      items,
    }, {
      cache: 'no-store'
    });

    return reshapeCart(res.body);
  } catch {
    const cart = inMemoryCarts.get(cartId);
    if (cart) {
      for (const line of lines) {
        const item = cart.items.find(i => i.variant.id === line.merchandiseId || i.variant.id === line.id);
        if (item) {
          if (line.quantity <= 0) {
            cart.items = cart.items.filter(i => i !== item);
          } else {
            item.quantity = line.quantity;
          }
        }
      }
      return reshapeCart(cart);
    }
    return reshapeCart({ id: cartId, items: [] });
  }
}

/**
 * Shop operations
 */
export async function getShop(): Promise<FourthwallShop> {
  try {
    const res = await fourthwallGet<FourthwallShop>(
      `${API_URL}/shop`,
      {},
      { next: { revalidate: 3600 } }
    );

    if (res.body?.name) {
      return res.body;
    }
  } catch {
    // Fall back to mock
  }

  return MOCK_SHOP;
}

export async function getCheckoutUrl(): Promise<string> {
  const customCheckout = cleanEnv(process.env.NEXT_PUBLIC_FW_CHECKOUT);
  if (customCheckout) {
    if (customCheckout.startsWith('http://') || customCheckout.startsWith('https://')) {
      return customCheckout;
    }
    return `https://${customCheckout}`;
  }

  try {
    const shop = await getShop();
    if (shop.publicDomain) {
      return `https://${shop.publicDomain}`;
    }
    if (shop.domain) {
      return `https://${shop.domain}.fourthwall.com`;
    }
  } catch {
    // fall through
  }

  return 'https://shop.roryskagen.com';
}

/**
 * Static pages
 */
export type StaticPage = {
  handle: string;
  title: string;
  description: string;
  bodyHtml: string;
};

const STATIC_PAGE_FALLBACKS: Record<string, StaticPage> = {
  'privacy-policy': {
    handle: 'privacy-policy',
    title: 'Privacy Policy',
    description: 'Privacy Policy for Rory Skagen Art Store',
    bodyHtml: `
      <h1>Privacy Policy</h1>
      <p>Last updated: September 2026</p>
      <p>At Rory Skagen Art, we respect your privacy and are committed to protecting your personal data. This privacy policy explains how we look after your personal data when you visit our website and purchase artwork from us.</p>
      <h2>Information We Collect</h2>
      <p>We may collect information you provide directly to us when placing orders, signing up for newsletters, or contacting customer support, including your name, email address, shipping address, and payment information.</p>
      <h2>How We Use Your Information</h2>
      <p>We use your information exclusively to process orders, communicate tracking updates, and improve your shopping experience.</p>
    `
  },
  'terms-of-service': {
    handle: 'terms-of-service',
    title: 'Terms of Service',
    description: 'Terms of Service for Rory Skagen Art Store',
    bodyHtml: `
      <h1>Terms of Service</h1>
      <p>Welcome to Rory Skagen Art. By browsing our website and placing orders, you agree to comply with and be bound by the following terms and conditions.</p>
      <h2>Copyright & Intellectual Property</h2>
      <p>All artwork, mural images, typography, illustrations, and designs featured on this website are the intellectual property of Rory Skagen and protected by copyright law. Reproduction or commercial redistribution without prior written consent is strictly prohibited.</p>
      <h2>Orders & Shipping</h2>
      <p>All prints and merchandise are packaged with archival protective materials to ensure safe delivery to your doorstep.</p>
    `
  },
  'returns-faq': {
    handle: 'returns-faq',
    title: 'Returns & FAQ',
    description: 'Frequently Asked Questions and Return Policy',
    bodyHtml: `
      <h1>Returns & FAQ</h1>
      <h2>What is your return policy?</h2>
      <p>We take tremendous pride in the quality of every print, canvas, and wearable item. If your order arrives damaged or defective in transit, please contact us within 14 days of delivery with photos of the damaged packaging and item for a free replacement.</p>
      <h2>How long does shipping take?</h2>
      <p>Standard fine art prints ship within 3-5 business days. Framed and canvas pieces require an additional 2-3 business days for custom framing and quality checks.</p>
      <h2>Are prints signed?</h2>
      <p>Select limited edition archival releases are hand-signed and numbered by Rory Skagen as noted on individual product pages.</p>
    `
  },
  'contact': {
    handle: 'contact',
    title: 'Contact Us',
    description: 'Get in touch with Rory Skagen Art Studio',
    bodyHtml: `
      <h1>Contact the Studio</h1>
      <p>Have questions about original mural commissions, gallery exhibitions, custom orders, or print inquiries? We would love to hear from you.</p>
      <p><strong>Studio Location:</strong> Austin, Texas</p>
      <p><strong>Email:</strong> info@roryskagen.com</p>
      <p>We typically respond to inquiries within 1-2 business days.</p>
    `
  }
};

export async function getStaticPage(handle: string): Promise<StaticPage | null> {
  try {
    const checkoutUrl = await getCheckoutUrl();
    const res = await fetch(`${checkoutUrl}/platform/api/v1/pages/${handle}.json`, {
      next: { revalidate: 3600 }
    });

    if (res.ok) {
      return res.json();
    }
  } catch {
    // Fall back to local content
  }

  return STATIC_PAGE_FALLBACKS[handle] || null;
}

/**
 * OG Image operations
 */
export async function getShopOgImage(): Promise<string | null> {
  try {
    const checkoutUrl = await getCheckoutUrl();
    const res = await fetch(`${checkoutUrl}/platform/api/v1/og-image`, {
      next: { revalidate: 3600 }
    });

    if (res.ok) {
      const data: FourthwallOgImageResponse = await res.json();
      if (data?.url) return data.url;
    }
  } catch {
    // fall through
  }

  return 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80';
}

/**
 * Analytics configuration
 */
export async function getAnalyticsConfig(): Promise<{
  ga4Id: string;
  fbPixelId: string;
  tiktokId: string;
  klaviyoId: string;
  useServerAnalytics: boolean;
}> {
  const fallback = {
    ga4Id: '',
    fbPixelId: '',
    tiktokId: '',
    klaviyoId: '',
    useServerAnalytics: false
  };

  try {
    const checkoutUrl = await getCheckoutUrl();
    const res = await fetch(`${checkoutUrl}/platform/analytics.json`, {
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      return fallback;
    }

    const data = await res.json();
    const getProvider = (name: string) =>
      data.providers?.find((p: any) => p.provider_name === name);

    const fbCapi = getProvider('facebook_capi');

    return {
      ga4Id: getProvider('ga4')?.settings?.id || fallback.ga4Id,
      fbPixelId: fbCapi?.settings?.pixelId || getProvider('facebook')?.settings?.pixelId || fallback.fbPixelId,
      tiktokId: getProvider('tiktok')?.settings?.id || fallback.tiktokId,
      klaviyoId: getProvider('klaviyo')?.settings?.publicApiKey || fallback.klaviyoId,
      useServerAnalytics: fbCapi?.settings?.pixelId ? true : fallback.useServerAnalytics
    };
  } catch {
    return fallback;
  }
}
