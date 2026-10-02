import { describe, it, expect, vi } from 'vitest';

import { uploadAndRegisterImage, fetchUploadAndRegister } from '../upload';
import { FourthwallApiError } from '../client';

// Mock the client module
vi.mock('../client', async () => {
  const actual = await vi.importActual<typeof import('../client')>('../client');
  return {
    ...actual,
    requestUploadUrl: vi.fn(),
    registerImage: vi.fn()
  };
});

import { requestUploadUrl, registerImage } from '../client';

const mockCreds = { accessToken: 'tok' };

describe('uploadAndRegisterImage', () => {
  it('completes the full upload pipeline', async () => {
    vi.mocked(requestUploadUrl).mockResolvedValue({
      uploadUrl: 'https://storage.googleapis.com/upload/test',
      fileUrl: 'https://cdn.fourthwall.com/test.jpg'
    });
    vi.mocked(registerImage).mockResolvedValue({ id: 'img_abc123' });

    // Mock fetch for GCS PUT
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => ''
    } as unknown as Response);

    const imageId = await uploadAndRegisterImage({
      credentials: mockCreds,
      bytes: new Uint8Array([1, 2, 3]),
      fileName: 'test.jpg',
      contentType: 'image/jpeg',
      width: 2400,
      height: 2400
    });

    expect(imageId).toBe('img_abc123');
    expect(requestUploadUrl).toHaveBeenCalledWith(mockCreds, {
      fileName: 'test.jpg',
      contentType: 'image/jpeg',
      size: 3
    });
    expect(registerImage).toHaveBeenCalledWith(mockCreds, {
      fileUrl: 'https://cdn.fourthwall.com/test.jpg',
      width: 2400,
      height: 2400
    });
  });

  it('throws when GCS PUT fails', async () => {
    vi.mocked(requestUploadUrl).mockResolvedValue({
      uploadUrl: 'https://storage.googleapis.com/upload/test',
      fileUrl: 'https://cdn.fourthwall.com/test.jpg'
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'SignatureDoesNotMatch'
    } as unknown as Response);

    await expect(
      uploadAndRegisterImage({
        credentials: mockCreds,
        bytes: new Uint8Array([1]),
        fileName: 'test.jpg',
        contentType: 'image/jpeg',
        width: 100,
        height: 100
      })
    ).rejects.toThrow(/GCS PUT failed/);
  });

  it('throws when registerImage returns no id', async () => {
    vi.mocked(requestUploadUrl).mockResolvedValue({
      uploadUrl: 'https://storage.googleapis.com/upload/test',
      fileUrl: 'https://cdn.fourthwall.com/test.jpg'
    });
    vi.mocked(registerImage).mockResolvedValue({ id: '' });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => ''
    } as unknown as Response);

    await expect(
      uploadAndRegisterImage({
        credentials: mockCreds,
        bytes: new Uint8Array([1]),
        fileName: 'test.jpg',
        contentType: 'image/jpeg',
        width: 100,
        height: 100
      })
    ).rejects.toThrow(/returned no id/);
  });
});

describe('fetchUploadAndRegister', () => {
  it('fetches image from URL then uploads', async () => {
    vi.mocked(requestUploadUrl).mockResolvedValue({
      uploadUrl: 'https://storage.googleapis.com/upload/test',
      fileUrl: 'https://cdn.fourthwall.com/test.jpg'
    });
    vi.mocked(registerImage).mockResolvedValue({ id: 'img_xyz' });

    // Mock fetch for both image download and GCS PUT
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        arrayBuffer: async () => new ArrayBuffer(4)
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => ''
      } as unknown as Response);

    const imageId = await fetchUploadAndRegister({
      credentials: mockCreds,
      imageUrl: 'https://example.com/art.jpg',
      fileName: 'art.jpg',
      contentType: 'image/jpeg',
      width: 2400,
      height: 2400
    });

    expect(imageId).toBe('img_xyz');
  });

  it('throws when image fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404
    } as unknown as Response);

    await expect(
      fetchUploadAndRegister({
        credentials: mockCreds,
        imageUrl: 'https://example.com/missing.jpg',
        fileName: 'missing.jpg',
        contentType: 'image/jpeg',
        width: 100,
        height: 100
      })
    ).rejects.toThrow(/Failed to fetch image/);
  });
});
