import { cleanEnv } from 'lib/utils';
import originalsData from './originals-data.json';
import roryArtworksData from './rory-artworks-data.json';

export interface RoryArtwork {
  id: string;
  slug: string;
  title: string;
  year: string;
  date: string;
  medium: string;
  dimensions: string;
  status: string;
  series: string;
  tags: string[];
  description: string;
  narrative: string;
  collections: string[];
  basePriceUSD: number;
  image: {
    url: string;
    transformedUrl: string;
    width: number;
    height: number;
    altText: string;
  };
  variantOptions: {
    name: string;
    size?: string;
    color?: string;
    priceMultiplier: number;
  }[];
}

/**
 * Structural subset of the record in `originals-data.json`. `lib/fourthwall/index.ts`
 * declares a fuller `RoryOriginal` for the same file; this narrow type documents only
 * what the importer consumes, so the two cannot drift on the fields that matter here.
 */
export interface RoryOriginalRecord {
  slug: string;
  title: string;
  originalTitle: string;
  priceUSD: number;
  medium: string;
  dimensions: string;
  year: string;
  status: string;
  provenance: string;
  description: string;
}

export interface FourthwallCredentials {
  apiUrl?: string;
  platformApiUrl?: string;
  storefrontToken?: string;
  platformToken?: string;
  apiKey?: string;
  apiSecret?: string;
  checkoutDomain?: string;
}

/**
 * Fourthwall runs several APIs on different hosts. They are NOT interchangeable and none
 * can be derived from another.
 *
 *   Storefront API   https://storefront-api.fourthwall.com/v1   public catalog reads
 *   Platform API     https://api.fourthwall.com/open-api/v1.0   shop/products/orders, auth-gated
 *   Channel API      https://api.fourthwall.com/channel-api/v1.0 (beta) media + previews
 */
export const DEFAULT_PLATFORM_API_URL = 'https://api.fourthwall.com';
export const PLATFORM_API_PREFIX = '/open-api/v1.0';

/** Only artworks in this state are eligible for publication. */
export const PUBLISHABLE_STATUS = 'Available';

export type FourthwallAuthMode = 'bearer' | 'basic' | 'storefront' | 'none';

/**
 * Resolve credentials from the server environment.
 *
 * The Basic-auth pair is provisioned in Vercel as `FOURTHWALL_API_USERNAME` /
 * `FOURTHWALL_API_PASSWORD`. Earlier revisions read `FOURTHWALL_API_KEY` /
 * `FOURTHWALL_API_SECRET`, which never matched what was provisioned, so the platform
 * credentials always resolved to empty. Both spellings are honoured; the Vercel names win.
 */
export function getResolvedCredentials(overrides?: Partial<FourthwallCredentials>): FourthwallCredentials {
  const apiKey = cleanEnv(process.env.FOURTHWALL_API_USERNAME) || cleanEnv(process.env.FOURTHWALL_API_KEY);
  const apiSecret = cleanEnv(process.env.FOURTHWALL_API_PASSWORD) || cleanEnv(process.env.FOURTHWALL_API_SECRET);

  return {
    apiUrl: overrides?.apiUrl || cleanEnv(process.env.NEXT_PUBLIC_FW_API_URL) || 'https://storefront-api.fourthwall.com/v1',
    platformApiUrl:
      overrides?.platformApiUrl ||
      cleanEnv(process.env.FOURTHWALL_PLATFORM_API_URL) ||
      DEFAULT_PLATFORM_API_URL,
    storefrontToken: overrides?.storefrontToken || cleanEnv(process.env.NEXT_PUBLIC_FW_STOREFRONT_TOKEN) || '',
    platformToken: overrides?.platformToken || cleanEnv(process.env.FOURTHWALL_ACCESS_TOKEN) || '',
    apiKey: overrides?.apiKey || apiKey,
    apiSecret: overrides?.apiSecret || apiSecret,
    checkoutDomain: overrides?.checkoutDomain || cleanEnv(process.env.NEXT_PUBLIC_FW_CHECKOUT) || 'https://vercel-shop.fourthwall.com'
  };
}

/** Which credential set will be used, in precedence order. */
export function resolveAuthMode(creds: FourthwallCredentials): FourthwallAuthMode {
  if (creds.platformToken) return 'bearer';
  if (creds.apiKey && creds.apiSecret) return 'basic';
  if (creds.storefrontToken && !creds.storefrontToken.startsWith('ptkn_...')) return 'storefront';
  return 'none';
}

