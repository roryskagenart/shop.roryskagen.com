/**
 * Universal Fourthwall Platform API types.
 *
 * These describe the wire format of the Fourthwall design pipeline.
 * They are NOT coupled to any specific shop, artwork catalogue, or product domain.
 *
 * Source of truth: https://docs.fourthwall.com/api-reference/platform/
 */

// ---------------------------------------------------------------------------
// Credentials & Auth
// ---------------------------------------------------------------------------

export interface FourthwallCredentials {
  /** Platform API base URL. Default: https://api.fourthwall.com */
  platformApiUrl?: string;
  /** OAuth Bearer token (preferred). */
  accessToken?: string;
  /** Basic auth username. */
  apiUsername?: string;
  /** Basic auth password. */
  apiPassword?: string;
}

export type AuthMode = 'bearer' | 'basic' | 'none';

// ---------------------------------------------------------------------------
// Product Templates
// ---------------------------------------------------------------------------

export interface ProductTemplate {
  productId: string;
  name: string;
  category?: string;
  basePrice?: { amount: number; currency: string };
  productionMethod?: string;
}

export interface TemplateArea {
  regionId: string;
  name?: string;
  type?: string;
  available?: boolean;
  dimensions?: {
    dpi?: number;
    pixelsWidth?: number;
    pixelsHeight?: number;
    inchesWidth?: number;
    inchesHeight?: number;
  };
  placements?: Array<{ id: string; name?: string }>;
}

// ---------------------------------------------------------------------------
// Media Upload
// ---------------------------------------------------------------------------

export interface UploadUrlRequest {
  fileName: string;
  contentType: string;
  size: number;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  fileUrl: string;
}

export interface RegisterImageRequest {
  fileUrl: string;
  width: number;
  height: number;
}

export interface RegisterImageResponse {
  id: string;
}

// ---------------------------------------------------------------------------
// Design Product Creation
// ---------------------------------------------------------------------------

export type PlacementStrategy = 'AUTO' | 'FILL_ALL' | 'FULL_REGION' | 'PLACEMENT_ID';

export interface DesignRegion {
  region: string;
  imageId: string;
  placementStrategy: PlacementStrategy;
  placementId?: string;
}

export interface CreateDesignProductRequest {
  type: 'design';
  productTemplateId: string;
  name: string;
  description: string;
  regions: DesignRegion[];
  colors?: string[];
  sizes?: string[];
  profitMargin?: number;
  publishOnCreate?: boolean;
}

export interface CreateDesignProductResponse {
  productId: string;
  customizationId: string;
  images: Array<{
    url: string;
    width: number;
    height: number;
    style?: string;
    color?: string;
    size?: string;
    region?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Product Listing
// ---------------------------------------------------------------------------

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  state: { type: string };
  access: { type: string };
  images: Array<{
    id: string;
    url: string;
    width: number;
    height: number;
    transformedUrl: string;
  }>;
  variants: Array<{
    id: string;
    name: string;
    sku: string;
    unitPrice: { value: number; currency: string };
    attributes: {
      description: string;
      color?: { name: string; swatch: string };
      size?: { name: string };
    };
    stock: { type: 'UNLIMITED' | 'LIMITED'; inStock?: number };
    images: Array<{
      id: string;
      url: string;
      width: number;
      height: number;
      transformedUrl: string;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ListProductsResponse {
  results: ProductSummary[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export interface Collection {
  id: string;
  shopId: string;
  name: string;
  slug: string;
  description: string;
  available: boolean;
  state: { available: boolean; type: string };
  offerIds: string[];
}

export interface CreateCollectionRequest {
  name: string;
  description: string;
  offerIds: string[];
}

export interface SetCollectionProductsRequest {
  offerIds: string[];
}

// ---------------------------------------------------------------------------
// Seeder Configuration
// ---------------------------------------------------------------------------

/** A single artwork/image to be rendered onto merchandise. */
export interface SeederArtwork {
  /** Unique identifier — used for logging and deduplication. */
  id: string;
  /** Human-readable name — becomes the product name prefix. */
  name: string;
  /** Product description. */
  description: string;
  /** Source image URL (must be fetchable). */
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  /** MIME type of the source image. */
  imageContentType: 'image/png' | 'image/jpeg';
}

/** A template + margin configuration for a product line. */
export interface SeederTemplateConfig {
  templateId: string;
  templateName: string;
  /** Which customizable area to render into. */
  region: string;
  placementStrategy?: PlacementStrategy;
  /** USD profit margin over base cost. */
  profitMargin: number;
  /** Target retail price (informational). */
  targetPrice?: number;
  colors?: string[];
  sizes?: string[];
  publishOnCreate?: boolean;
}

/** A collection definition that groups products. */
export interface SeederCollectionConfig {
  handle: string;
  name: string;
  description: string;
  /** Which (artworkId, templateId) pairs belong here. */
  pairs: Array<{ artworkId: string; templateId: string }>;
}

/** Complete seed configuration. */
export interface SeederConfig {
  credentials: FourthwallCredentials;
  artworks: SeederArtwork[];
  templates: SeederTemplateConfig[];
  collections: SeederCollectionConfig[];
}

// ---------------------------------------------------------------------------
// Execution Result
// ---------------------------------------------------------------------------

export interface SeederResult {
  executionId: string;
  timestamp: string;
  products: Array<{
    artworkId: string;
    templateId: string;
    productId: string;
    name: string;
    imageId: string;
  }>;
  collections: Array<{
    handle: string;
    collectionId: string;
    name: string;
  }>;
  errors: Array<{
    artworkId?: string;
    templateId?: string;
    collectionHandle?: string;
    step: 'UPLOAD' | 'REGISTER' | 'CREATE_PRODUCT' | 'CREATE_COLLECTION' | 'SET_PRODUCTS';
    message: string;
    status?: number;
  }>;
}
