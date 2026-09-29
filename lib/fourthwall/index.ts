import { Cart, Collection, Product } from "lib/types";
import { cleanEnv } from "lib/utils";
import { RoryArtwork } from "./importer";
import { reshapeCart, reshapeProduct, reshapeProducts } from "./reshape";
import roryArtworksData from "./rory-artworks-data.json";
import { FourthwallCart, FourthwallCollection, FourthwallOgImageResponse, FourthwallProduct, FourthwallShop } from "./types";

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
  const result = await fetch(
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

  const bodyRaw = await result.text();
  let body: T;
  try {
    body = JSON.parse(bodyRaw);
  } catch {
    throw new FourthwallError("Failed to parse Fourthwall response", result.status);
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

const MOCK_COLLECTIONS: Collection[] = [
  {
    handle: 'all',
    title: 'All Fine Art Pieces (137 Works)',
    description: 'Browse the complete Rory Skagen studio catalog, spanning enamel masterworks, iconic murals, retro-futurism, and pop surrealism.'
  },
  {
    handle: 'launch',
    title: 'Featured Masterworks',
    description: 'Iconic flagship pieces including Greetings From Austin, Austin Skyline, and landmark pop art originals.'
  },
  {
    handle: 'austin-iconic',
    title: 'Austin Iconic & Texas Pop',
    description: 'World-famous Austin murals, Texas pop culture ephemera, and landmark Austin typography.'
  },
  {
    handle: 'monsters-kaiju',
    title: 'Monsters & Kaiju',
    description: 'Vibrant pop-surrealist creature paintings, giant kaiju confrontations, and comic-style creature masterworks.'
  },
  {
    handle: 'pop-surrealism',
    title: 'Pop Surrealism & Folklore',
    description: 'Mid-century neo-retro paintings, roadside Americana, and eccentric pop surrealism.'
  },
  {
    handle: 'atomic-sci-fi',
    title: 'Atomic Pop & Sci-Fi',
    description: 'Mid-century space age optimism, retro robots, alien visitors, and atomic futurism.'
  }
];

const RORY_ARTWORKS: RoryArtwork[] = roryArtworksData as RoryArtwork[];

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
export async function getCollections(): Promise<Collection[]> {
  try {
    const res = await fourthwallGet<{ results: FourthwallCollection[] }>(
      `${API_URL}/collections`,
      {},
      { next: { revalidate: 3600 } }
    );

    if (res.body?.results?.length) {
      return res.body.results.map((collection) => ({
        handle: collection.slug,
        title: collection.name,
        description: collection.description,
      }));
    }
  } catch {
    // Fall back to catalog collections
  }

  return MOCK_COLLECTIONS;
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
  const normCollection = (collection || 'all').toLowerCase();

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

  // Filter artworks by collection
  const matching = RORY_ARTWORKS.filter((p) => {
    if (normCollection === 'all') return true;
    return p.collections.some((c) => c.toLowerCase() === normCollection);
  });

  const rawList = matching.length > 0 ? matching : RORY_ARTWORKS;
  const sliced = limit ? rawList.slice(0, limit) : rawList;
  const fourthwallProducts = sliced.map((p) => buildRoryProduct(p, currency));

  return reshapeProducts(fourthwallProducts);
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

  const found = RORY_ARTWORKS.find((p) => p.slug === handle);
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
      for (const p of RORY_ARTWORKS) {
        const prod = buildRoryProduct(p, 'USD');
        const v = prod.variants.find(item => item.id === line.merchandiseId);
        if (v) {
          matchedVariant = v;
          break;
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
