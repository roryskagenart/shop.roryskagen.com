/**
 * Universal collection management for Fourthwall.
 *
 * Create collections and assign products to them.
 * No dependency on shop-specific data.
 */

import {
  type FourthwallCredentials,
  type Collection,
  type CreateCollectionRequest
} from './types';
import { createCollection, setCollectionProducts, listCollections, FourthwallApiError } from './client';

export interface EnsureCollectionOptions {
  credentials: FourthwallCredentials;
  name: string;
  description: string;
  /** Product IDs to include. */
  productIds: string[];
  /** If true, creates the collection when it doesn't exist. */
  createIfMissing?: boolean;
}

export interface EnsureCollectionResult {
  collection: Collection;
  created: boolean;
}

/**
 * Ensure a collection exists with the given name and products.
 *
 * If a collection with the same name already exists, it is updated
 * (products replaced). If not, a new one is created.
 *
 * ⚠️ Collections are PUBLIC immediately on creation. There is no draft state.
 */
export async function ensureCollection(
  opts: EnsureCollectionOptions
): Promise<EnsureCollectionResult> {
  const { credentials, name, description, productIds, createIfMissing = true } = opts;

  // Search for existing collection by name
  const existing = await findCollectionByName(credentials, name);

  if (existing) {
    // Update existing collection's products
    const updated = await setCollectionProducts(credentials, existing.id, {
      offerIds: productIds
    });
    return { collection: updated, created: false };
  }

  if (!createIfMissing) {
    throw new Error(`Collection "${name}" not found and createIfMissing is false`);
  }

  // Create new collection
  const created = await createCollection(credentials, {
    name,
    description,
    offerIds: productIds
  });

  return { collection: created, created: true };
}

/** Find a collection by exact name match. */
export async function findCollectionByName(
  creds: FourthwallCredentials,
  name: string
): Promise<Collection | undefined> {
  const collections = await listCollections(creds);
  return collections.find((c) => c.name === name);
}

/** Find a collection by slug. */
export async function findCollectionBySlug(
  creds: FourthwallCredentials,
  slug: string
): Promise<Collection | undefined> {
  const collections = await listCollections(creds);
  return collections.find((c) => c.slug === slug);
}
