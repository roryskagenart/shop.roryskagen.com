/**
 * Universal image upload pipeline for Fourthwall.
 *
 *   Step 1: POST /media/upload-url  →  get pre-signed GCS URL
 *   Step 2: PUT bytes to GCS         →  file is stored
 *   Step 3: POST /media/images       →  register, get imageId
 *
 * This module has NO dependency on the shop's artwork data.
 * It accepts raw bytes + metadata and returns the imageId.
 */

import {
  type FourthwallCredentials,
  type RegisterImageResponse
} from './types';
import { requestUploadUrl, registerImage, FourthwallApiError } from './client';

export interface UploadImageOptions {
  credentials: FourthwallCredentials;
  /** Raw image bytes. */
  bytes: Uint8Array;
  fileName: string;
  contentType: string;
  width: number;
  height: number;
  /** Timeout for the GCS PUT in ms. Default: 120000 */
  uploadTimeoutMs?: number;
}

/** Upload image bytes and register with Fourthwall. Returns the imageId. */
export async function uploadAndRegisterImage(
  opts: UploadImageOptions
): Promise<string> {
  const { credentials, bytes, fileName, contentType, width, height, uploadTimeoutMs = 120000 } = opts;

  // Step 1: Get pre-signed URL
  const { uploadUrl, fileUrl } = await requestUploadUrl(credentials, {
    fileName,
    contentType,
    size: bytes.byteLength
  });

  // Step 2: PUT bytes directly to Google Cloud Storage
  // ⚠️ Fourthwall credentials must NOT be sent here.
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'x-goog-content-length-range': `0,${bytes.byteLength}`
    },
    body: bytes,
    signal: AbortSignal.timeout(uploadTimeoutMs)
  });

  if (!put.ok) {
    const body = await put.text().catch(() => '');
    throw new FourthwallApiError(
      `GCS PUT failed: ${put.status} ${body.slice(0, 200)}`,
      put.status,
      body
    );
  }

  // Step 3: Register the uploaded file
  const registered: RegisterImageResponse = await registerImage(credentials, {
    fileUrl,
    width,
    height
  });

  if (!registered.id) {
    throw new Error('registerImage returned no id');
  }

  return registered.id;
}

/** Fetch an image from a URL, then upload+register it. Returns the imageId. */
export async function fetchUploadAndRegister(
  opts: Omit<UploadImageOptions, 'bytes'> & { imageUrl: string; fetchTimeoutMs?: number }
): Promise<string> {
  const { imageUrl, fetchTimeoutMs = 60000, ...rest } = opts;

  const res = await fetch(imageUrl, { signal: AbortSignal.timeout(fetchTimeoutMs) });
  if (!res.ok) {
    throw new Error(`Failed to fetch image from ${imageUrl}: ${res.status}`);
  }

  const bytes = new Uint8Array(await res.arrayBuffer());
  return uploadAndRegisterImage({ ...rest, bytes });
}
