import { describe, it, expect } from 'vitest';

import {
  MERCH_CATALOGUE_SLUGS,
  PINNED_TEMPLATES,
  SELLABLE_COLLECTIONS,
  TEMPLATE_BY_ID,
  allCataloguePairs,
  totalCatalogueProducts,
  expectedProductCountPerCollection
} from '../merch-catalog';
import { getAllArtworks } from '../importer';

const ALL_ARTWORKS = getAllArtworks();
const SLUG_SET = new Set(MERCH_CATALOGUE_SLUGS);

/**
 * T2 — Unit tests for the catalogue.
 *
 * Every slug exists in rory-artworks-data.json and is Available.
 * Every template id is in the pinned table.
 * Every target clears its base cost (margin > 0).
 */

describe('MERCH_CATALOGUE_SLUGS', () => {
  it('has exactly 10 slugs', () => {
    expect(MERCH_CATALOGUE_SLUGS.length).toBe(10);
  });

  it('contains no duplicates', () => {
    expect(SLUG_SET.size).toBe(MERCH_CATALOGUE_SLUGS.length);
  });

  it('every slug exists in rory-artworks-data.json', () => {
    const dataSlugs = new Set(ALL_ARTWORKS.map((a) => a.slug));
    for (const slug of MERCH_CATALOGUE_SLUGS) {
      expect(dataSlugs.has(slug)).toBe(true);
    }
  });

  it('every slug is Available (not Sold or Archived)', () => {
    for (const slug of MERCH_CATALOGUE_SLUGS) {
      const artwork = ALL_ARTWORKS.find((a) => a.slug === slug);
      expect(artwork).toBeDefined();
      expect(artwork!.status).toBe('Available');
    }
  });
});

describe('PINNED_TEMPLATES', () => {
  it('has exactly 6 templates', () => {
    expect(PINNED_TEMPLATES.length).toBe(6);
  });

  it('contains no duplicate ids', () => {
    const ids = PINNED_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every template has a positive margin (target clears base cost)', () => {
    for (const t of PINNED_TEMPLATES) {
      expect(t.margin).not.toBeNull();
      expect(t.margin! > 0).toBe(true);
    }
  });

  it('TEMPLATE_BY_ID contains every pinned template', () => {
    for (const t of PINNED_TEMPLATES) {
      expect(TEMPLATE_BY_ID.has(t.id)).toBe(true);
      expect(TEMPLATE_BY_ID.get(t.id)).toBe(t);
    }
  });
});

describe('SELLABLE_COLLECTIONS', () => {
  it('has exactly 4 collections', () => {
    expect(SELLABLE_COLLECTIONS.length).toBe(4);
  });

  it('every collection references only pinned template ids', () => {
    for (const c of SELLABLE_COLLECTIONS) {
      for (const tid of c.templates) {
        expect(TEMPLATE_BY_ID.has(tid)).toBe(true);
      }
    }
  });

  it('every collection references only catalogue slugs', () => {
    for (const c of SELLABLE_COLLECTIONS) {
      for (const slug of c.artworkSlugs) {
        expect(SLUG_SET.has(slug)).toBe(true);
      }
    }
  });

  it('kitsch-cpg and apparel carry all 10 artworks', () => {
    const kitsch = SELLABLE_COLLECTIONS.find((c) => c.handle === 'kitsch-cpg');
    const apparel = SELLABLE_COLLECTIONS.find((c) => c.handle === 'apparel');
    expect(kitsch!.artworkSlugs.length).toBe(10);
    expect(apparel!.artworkSlugs.length).toBe(10);
  });

  it('desk-art and everyday-carry carry the top 5 only', () => {
    const desk = SELLABLE_COLLECTIONS.find((c) => c.handle === 'desk-art');
    const carry = SELLABLE_COLLECTIONS.find((c) => c.handle === 'everyday-carry');
    expect(desk!.artworkSlugs.length).toBe(5);
    expect(carry!.artworkSlugs.length).toBe(5);
  });
});

describe('catalogue arithmetic', () => {
  it('totalCatalogueProducts equals 40', () => {
    // 10 mugs + 10 tees + 5 journals + 5 phone cases + 5 backpacks + 5 fanny packs
    expect(totalCatalogueProducts()).toBe(40);
  });

  it('allCataloguePairs produces 40 unique (slug, templateId) pairs', () => {
    const pairs = allCataloguePairs();
    expect(pairs.length).toBe(40);

    const seen = new Set<string>();
    for (const p of pairs) {
      const key = `${p.slug}:${p.templateId}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('expectedProductCountPerCollection matches the actual counts', () => {
    const expected = expectedProductCountPerCollection();
    for (const c of SELLABLE_COLLECTIONS) {
      const actual = c.artworkSlugs.length * c.templates.length;
      expect(actual).toBe(expected[c.handle as keyof typeof expected]);
    }
  });
});
