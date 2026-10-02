import { describe, it, expect, vi } from 'vitest';

import { createProduct } from '../product';

vi.mock('../client', async () => {
  const actual = await vi.importActual<typeof import('../client')>('../client');
  return {
    ...actual,
    createDesignProduct: vi.fn()
  };
});

import { createDesignProduct } from '../client';

const mockCreds = { accessToken: 'tok' };

describe('createProduct', () => {
  it('builds a minimal design product request', async () => {
    vi.mocked(createDesignProduct).mockResolvedValue({
      productId: 'prd_123',
      customizationId: 'cust_456',
      images: []
    });

    const result = await createProduct({
      credentials: mockCreds,
      templateId: 'pro_abc',
      name: 'Test Product',
      description: 'A test',
      imageId: 'img_xyz',
      region: 'front'
    });

    expect(result.productId).toBe('prd_123');
    expect(createDesignProduct).toHaveBeenCalledWith(mockCreds, {
      type: 'design',
      productTemplateId: 'pro_abc',
      name: 'Test Product',
      description: 'A test',
      regions: [{ region: 'front', imageId: 'img_xyz', placementStrategy: 'AUTO' }],
      publishOnCreate: false
    });
  });

  it('includes optional fields when provided', async () => {
    vi.mocked(createDesignProduct).mockResolvedValue({
      productId: 'prd_123',
      customizationId: 'cust_456',
      images: []
    });

    await createProduct({
      credentials: mockCreds,
      templateId: 'pro_abc',
      name: 'Test Product',
      description: 'A test',
      imageId: 'img_xyz',
      region: 'front',
      placementStrategy: 'FILL_ALL',
      colors: ['Black'],
      sizes: ['M', 'L'],
      profitMargin: 12.5,
      publishOnCreate: true
    });

    expect(createDesignProduct).toHaveBeenCalledWith(mockCreds, {
      type: 'design',
      productTemplateId: 'pro_abc',
      name: 'Test Product',
      description: 'A test',
      regions: [{ region: 'front', imageId: 'img_xyz', placementStrategy: 'FILL_ALL' }],
      colors: ['Black'],
      sizes: ['M', 'L'],
      profitMargin: 12.5,
      publishOnCreate: true
    });
  });

  it('throws when PLACEMENT_ID strategy lacks placementId', async () => {
    await expect(
      createProduct({
        credentials: mockCreds,
        templateId: 'pro_abc',
        name: 'Test',
        description: 'A test',
        imageId: 'img_xyz',
        region: 'front',
        placementStrategy: 'PLACEMENT_ID'
      })
    ).rejects.toThrow(/placementId/);
  });

  it('includes placementId when PLACEMENT_ID is used correctly', async () => {
    vi.mocked(createDesignProduct).mockResolvedValue({
      productId: 'prd_123',
      customizationId: 'cust_456',
      images: []
    });

    await createProduct({
      credentials: mockCreds,
      templateId: 'pro_abc',
      name: 'Test',
      description: 'A test',
      imageId: 'img_xyz',
      region: 'front',
      placementStrategy: 'PLACEMENT_ID',
      placementId: 'pl_1'
    });

    expect(createDesignProduct).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        regions: [{ region: 'front', imageId: 'img_xyz', placementStrategy: 'PLACEMENT_ID', placementId: 'pl_1' }]
      })
    );
  });
});
