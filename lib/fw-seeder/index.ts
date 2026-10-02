/**
 * fw-seeder — Universal Fourthwall Merchandise Seeder
 *
 * A repo-agnostic package for creating design products and collections
 * via the Fourthwall Platform API.
 *
 * Usage:
 *   import { createProduct, uploadAndRegisterImage, ensureCollection } from 'lib/fw-seeder';
 *
 * Or via CLI:
 *   npx tsx lib/fw-seeder/cli.ts --config ./seed-config.json --dry-run
 *
 * This package has NO dependency on:
 *   - rory-artworks-data.json
 *   - lib/taxonomy.ts
 *   - Any shop-specific domain logic
 *
 * It ONLY knows the Fourthwall API wire format.
 */

// Types
export type {
  FourthwallCredentials,
  AuthMode,
  ProductTemplate,
  TemplateArea,
  UploadUrlRequest,
  UploadUrlResponse,
  RegisterImageRequest,
  RegisterImageResponse,
  PlacementStrategy,
  DesignRegion,
  CreateDesignProductRequest,
  CreateDesignProductResponse,
  ProductSummary,
  ListProductsResponse,
  Collection,
  CreateCollectionRequest,
  SetCollectionProductsRequest,
  SeederArtwork,
  SeederTemplateConfig,
  SeederCollectionConfig,
  SeederConfig,
  SeederResult
} from './types';

// Client
export {
  resolveAuthMode,
  buildAuthHeader,
  apiCall,
  FourthwallApiError,
  listTemplates,
  getTemplateAreas,
  requestUploadUrl,
  registerImage,
  createDesignProduct,
  listProducts,
  createCollection,
  setCollectionProducts,
  listCollections
} from './client';

// Upload pipeline
export { uploadAndRegisterImage, fetchUploadAndRegister } from './upload';

// Product creation
export { createProduct } from './product';

// Collection management
export { ensureCollection, findCollectionByName, findCollectionBySlug } from './collection';
