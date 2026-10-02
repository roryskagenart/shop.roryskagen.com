import { describe, it, expect, vi } from 'vitest';

import { ensureCollection, findCollectionByName, findCollectionBySlug } from '../collection';

vi.mock('../client', async () => {
  const actual = await vi.importActual<typeof import('../client')>('../client');
  return {
    ...actual,
    listCollections: vi.fn(),
    createCollection: vi.fn(),
    setCollectionProducts: vi.fn()
  };
});

import { listCollections, createCollection, setCollectionProducts } from '../client';

const mockCreds = { accessToken: 'tok' };

function mockCollection(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'col_1',
    shopId: 'sh_1',
    name: 'Test Collection',
    slug: 'test-collection',
    description: 'A test',
    available: true,
    state: { available: true, type: 'ARCHIVED' },
    offerIds: [],
    ...overrides
  };
}

describe('findCollectionByName', () => {
  it('finds a collection by exact name match', async () => {
    vi.mocked(listCollections).mockResolvedValue([
      mockCollection({ name: 'First', id: 'col_1' }),
      mockCollection({ name: 'Second', id: 'col_2' })
    ]);

    const found = await findCollectionByName(mockCreds, 'Second');
    expect(found?.id).toBe('col_2');
  });

  it('returns undefined when no match', async () => {
    vi.mocked(listCollections).mockResolvedValue([
      mockCollection({ name: 'First' })
    ]);

    const found = await findCollectionByName(mockCreds, 'Missing');
    expect(found).toBeUndefined();
  });
});

describe('findCollectionBySlug', () => {
  it('finds a collection by slug', async () => {
    vi.mocked(listCollections).mockResolvedValue([
      mockCollection({ slug: 'a-collection', id: 'col_a' }),
      mockCollection({ slug: 'b-collection', id: 'col_b' })
    ]);

    const found = await findCollectionBySlug(mockCreds, 'b-collection');
    expect(found?.id).toBe('col_b');
  });
});

describe('ensureCollection', () => {
  it('updates existing collection when found by name', async () => {
    vi.mocked(listCollections).mockResolvedValue([
      mockCollection({ name: 'My Collection', id: 'col_existing' })
    ]);
    vi.mocked(setCollectionProducts).mockResolvedValue(
      mockCollection({ name: 'My Collection', id: 'col_existing', offerIds: ['prd_1'] })
    );

    const result = await ensureCollection({
      credentials: mockCreds,
      name: 'My Collection',
      description: 'Updated desc',
      productIds: ['prd_1']
    });

    expect(result.created).toBe(false);
    expect(result.collection.id).toBe('col_existing');
    expect(setCollectionProducts).toHaveBeenCalledWith(mockCreds, 'col_existing', {
      offerIds: ['prd_1']
    });
    // createCollection should NOT have been called
    expect(createCollection).not.toHaveBeenCalled();
  });

  it('creates new collection when not found', async () => {
    vi.mocked(listCollections).mockResolvedValue([]);
    vi.mocked(createCollection).mockResolvedValue(
      mockCollection({ name: 'New Collection', id: 'col_new', slug: 'new-collection' })
    );

    const result = await ensureCollection({
      credentials: mockCreds,
      name: 'New Collection',
      description: 'A new collection',
      productIds: ['prd_1', 'prd_2']
    });

    expect(result.created).toBe(true);
    expect(result.collection.id).toBe('col_new');
    expect(createCollection).toHaveBeenCalledWith(mockCreds, {
      name: 'New Collection',
      description: 'A new collection',
      offerIds: ['prd_1', 'prd_2']
    });
  });

  it('throws when collection not found and createIfMissing is false', async () => {
    vi.mocked(listCollections).mockResolvedValue([]);

    await expect(
      ensureCollection({
        credentials: mockCreds,
        name: 'Missing',
        description: 'Desc',
        productIds: [],
        createIfMissing: false
      })
    ).rejects.toThrow(/not found/);
  });
});
