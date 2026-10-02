/**
 * Declarative merch catalogue for the v0.2.0 "Sellable Storefront" release.
 *
 * This is data, not script flags. The seeding script consumes it; the tests
 * verify it. Every claim below is pinned and assertable.
 *
 * Source of truth: docs/releases/plans/pr-merch-catalog-v0.2.0_DRAFT.md
 *   §2.1 (10 artworks), §2.2 (4 collections, 6 templates, target prices)
 *
 * ⚠️ Template ids are PINNED. The template set is mutable and changed mid-session
 *    (fourthwall.md §1.4). Never resolve a template by name at runtime.
 */

import { profitMarginForTarget } from './merch';

/** The 10 artworks that make up the v0.2.0 catalogue, in priority order. */
export const MERCH_CATALOGUE_SLUGS = [
  'the-martian',
  'the-martian-2',
  'odoroita-sakana',
  'today',
  'austin-2019',
  'gondoleu',
  'empopatya',
  'gianondor',
  'the-persistence-of-cats',
  'beat-bop'
] as const;

export type MerchCatalogueSlug = (typeof MERCH_CATALOGUE_SLUGS)[number];

/**
 * A pinned product template with its known base cost.
 *
 * `basePrice` is the template's base cost in USD, measured from the Platform API.
 * `targetPrice` is the desired retail price.
 * `margin` is derived: target − base (rounded to cents). Null means the target
 * does not clear the base — the test catches this.
 */
export interface PinnedTemplate {
  id: string;
  name: string;
  method: string;
  basePrice: number;
  targetPrice: number;
  margin: number | null;
  /** Which customizable area to render into. Resolved from the template's
   *  `customizableAreas` at apply time; stored here as the known default. */
  defaultRegion: string;
  /** Variant sizes to create. Omitting sizes creates only one variant (the
   *  "omitted-sizes bug" — fourthwall.md §4). */
  sizes?: string[];
  /** Variant colors to create. */
  colors?: string[];
}

function pin(
  id: string,
  name: string,
  method: string,
  basePrice: number,
  targetPrice: number,
  defaultRegion: string,
  sizes?: string[],
  colors?: string[]
): PinnedTemplate {
  return {
    id,
    name,
    method,
    basePrice,
    targetPrice,
    margin: profitMarginForTarget(targetPrice, basePrice),
    defaultRegion,
    sizes,
    colors
  };
}

/** The six templates that fulfil the 4 collections. */
export const PINNED_TEMPLATES: PinnedTemplate[] = [
  // Collection 1: kitsch-cpg
  pin(
    'pro_4v5OfYhyRx62KW5b7Oj6Uw',
    'White Glossy Mug',
    'SUBLIMATION',
    5.95,
    22.0,
    'default',
    ['11 oz', '15 oz', '20 oz']
  ),

  // Collection 2: apparel
  // ⚠️ The Comfort Colors tee was present at one point and absent at another.
  //    If this id is rejected at apply time, the template set has shifted again.
  pin(
    'pro_6ae602fcb22447bfbc',
    'Gildan Ultra Cotton Long Sleeve T-Shirt',
    'DTG',
    14.79,
    34.0,
    'front',
    ['S', 'M', 'L', 'XL', '2XL']
  ),

  // Collection 3: desk-art
  pin(
    'pro_-wHFTR2xRbO-5bYAvLSVng',
    'Hardcover Journal – Blank',
    'UV',
    15.5,
    32.0,
    'default'
  ),
  pin(
    'pro_fur0cz31TDC0tRUiYzJXXw',
    'Snap Case for iPhone®',
    'SUBLIMATION',
    12.95,
    28.0,
    'default'
  ),

  // Collection 4: everyday-carry
  pin(
    'pro_149a5b8d86ae4219aa',
    'All-Over Print Backpack',
    'ALL_OVER_PRINT',
    32.95,
    58.0,
    'default'
  ),
  pin(
    'pro_22456d0504af4ae38f',
    'All-Over Print Fanny Pack',
    'ALL_OVER_PRINT',
    21.37,
    38.0,
    'default'
  )
];

/** Map from template id to its config for O(1) lookup. */
export const TEMPLATE_BY_ID: ReadonlyMap<string, PinnedTemplate> = new Map(
  PINNED_TEMPLATES.map((t) => [t.id, t])
);

/** The four sellable collections. */
export const SELLABLE_COLLECTIONS = [
  {
    handle: 'kitsch-cpg',
    name: 'Kitsch CPG',
    templates: ['pro_4v5OfYhyRx62KW5b7Oj6Uw'],
    /** All 10 artworks get the mug. */
    artworkSlugs: MERCH_CATALOGUE_SLUGS
  },
  {
    handle: 'apparel',
    name: 'Apparel',
    templates: ['pro_6ae602fcb22447bfbc'],
    /** All 10 artworks get the tee. */
    artworkSlugs: MERCH_CATALOGUE_SLUGS
  },
  {
    handle: 'desk-art',
    name: 'Desk Art',
    templates: ['pro_-wHFTR2xRbO-5bYAvLSVng', 'pro_fur0cz31TDC0tRUiYzJXXw'],
    /** Top 5 only: the five highest-resolution sources already proven on mugs. */
    artworkSlugs: MERCH_CATALOGUE_SLUGS.slice(0, 5)
  },
  {
    handle: 'everyday-carry',
    name: 'Everyday Carry',
    templates: ['pro_149a5b8d86ae4219aa', 'pro_22456d0504af4ae38f'],
    /** Top 5 only. */
    artworkSlugs: MERCH_CATALOGUE_SLUGS.slice(0, 5)
  }
] as const;

export type SellableCollectionHandle = (typeof SELLABLE_COLLECTIONS)[number]['handle'];

/** Which template ids a given collection uses. */
export function templatesForCollection(handle: SellableCollectionHandle): readonly string[] {
  const found = SELLABLE_COLLECTIONS.find((c) => c.handle === handle);
  return found?.templates ?? [];
}

/** Which artwork slugs a given collection carries. */
export function slugsForCollection(handle: SellableCollectionHandle): readonly MerchCatalogueSlug[] {
  const found = SELLABLE_COLLECTIONS.find((c) => c.handle === handle);
  return (found?.artworkSlugs ?? []) as MerchCatalogueSlug[];
}

/** All (slug, templateId) pairs that must exist for the catalogue to be complete. */
export function allCataloguePairs(): Array<{ slug: MerchCatalogueSlug; templateId: string }> {
  const pairs: Array<{ slug: MerchCatalogueSlug; templateId: string }> = [];
  for (const collection of SELLABLE_COLLECTIONS) {
    for (const slug of collection.artworkSlugs) {
      for (const templateId of collection.templates) {
        pairs.push({ slug: slug as MerchCatalogueSlug, templateId });
      }
    }
  }
  return pairs;
}

/** Total products the full catalogue defines. */
export function totalCatalogueProducts(): number {
  return allCataloguePairs().length;
}

/** The expected product count per collection. */
export function expectedProductCountPerCollection(): Record<SellableCollectionHandle, number> {
  return {
    'kitsch-cpg': 10,
    apparel: 10,
    'desk-art': 10,
    'everyday-carry': 10
  };
}
