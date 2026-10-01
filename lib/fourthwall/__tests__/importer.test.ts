import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PLATFORM_API_URL,
  FOURTHWALL_WRITE_PATH_STATUS,
  buildPlatformAuthHeader,
  formatArtworkForFourthwall,
  generateFourthwallCsv,
  getAllArtworks,
  getArtworksSummary,
  getFourthwallConnectionState,
  getOriginalForSlug,
  getPlatformBaseUrl,
  getPublishableArtworks,
  getResolvedCredentials,
  mapArtworkStatusToFourthwall,
  resolveAuthMode
} from 'lib/fourthwall/importer';

const ORIGINAL_ENV = { ...process.env };

function setEnv(vars: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

/** Clear every Fourthwall-related variable so each test starts from a known state. */
function clearFourthwallEnv() {
  for (const k of [
    'FOURTHWALL_API_USERNAME',
    'FOURTHWALL_API_PASSWORD',
    'FOURTHWALL_API_KEY',
    'FOURTHWALL_API_SECRET',
    'FOURTHWALL_ACCESS_TOKEN',
    'FOURTHWALL_PLATFORM_API_URL',
    'NEXT_PUBLIC_FW_API_URL',
    'NEXT_PUBLIC_FW_STOREFRONT_TOKEN',
    'NEXT_PUBLIC_FW_CHECKOUT'
  ]) {
    delete process.env[k];
  }
}

beforeEach(() => {
  clearFourthwallEnv();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe('credential resolution', () => {
  it('prefers the Vercel-provisioned names over the legacy ones', () => {
    setEnv({
      FOURTHWALL_API_USERNAME: 'vercel-user',
      FOURTHWALL_API_PASSWORD: 'vercel-pass',
      FOURTHWALL_API_KEY: 'legacy-key',
      FOURTHWALL_API_SECRET: 'legacy-secret'
    });

    const creds = getResolvedCredentials();
    expect(creds.apiKey).toBe('vercel-user');
    expect(creds.apiSecret).toBe('vercel-pass');
  });

  it('falls back to the legacy names when the preferred ones are unset', () => {
    setEnv({ FOURTHWALL_API_KEY: 'legacy-key', FOURTHWALL_API_SECRET: 'legacy-secret' });

    const creds = getResolvedCredentials();
    expect(creds.apiKey).toBe('legacy-key');
    expect(creds.apiSecret).toBe('legacy-secret');
  });

  it('strips quotes and inline comments via cleanEnv', () => {
    setEnv({ FOURTHWALL_API_USERNAME: '"quoted-user" # trailing comment' });
    expect(getResolvedCredentials().apiKey).toBe('quoted-user');
  });

  it('resolves no credentials when nothing is configured', () => {
    const creds = getResolvedCredentials();
    expect(creds.apiKey).toBe('');
    expect(creds.apiSecret).toBe('');
    expect(resolveAuthMode(creds)).toBe('none');
  });
});

describe('auth mode precedence', () => {
  it('prefers bearer, then basic, then storefront', () => {
    expect(resolveAuthMode({ platformToken: 't', apiKey: 'k', apiSecret: 's', storefrontToken: 'ptkn_real' })).toBe('bearer');
    expect(resolveAuthMode({ apiKey: 'k', apiSecret: 's', storefrontToken: 'ptkn_real' })).toBe('basic');
    expect(resolveAuthMode({ storefrontToken: 'ptkn_real' })).toBe('storefront');
    expect(resolveAuthMode({})).toBe('none');
  });

  it('ignores a placeholder storefront token', () => {
    expect(resolveAuthMode({ storefrontToken: 'ptkn_...' })).toBe('none');
  });

  it('requires both halves of the basic pair', () => {
    expect(resolveAuthMode({ apiKey: 'k' })).toBe('none');
    expect(resolveAuthMode({ apiSecret: 's' })).toBe('none');
  });
});

describe('platform auth header', () => {
  it('builds a bearer header', () => {
    expect(buildPlatformAuthHeader({ platformToken: 'tok' })).toEqual({ Authorization: 'Bearer tok' });
  });

  it('builds a base64 basic header', () => {
    const header = buildPlatformAuthHeader({ apiKey: 'user', apiSecret: 'pass' });
    expect(header).toEqual({ Authorization: `Basic ${Buffer.from('user:pass').toString('base64')}` });
  });

  it('refuses to send a storefront token to the Platform API', () => {
    expect(buildPlatformAuthHeader({ storefrontToken: 'ptkn_real' })).toBeNull();
  });

  it('returns null when nothing usable is configured', () => {
    expect(buildPlatformAuthHeader({})).toBeNull();
  });
});

describe('platform API host', () => {
  it('defaults to the documented Platform host', () => {
    expect(getPlatformBaseUrl({})).toBe(DEFAULT_PLATFORM_API_URL);
    expect(DEFAULT_PLATFORM_API_URL).toBe('https://api.fourthwall.com');
  });

  it('is never derived from the storefront host', () => {
    const creds = getResolvedCredentials({
      apiUrl: 'https://storefront-api.fourthwall.com/v1'
    });
    expect(getPlatformBaseUrl(creds)).toBe('https://api.fourthwall.com');
    expect(getPlatformBaseUrl(creds)).not.toContain('storefront-api');
  });

  it('honours an explicit override and strips trailing slashes', () => {
    expect(getPlatformBaseUrl({ platformApiUrl: 'https://example.test/' })).toBe('https://example.test');
  });
});

describe('publish filter', () => {
  it('publishes only Available artworks', () => {
    const publishable = getPublishableArtworks();
    expect(publishable.length).toBeGreaterThan(0);
    expect(publishable.every((a) => a.status === 'Available')).toBe(true);
  });

  it('never includes Sold or Archived', () => {
    const statuses = new Set(getPublishableArtworks().map((a) => a.status));
    expect(statuses.has('Sold')).toBe(false);
    expect(statuses.has('Archived')).toBe(false);
  });

  it('matches the measured dataset shape', () => {
    // Guards against silent data drift in the committed JSON.
    const summary = getArtworksSummary();
    expect(summary.totalArtworks).toBe(137);
    expect(summary.publishableCount).toBe(42);
    expect(summary.statusBreakdown.Archived).toBe(13);
    expect(summary.statusBreakdown.Sold).toBe(82);
  });
});

describe('status mapping', () => {
  it('maps Available to ACTIVE', () => {
    expect(mapArtworkStatusToFourthwall('Available')).toBe('ACTIVE');
  });

  it('maps Sold to OUT_OF_STOCK', () => {
    expect(mapArtworkStatusToFourthwall('Sold')).toBe('OUT_OF_STOCK');
  });

  it('maps Archived to ARCHIVED — never ACTIVE', () => {
    expect(mapArtworkStatusToFourthwall('Archived')).toBe('ARCHIVED');
  });

  it('fails safe for unknown statuses', () => {
    expect(mapArtworkStatusToFourthwall('Nonsense')).toBe('ARCHIVED');
    expect(mapArtworkStatusToFourthwall('')).toBe('ARCHIVED');
  });
});

describe('catalogue payload shape', () => {
  it('adds a LIMITED original variant when an original record exists', () => {
    const art = getAllArtworks().find((a) => a.slug === 'austin-2019');
    expect(art).toBeDefined();
    const original = getOriginalForSlug('austin-2019');
    expect(original).toBeDefined();

    const payload = formatArtworkForFourthwall(art!);
    const originalVariant = payload.variants.find((v) => v.sku.endsWith('-ORIG'));

    expect(originalVariant).toBeDefined();
    expect(originalVariant!.price).toBe(original!.priceUSD);
    expect(originalVariant!.inventoryType).toBe('LIMITED');
    expect(payload.variants.length).toBe(art!.variantOptions.length + 1);
  });

  it('omits the original variant when there is no original record', () => {
    const art = getAllArtworks().find((a) => a.slug === 'gondoleu');
    expect(art).toBeDefined();
    expect(getOriginalForSlug('gondoleu')).toBeUndefined();

    const payload = formatArtworkForFourthwall(art!);
    expect(payload.variants.some((v) => v.sku.endsWith('-ORIG'))).toBe(false);
    expect(payload.variants.length).toBe(art!.variantOptions.length);
  });

  it('excludes non-publishable artworks from the CSV export', () => {
    const csv = generateFourthwallCsv();
    const lines = csv.trim().split('\n');
    const header = lines[0]!;
    expect(header.startsWith('Handle,')).toBe(true);

    const handles = new Set(lines.slice(1).map((l) => l.split(',')[0]!.replace(/"/g, '')));
    expect(handles.has('austin-2019')).toBe(true); // Available
    expect(handles.has('greetings-from-austin')).toBe(false); // Sold
  });

  it('documents the write path as unsupported', () => {
    expect(FOURTHWALL_WRITE_PATH_STATUS.supported).toBe(false);
    expect(FOURTHWALL_WRITE_PATH_STATUS.reason).toBe('no-supported-endpoint');
  });
});

describe('live connection state', () => {
  it('reports unauthenticated when no platform credentials exist', async () => {
    const state = await getFourthwallConnectionState();
    expect(state.authenticated).toBe(false);
    expect(state.authMode).toBe('none');
    expect(state.error).toContain('No Platform API credentials');
  });

  it('reports a storefront-only token as unusable against the Platform API', async () => {
    const state = await getFourthwallConnectionState({ storefrontToken: 'ptkn_real' });
    expect(state.authenticated).toBe(false);
    expect(state.authMode).toBe('storefront');
    expect(state.error).toContain('not valid against the Platform API');
  });

  it('reports unauthenticated when the Platform API rejects the credentials', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('unauthorized', { status: 401 }));

    const state = await getFourthwallConnectionState({ apiKey: 'u', apiSecret: 'p' });
    expect(state.reachable).toBe(true);
    expect(state.authenticated).toBe(false);
    expect(state.httpStatus).toBe(401);
  });

  it('reports the real product count on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/shops/current')) {
        return new Response(JSON.stringify({ id: 'sh_1', name: 'Rory Skagen Art', domain: 'shop.test', status: 'LIVE' }), { status: 200 });
      }
      if (url.includes('/products')) {
        return new Response(JSON.stringify({ results: [{ id: 'p1' }], total: 1 }), { status: 200 });
      }
      return new Response('{}', { status: 200 });
    });

    const state = await getFourthwallConnectionState({ apiKey: 'u', apiSecret: 'p' });
    expect(state.authenticated).toBe(true);
    expect(state.productCount).toBe(1);
    expect(state.shop?.status).toBe('LIVE');
  });

  it('does not claim success when the network fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));

    const state = await getFourthwallConnectionState({ apiKey: 'u', apiSecret: 'p' });
    expect(state.authenticated).toBe(false);
    expect(state.error).toContain('ECONNREFUSED');
  });
});
