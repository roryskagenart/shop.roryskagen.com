import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression tests for storefront navigation.
 *
 * Both bugs below were live on the deployed site and both are silent: nothing throws, the pages
 * render fine, they just render the wrong thing. That is exactly why they survived — so these
 * assertions are on the *contents* of the navigation, not on whether the call succeeded.
 *
 * The storefront token is read once at module load, so it must be set before the dynamic import.
 */
process.env.NEXT_PUBLIC_FW_STOREFRONT_TOKEN = 'ptkn_unit_test_token';
process.env.NEXT_PUBLIC_FW_API_URL = 'https://storefront-api.fourthwall.com/v1';

const TAXONOMY_HANDLES = [
  'fine-art-originals',
  'b2b-corporate-gifts',
  'metal-litho',
  'canvas-prints',
  'desk-art',
  'kitsch-cpg',
  'apparel',
];

/** What Fourthwall actually answers with: its two built-in collections. */
const FOURTHWALL_BUILTINS = {
  results: [
    { id: 'col_1', name: 'featured', slug: 'featured', description: '', updatedAt: '' },
    { id: 'col_2', name: 'All Products', slug: 'all', description: 'Everything', updatedAt: '' },
  ],
};

function stubFetch(payload: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(payload), { status: 200 }))
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getCollections', () => {
  it('keeps the curated taxonomy even when Fourthwall returns collections', async () => {
    stubFetch(FOURTHWALL_BUILTINS);
    const { getCollections } = await import('../index');

    const handles = (await getCollections()).map((c) => c.handle);

    // The bug: Fourthwall answering at all replaced the whole taxonomy with its two built-ins.
    for (const handle of TAXONOMY_HANDLES) {
      expect(handles).toContain(handle);
    }
    expect(handles).toContain('all');
  });

  it('prefers the taxonomy title over a colliding Fourthwall collection', async () => {
    stubFetch({
      results: [
        { id: 'col_3', name: 'Kitsch CPG', slug: 'kitsch-cpg', description: 'Remote copy', updatedAt: '' },
      ],
    });
    const { getCollections } = await import('../index');

    const collections = await getCollections();
    const kitsch = collections.filter((c) => c.handle === 'kitsch-cpg');

    // One entry, and the taxonomy's designed title wins — not Fourthwall's raw name.
    expect(kitsch).toHaveLength(1);
    expect(kitsch[0]?.title).toBe('Kitsch, CPG & Austin Pop Living');
  });

  it('still surfaces a collection that only exists in Fourthwall', async () => {
    stubFetch({
      results: [
        { id: 'col_4', name: 'Winter Drop', slug: 'winter-drop', description: '', updatedAt: '' },
      ],
    });
    const { getCollections } = await import('../index');

    const handles = (await getCollections()).map((c) => c.handle);

    expect(handles).toContain('winter-drop');
  });

  it('returns the full taxonomy when Fourthwall is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      })
    );
    const { getCollections } = await import('../index');

    const handles = (await getCollections()).map((c) => c.handle);

    for (const handle of TAXONOMY_HANDLES) {
      expect(handles).toContain(handle);
    }
  });
});

describe('getCollectionProducts', () => {
  it('returns nothing for a category with no products, instead of the fine-art originals', async () => {
    stubFetch({ results: [] });
    const { getCollectionProducts } = await import('../index');

    // The bug: every unmatched handle returned the 15 originals, so `apparel` claimed to stock
    // $4k–$28k paintings and the designed empty state could never render.
    const products = await getCollectionProducts({ collection: 'apparel', currency: 'USD' });

    expect(products).toEqual([]);
  });

  it('still returns the fifteen originals for fine-art-originals', async () => {
    stubFetch({ results: [] });
    const { getCollectionProducts } = await import('../index');

    const products = await getCollectionProducts({ collection: 'fine-art-originals', currency: 'USD' });

    expect(products).toHaveLength(15);
  });

  it('still returns the full archive for all', async () => {
    stubFetch({ results: [] });
    const { getCollectionProducts } = await import('../index');

    const products = await getCollectionProducts({ collection: 'all', currency: 'USD' });

    // 15 originals + 137 artworks
    expect(products).toHaveLength(152);
  });

  it('prefers Fourthwall products when the collection exists there', async () => {
    stubFetch({
      results: [
        {
          id: 'p1',
          name: 'Odoroita Sakana - White Glossy Mug',
          slug: 'odoroita-sakana-white-glossy-mug',
          description: '',
          images: [],
          variants: [],
          updatedAt: '',
        },
      ],
    });
    const { getCollectionProducts } = await import('../index');

    const products = await getCollectionProducts({ collection: 'kitsch-cpg', currency: 'USD' });

    expect(products).toHaveLength(1);
    expect(products[0]?.handle).toBe('odoroita-sakana-white-glossy-mug');
  });
});
