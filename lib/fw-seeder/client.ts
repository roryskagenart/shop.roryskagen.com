/**
 * Universal Fourthwall Platform API client.
 *
 * Thin wrapper around fetch() with:
 *   - Bearer or Basic auth resolution
 *   - JSON request/response handling
 *   - Non-2xx status surfacing (never silently swallowed)
 *   - Configurable timeouts
 *
 * This module has NO dependency on the shop's artwork data, taxonomy, or domain.
 */

import {
  type FourthwallCredentials,
  type AuthMode,
  type ProductTemplate,
  type TemplateArea,
  type UploadUrlRequest,
  type UploadUrlResponse,
  type RegisterImageRequest,
  type RegisterImageResponse,
  type CreateDesignProductRequest,
  type CreateDesignProductResponse,
  type ListProductsResponse,
  type Collection,
  type CreateCollectionRequest,
  type SetCollectionProductsRequest
} from './types';

const DEFAULT_API_URL = 'https://api.fourthwall.com';
const API_PREFIX = '/open-api/v1.0';

/** Resolve which credential set will be used. */
export function resolveAuthMode(creds: FourthwallCredentials): AuthMode {
  if (creds.accessToken) return 'bearer';
  if (creds.apiUsername && creds.apiPassword) return 'basic';
  return 'none';
}

/** Build the Authorization header. Returns null when unusable. */
export function buildAuthHeader(creds: FourthwallCredentials): Record<string, string> | null {
  if (creds.accessToken) {
    return { Authorization: `Bearer ${creds.accessToken}` };
  }
  if (creds.apiUsername && creds.apiPassword) {
    const encoded = Buffer.from(`${creds.apiUsername}:${creds.apiPassword}`).toString('base64');
    return { Authorization: `Basic ${encoded}` };
  }
  return null;
}

function getBaseUrl(creds: FourthwallCredentials): string {
  return (creds.platformApiUrl || DEFAULT_API_URL).replace(/\/+$/, '');
}

function fullUrl(creds: FourthwallCredentials, path: string): string {
  return `${getBaseUrl(creds)}${API_PREFIX}${path}`;
}

/** Error thrown for any non-2xx API response. */
export class FourthwallApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/** Every call goes through here so a non-2xx can never be mistaken for success. */
export async function apiCall<T>(
  creds: FourthwallCredentials,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  path: string,
  body?: unknown,
  timeoutMs = 30000
): Promise<T> {
  const auth = buildAuthHeader(creds);
  if (!auth) {
    throw new FourthwallApiError('No usable Platform API credentials. Set accessToken or apiUsername/apiPassword.', 401, null);
  }

  const res = await fetch(fullUrl(creds, path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...auth
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs)
  });

  const text = await res.text();
  let data: unknown = text;
  try {
    data = JSON.parse(text);
  } catch {
    /* keep raw text so HTML error pages surface */
  }

  if (!res.ok) {
    const detail = extractErrorDetail(data);
    throw new FourthwallApiError(
      `Fourthwall API ${method} ${path} failed: ${res.status} ${detail}`,
      res.status,
      data
    );
  }

  return data as T;
}

function extractErrorDetail(data: unknown): string {
  if (typeof data === 'string') return data.slice(0, 300);
  const d = data as { title?: string; detail?: string; message?: string };
  return d?.detail || d?.message || d?.title || JSON.stringify(data).slice(0, 300);
}

// ---------------------------------------------------------------------------
// High-level API operations
// ---------------------------------------------------------------------------

/** List available product templates. */
export async function listTemplates(creds: FourthwallCredentials): Promise<ProductTemplate[]> {
  const res = await apiCall<{ results?: ProductTemplate[] }>(creds, 'GET', '/product-templates');
  return res.results ?? [];
}

/** Get a single template's customizable areas. */
export async function getTemplateAreas(creds: FourthwallCredentials, productId: string): Promise<TemplateArea[]> {
  const res = await apiCall<{ customizableAreas?: TemplateArea[] }>(
    creds, 'GET', `/product-templates/${encodeURIComponent(productId)}`
  );
  return (res.customizableAreas ?? []).filter((a) => a.available !== false);
}

/** Request a pre-signed upload URL. */
export async function requestUploadUrl(
  creds: FourthwallCredentials,
  req: UploadUrlRequest
): Promise<UploadUrlResponse> {
  return apiCall<UploadUrlResponse>(creds, 'POST', '/media/upload-url', req);
}

/** Register an uploaded image, returning the imageId for design regions. */
export async function registerImage(
  creds: FourthwallCredentials,
  req: RegisterImageRequest
): Promise<RegisterImageResponse> {
  return apiCall<RegisterImageResponse>(creds, 'POST', '/media/images', req);
}

/** Create a design product. */
export async function createDesignProduct(
  creds: FourthwallCredentials,
  req: CreateDesignProductRequest
): Promise<CreateDesignProductResponse> {
  return apiCall<CreateDesignProductResponse>(creds, 'POST', '/products', req, 120000);
}

/** List products with pagination. */
export async function listProducts(
  creds: FourthwallCredentials,
  page = 0,
  size = 100
): Promise<ListProductsResponse> {
  return apiCall<ListProductsResponse>(creds, 'GET', `/products?page=${page}&size=${size}`);
}

/** Create a collection. */
export async function createCollection(
  creds: FourthwallCredentials,
  req: CreateCollectionRequest
): Promise<Collection> {
  return apiCall<Collection>(creds, 'POST', '/collections', req);
}

/** Set (replace) the products in a collection. */
export async function setCollectionProducts(
  creds: FourthwallCredentials,
  collectionId: string,
  req: SetCollectionProductsRequest
): Promise<Collection> {
  return apiCall<Collection>(creds, 'PUT', `/collections/${encodeURIComponent(collectionId)}/products`, req);
}

/** List all collections. */
export async function listCollections(creds: FourthwallCredentials): Promise<Collection[]> {
  const res = await apiCall<{ results?: Collection[] }>(creds, 'GET', '/collections');
  return res.results ?? [];
}