/** Build the Authorization header for a Platform API call. Returns null when unusable. */
export function buildPlatformAuthHeader(creds: FourthwallCredentials): Record<string, string> | null {
  if (creds.platformToken) {
    return { Authorization: `Bearer ${creds.platformToken}` };
  }
  if (creds.apiKey && creds.apiSecret) {
    const encoded = Buffer.from(`${creds.apiKey}:${creds.apiSecret}`).toString('base64');
    return { Authorization: `Basic ${encoded}` };
  }
  // A storefront token is not valid against the Platform API.
  return null;
}

export function getPlatformBaseUrl(creds: FourthwallCredentials): string {
  return (creds.platformApiUrl || DEFAULT_PLATFORM_API_URL).replace(/\/+$/, '');
}

export function getAllArtworks(): RoryArtwork[] {
  return roryArtworksData as RoryArtwork[];
}

export function getArtworksBySeries(seriesName: string): RoryArtwork[] {
  return getAllArtworks().filter((a) => a.series.toLowerCase() === seriesName.toLowerCase());
}

/** Only 'Available' artworks may be published. Sold and Archived are never published. */
export function getPublishableArtworks(): RoryArtwork[] {
  return getAllArtworks().filter((a) => a.status === PUBLISHABLE_STATUS);
}

const ORIGINALS: RoryOriginalRecord[] = originalsData as RoryOriginalRecord[];

export function getOriginalForSlug(slug: string): RoryOriginalRecord | undefined {
  return ORIGINALS.find((o) => o.slug === slug);
}

/**
 * Map a local artwork status onto a Fourthwall product state.
 *
 * The previous implementation was `status === 'Sold' ? 'OUT_OF_STOCK' : 'ACTIVE'`, which
 * published Archived artworks as ACTIVE. Anything unrecognised now fails safe to ARCHIVED.
 */
export function mapArtworkStatusToFourthwall(status: string): 'ACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED' {
  switch (status) {
    case 'Available':
      return 'ACTIVE';
    case 'Sold':
      return 'OUT_OF_STOCK';
    case 'Archived':
      return 'ARCHIVED';
    default:
      return 'ARCHIVED';
  }
}

export function getArtworksSummary() {
  const artworks = getAllArtworks();
  const seriesMap: Record<string, number> = {};
  const mediumsMap: Record<string, number> = {};

  for (const art of artworks) {
    seriesMap[art.series] = (seriesMap[art.series] || 0) + 1;
    mediumsMap[art.medium] = (mediumsMap[art.medium] || 0) + 1;
  }

  const creds = getResolvedCredentials();
  const authMode = resolveAuthMode(creds);
  const publishable = getPublishableArtworks();
  const publishableWithOriginal = publishable.filter((a) => getOriginalForSlug(a.slug)).length;

  return {
    totalArtworks: artworks.length,
    statusBreakdown: artworks.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {}),
    publishableCount: publishable.length,
    publishableWithOriginal,
    publishablePrintsOnly: publishable.length - publishableWithOriginal,
    seriesBreakdown: seriesMap,
    mediumsBreakdown: mediumsMap,
    collections: [
      { handle: 'all', count: artworks.length, title: 'All Fine Art Pieces' },
      { handle: 'launch', count: artworks.filter((a) => a.collections.includes('launch')).length, title: 'Featured Masterworks' },
      { handle: 'austin-iconic', count: seriesMap['Austin Iconic & Texas Pop'] || 0, title: 'Austin Iconic & Texas Pop' },
      { handle: 'monsters-kaiju', count: seriesMap['Monsters & Kaiju'] || 0, title: 'Monsters & Kaiju' },
      { handle: 'pop-surrealism', count: seriesMap['Pop Surrealism & Folklore'] || 0, title: 'Pop Surrealism & Folklore' },
      { handle: 'atomic-sci-fi', count: seriesMap['Atomic Pop & Sci-Fi'] || 0, title: 'Atomic Pop & Sci-Fi' }
    ],
    credentialsStatus: {
      storefrontApiUrl: creds.apiUrl,
      platformApiUrl: getPlatformBaseUrl(creds),
      authMode,
      hasStorefrontToken: Boolean(creds.storefrontToken && !creds.storefrontToken.startsWith('ptkn_...')),
      hasPlatformCredentials: authMode === 'bearer' || authMode === 'basic',
      checkoutDomain: creds.checkoutDomain
    }
  };
}

