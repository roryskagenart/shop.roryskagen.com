/**
 * Universal design product creation for Fourthwall.
 *
 * Builds the correct `POST /products` payload and executes creation.
 * No dependency on shop-specific artwork data.
 */

import {
  type FourthwallCredentials,
  type CreateDesignProductRequest,
  type CreateDesignProductResponse,
  type PlacementStrategy
} from './types';
import { createDesignProduct } from './client';

export interface CreateProductOptions {
  credentials: FourthwallCredentials;
  templateId: string;
  name: string;
  description: string;
  imageId: string;
  region: string;
  placementStrategy?: PlacementStrategy;
  placementId?: string;
  colors?: string[];
  sizes?: string[];
  profitMargin?: number;
  publishOnCreate?: boolean;
}

/** Create a single design product. Returns the productId. */
export async function createProduct(
  opts: CreateProductOptions
): Promise<CreateDesignProductResponse> {
  const region = {
    region: opts.region,
    imageId: opts.imageId,
    placementStrategy: opts.placementStrategy ?? 'AUTO'
  } as CreateDesignProductRequest['regions'][number];

  if (region.placementStrategy === 'PLACEMENT_ID') {
    if (!opts.placementId) {
      throw new Error('placementStrategy PLACEMENT_ID requires placementId');
    }
    region.placementId = opts.placementId;
  }

  const request: CreateDesignProductRequest = {
    type: 'design',
    productTemplateId: opts.templateId,
    name: opts.name,
    description: opts.description,
    regions: [region],
    publishOnCreate: opts.publishOnCreate ?? false
  };

  if (opts.colors?.length) request.colors = opts.colors;
  if (opts.sizes?.length) request.sizes = opts.sizes;
  if (typeof opts.profitMargin === 'number') request.profitMargin = opts.profitMargin;

  return createDesignProduct(opts.credentials, request);
}
