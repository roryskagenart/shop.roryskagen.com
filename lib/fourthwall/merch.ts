import type { RoryArtwork } from './importer';

/**
 * Pure request builders and eligibility rules for publishing **design products** (merch carrying an
 * artwork) to Fourthwall. No I/O lives here, so every rule below is unit-testable.
 *
 * The write path is `POST /open-api/v1.0/products` with `type: 'design'`, which runs Fourthwall's
 * design pipeline: it renders a registered image onto a product template (tee, mug, …) and creates a
 * purchasable product. This is the ONLY product type the API can create that carries artwork, and it
 * is why the importer was rebuilt around merch rather than prints.
 *
 * See https://docs.fourthwall.com/guides/create-design-products
 */

/**
 * Fourthwall's documented limits, quoted from
 * https://help.fourthwall.com/create-and-sell-products/best-practices/design-file-guidelines-and-templates-for-merchandise
 *
 *   "Minimum resolution: 300 DPI. This applies to all print methods, including DTG, DTFx,
 *    sublimation, screen printing, and stickers."  ·  "Files below 300 DPI may print blurry."
 *
 * 1500 is the smallest side the product designer will ACCEPT, not a quality target — Fourthwall
 * recommends 5000. We gate on the accepted minimum because refusing to upload at all is more useful
 * than uploading something that will print blurry, but the two constants are kept separate so the
 * caller can raise the bar without editing logic.
 */
export const FOURTHWALL_MIN_ACCEPTED_PX = 1500;
export const FOURTHWALL_RECOMMENDED_PX = 5000;

/** Formats Fourthwall accepts. Vector (SVG/AI/EPS/PDF), TIFF and PSD are all rejected. */
export const FOURTHWALL_ACCEPTED_MIME = ['image/png', 'image/jpeg'] as const;

/**
 * Print methods where Fourthwall documents PNG-with-transparency as REQUIRED. A JPEG cannot be used
 * for these — this is the constraint that rules apparel out for the current catalogue, which is
 * 100% JPEG.
 */
export const FOURTHWALL_TRANSPARENCY_REQUIRED_METHODS = ['DTG', 'DTFX', 'EMBROIDERY'] as const;

export interface MerchEligibility {
  eligible: boolean;
  /** Short machine-readable code; absent when eligible. */
  reason?: 'too-small' | 'unsupported-format' | 'missing-image';
  /** Human-readable explanation, safe to print in a report. */
  detail?: string;
  /** min(width, height) — the number Fourthwall's pixel limit actually applies to. */
  shortestSide: number;
}

/** Content type implied by a URL's extension. Unknown extensions are treated as unusable. */
export function contentTypeForUrl(url: string): string | null {
  const path = url.split('?')[0]?.split('#')[0] ?? '';
  const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  return null;
}

/**
 * Decide whether an artwork's source image can be printed.
 *
 * The gate is on `min(width, height)` and not on width alone: a 2100x1400 image is wide enough but
 * its 1400px side still falls under the limit, and a design is placed into a region whose smaller
 * dimension binds. Nine artworks in this catalogue are exactly that shape, so a width-only check
 * would have passed them through.
 */
export function evaluateArtworkForMerch(
  artwork: RoryArtwork,
  minPixels: number = FOURTHWALL_MIN_ACCEPTED_PX
): MerchEligibility {
  const image = artwork.image;
  if (!image || !image.url) {
    return { eligible: false, reason: 'missing-image', detail: 'No image URL on the record.', shortestSide: 0 };
  }

  const contentType = contentTypeForUrl(image.url);
  if (!contentType || !FOURTHWALL_ACCEPTED_MIME.includes(contentType as (typeof FOURTHWALL_ACCEPTED_MIME)[number])) {
    return {
      eligible: false,
      reason: 'unsupported-format',
      detail: `Unsupported format for ${image.url.split('.').pop() ?? 'unknown'} — Fourthwall accepts PNG or JPEG only.`,
      shortestSide: 0
    };
  }

  const width = Number(image.width) || 0;
  const height = Number(image.height) || 0;
  const shortestSide = Math.min(width, height);

  if (shortestSide < minPixels) {
    return {
      eligible: false,
      reason: 'too-small',
      detail: `${width}x${height} — shortest side ${shortestSide}px is below the ${minPixels}px minimum Fourthwall accepts.`,
      shortestSide
    };
  }

  return { eligible: true, shortestSide };
}