/**
 * Format an artwork into a Fourthwall Product payload specification.
 *
 * NOTE: this shape does NOT match any documented Fourthwall write endpoint. See
 * `FOURTHWALL_WRITE_PATH_STATUS` for the details. It is retained because the CSV export
 * and the API JSON preview both consume it, and it documents the intended catalogue shape.
 */
export function formatArtworkForFourthwall(artwork: RoryArtwork) {
  const original = getOriginalForSlug(artwork.slug);

  const variants = artwork.variantOptions.map((opt, idx) => ({
    name: opt.name,
    sku: `RS-${artwork.slug.toUpperCase().slice(0, 8)}-${idx + 1}`,
    price: Math.round(artwork.basePriceUSD * opt.priceMultiplier * 100) / 100,
    currency: 'USD',
    inventoryType: 'UNLIMITED',
    attributes: {
      size: opt.size || opt.name,
      medium: artwork.medium,
      dimensions: artwork.dimensions
    }
  }));

  if (original) {
    variants.unshift({
      name: `Original — ${original.dimensions}`,
      sku: `RS-${artwork.slug.toUpperCase().slice(0, 8)}-ORIG`,
      price: original.priceUSD,
      currency: 'USD',
      inventoryType: 'LIMITED',
      stock: 1,
      attributes: {
        size: original.dimensions,
        medium: original.medium,
        dimensions: original.dimensions,
        provenance: original.provenance
      }
    } as (typeof variants)[number]);
  }

  return {
    name: artwork.title,
    slug: artwork.slug,
    description: artwork.description,
    type: 'physical',
    status: mapArtworkStatusToFourthwall(artwork.status),
    tags: [...artwork.tags, artwork.series, artwork.medium, artwork.year],
    images: [
      {
        url: artwork.image.url,
        width: artwork.image.width,
        height: artwork.image.height,
        alt: artwork.image.altText
      }
    ],
    variants
  };
}

/**
 * Generate a standard Fourthwall CSV export.
 */
export function generateFourthwallCsv(): string {
  const artworks = getPublishableArtworks();
  const headers = [
    'Handle',
    'Title',
    'Body (HTML)',
    'Vendor',
    'Type',
    'Tags',
    'Published',
    'Option1 Name',
    'Option1 Value',
    'Variant SKU',
    'Variant Price',
    'Image Src',
    'Image Alt Text'
  ];

  const rows: string[] = [headers.join(',')];

  for (const art of artworks) {
    for (let i = 0; i < art.variantOptions.length; i++) {
      const opt = art.variantOptions[i]!;
      const price = (art.basePriceUSD * opt.priceMultiplier).toFixed(2);
      const sku = `RS-${art.slug.toUpperCase().slice(0, 8)}-${i + 1}`;
      const tags = [...art.tags, art.series, art.medium, art.year].join('; ');

      const row = [
        JSON.stringify(art.slug),
        JSON.stringify(art.title),
        JSON.stringify(`<p>${art.description}</p><p><strong>Medium:</strong> ${art.medium}</p><p><strong>Original Dimensions:</strong> ${art.dimensions}</p>`),
        JSON.stringify('Rory Skagen Art'),
        JSON.stringify(art.series),
        JSON.stringify(tags),
        JSON.stringify(true),
        JSON.stringify('Print & Canvas Size'),
        JSON.stringify(opt.name),
        JSON.stringify(sku),
        price,
        JSON.stringify(art.image.url),
        JSON.stringify(art.image.altText)
      ];
      rows.push(row.join(','));
    }
  }

  return rows.join('\n');
}

/**
 * Why the write path is not implemented.
 *
 * Verified against the Fourthwall developer docs on 2026-10-01. `POST /open-api/v1.0/products`
 * is a print-on-demand DESIGN pipeline. It requires `productTemplateId` and `regions[]`
 * (registered media image ids) and accepts no `price`, `variants`, `slug`, `stock` or
 * `images`. Pricing is `profitMargin` on top of a template's base cost. The three documented
 * request variants are Design, Digital and Customization — none creates a physical product
 * with an explicit price and variant list.
 *
 * So a catalogue of priced physical artworks cannot be pushed through that endpoint. Any
 * payload of the shape `formatArtworkForFourthwall()` produces returns 400 regardless of
 * credentials. Re-scoping this is an open decision; until then the importer refuses to
 * attempt a write rather than reporting a false success.
 */
export const FOURTHWALL_WRITE_PATH_STATUS = {
  supported: false,
  reason: 'no-supported-endpoint',
  detail:
    'Fourthwall exposes no endpoint that creates a physical product with an explicit price and variant list. ' +
    'POST /open-api/v1.0/products is a print-on-demand design pipeline requiring productTemplateId and regions[].',
  verifiedAgainst: 'https://docs.fourthwall.com/api-reference/platform/products/create-product',
  verifiedOn: '2026-10-01'
} as const;

export interface FourthwallConnectionState {
  reachable: boolean;
  authenticated: boolean;
  authMode: FourthwallAuthMode;
  platformApiUrl: string;
  shop?: { id: string; name: string; domain: string; status: string };
  productCount?: number;
  collections?: Array<{ slug: string; name: string }>;
  error?: string;
  httpStatus?: number;
  checkedAt: string;
}

interface FetchResult {
  status: number;
  body: unknown;
}

async function platformGet(
  creds: FourthwallCredentials,
  path: string,
  auth: Record<string, string>
): Promise<FetchResult> {
  const url = `${getPlatformBaseUrl(creds)}${PLATFORM_API_PREFIX}${path}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...auth },
    cache: 'no-store',
    // Never let a slow Fourthwall response hang the import page.
    signal: AbortSignal.timeout(8000)
  });

  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // leave as raw text — surfaces HTML error pages rather than hiding them
  }
  return { status: res.status, body };
}

/**
 * Ask Fourthwall for the real state of the shop.
 *
 * This is the only trustworthy source of truth about what is actually live. The UI must
 * render this rather than counting local JSON, which previously produced claims like
 * "137 / 137 assets" and "Storefront Status: Active" for a store holding one product.
 */
export async function getFourthwallConnectionState(
  overrides?: Partial<FourthwallCredentials>
): Promise<FourthwallConnectionState> {
  const creds = getResolvedCredentials(overrides);
  const authMode = resolveAuthMode(creds);
  const checkedAt = new Date().toISOString();
  const base: FourthwallConnectionState = {
    reachable: false,
    authenticated: false,
    authMode,
    platformApiUrl: getPlatformBaseUrl(creds),
    checkedAt
  };

  const auth = buildPlatformAuthHeader(creds);
  if (!auth) {
    return {
      ...base,
      error:
        authMode === 'storefront'
          ? 'Only a storefront token is configured. A storefront token is not valid against the Platform API.'
          : 'No Platform API credentials configured.'
    };
  }

  try {
    const shop = await platformGet(creds, '/shops/current', auth);
    if (shop.status === 401 || shop.status === 403) {
      return { ...base, reachable: true, httpStatus: shop.status, error: 'Platform API rejected the credentials (401/403).' };
    }
    if (shop.status !== 200) {
      return { ...base, reachable: true, httpStatus: shop.status, error: `Platform API returned ${shop.status}.` };
    }

    const shopBody = shop.body as { id?: string; name?: string; domain?: string; status?: string };

    const products = await platformGet(creds, '/products?size=100', auth);
    const productBody = products.body as { results?: unknown[]; total?: number };

    const storefrontCollections = await getStorefrontCollections(creds);

    return {
      ...base,
      reachable: true,
      authenticated: true,
      shop: {
        id: shopBody?.id || '',
        name: shopBody?.name || '',
        domain: shopBody?.domain || '',
        status: shopBody?.status || ''
      },
      productCount: typeof productBody?.total === 'number' ? productBody.total : productBody?.results?.length,
      collections: storefrontCollections,
      httpStatus: 200
    };
  } catch (err: unknown) {
    return { ...base, error: err instanceof Error ? err.message : 'Unknown network error' };
  }
}

/** Read collection handles from the public Storefront API (token is NEXT_PUBLIC by design). */
async function getStorefrontCollections(
  creds: FourthwallCredentials
): Promise<Array<{ slug: string; name: string }> | undefined> {
  if (!creds.storefrontToken || creds.storefrontToken.startsWith('ptkn_...')) return undefined;
  try {
    const url = `${(creds.apiUrl || '').replace(/\/+$/, '')}/collections?storefront_token=${encodeURIComponent(creds.storefrontToken)}`;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!res.ok) return undefined;
    const body = (await res.json()) as { results?: Array<{ slug: string; name: string }> };
    return body?.results?.map((c) => ({ slug: c.slug, name: c.name }));
  } catch {
    return undefined;
  }
}