/**
 * Product name. Always qualified by the template, because the same artwork may legitimately exist on
 * a mug and a backpack, and Fourthwall derives the slug from the name — two products sharing a name
 * would collide.
 */
export function merchProductName(artwork: RoryArtwork, templateName: string): string {
  return `${artwork.title} - ${templateName}`;
}

/** Description, assembled from the fields the catalogue actually has. Never invents copy. */
export function merchDescription(artwork: RoryArtwork): string {
  const parts = [artwork.description, artwork.narrative, `${artwork.medium}, ${artwork.dimensions} (${artwork.year})`];
  return parts.map((p) => (p ?? '').trim()).filter(Boolean).join('\n\n');
}

export interface UploadUrlRequest {
  fileName: string;
  contentType: string;
  size: number;
}

/**
 * `size` must be the file's exact byte length. It is echoed back by the caller in the
 * `x-goog-content-length-range` header on the subsequent PUT, and Google Cloud Storage rejects the
 * upload with 403 SignatureDoesNotMatch if the two disagree — so it is computed once and reused,
 * never recomputed from a different source.
 */
export function buildUploadUrlRequest(fileName: string, contentType: string, size: number): UploadUrlRequest {
  return { fileName, contentType, size };
}

export interface RegisterImageRequest {
  fileUrl: string;
  width: number;
  height: number;
}

export function buildRegisterImageRequest(fileUrl: string, width: number, height: number): RegisterImageRequest {
  return { fileUrl, width, height };
}

export type PlacementStrategy = 'AUTO' | 'FILL_ALL' | 'FULL_REGION' | 'PLACEMENT_ID';

export interface DesignRegion {
  region: string;
  imageId: string;
  placementStrategy: PlacementStrategy;
  /** Required by Fourthwall only when placementStrategy is PLACEMENT_ID. */
  placementId?: string;
}

export interface DesignProductRequest {
  type: 'design';
  productTemplateId: string;
  name: string;
  description: string;
  regions: DesignRegion[];
  colors?: string[];
  sizes?: string[];
  profitMargin?: number;
  publishOnCreate: boolean;
}

export interface BuildDesignProductInput {
  templateId: string;
  name: string;
  description: string;
  imageId: string;
  region?: string;
  placementStrategy?: PlacementStrategy;
  placementId?: string;
  colors?: string[];
  sizes?: string[];
  profitMargin?: number;
  publishOnCreate?: boolean;
}

/**
 * Fourthwall applies `profitMargin` as a **USD amount on top of the template's base cost**, not as a
 * percentage and not as a final price. `profitMarginForTarget` below converts a target retail price
 * into the margin Fourthwall expects.
 *
 * `publishOnCreate` defaults to false here even though the API's own default is also false — products
 * are created hidden unless explicitly published, and an importer that publishes by accident is worse
 * than one that needs a second run.
 */
export function buildDesignProductRequest(input: BuildDesignProductInput): DesignProductRequest {
  const region: DesignRegion = {
    region: input.region ?? 'front',
    imageId: input.imageId,
    placementStrategy: input.placementStrategy ?? 'AUTO'
  };
  if (region.placementStrategy === 'PLACEMENT_ID') {
    if (!input.placementId) {
      throw new Error('placementStrategy PLACEMENT_ID requires placementId');
    }
    region.placementId = input.placementId;
  }

  const request: DesignProductRequest = {
    type: 'design',
    productTemplateId: input.templateId,
    name: input.name,
    description: input.description,
    regions: [region],
    publishOnCreate: input.publishOnCreate ?? false
  };

  if (input.colors?.length) request.colors = input.colors;
  if (input.sizes?.length) request.sizes = input.sizes;
  if (typeof input.profitMargin === 'number') request.profitMargin = input.profitMargin;

  return request;
}

/**
 * Convert a target retail price into the margin Fourthwall wants.
 *
 * Returns null when the target is at or below base cost — that is not a valid product, and silently
 * sending a zero or negative margin would create something unsellable. The caller must surface it.
 */
export function profitMarginForTarget(targetPrice: number, basePrice: number): number | null {
  if (!Number.isFinite(targetPrice) || !Number.isFinite(basePrice)) return null;
  const margin = Math.round((targetPrice - basePrice) * 100) / 100;
  if (margin <= 0) return null;
  return margin;
}

/** A design product can only be built from a registered media-library image id. */
export function isRegisteredImageId(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0 && !/^https?:\/\//i.test(value);
}
