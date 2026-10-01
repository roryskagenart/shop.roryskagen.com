import { describe, it, expect } from 'vitest';

import type { RoryArtwork } from '../importer';
import {
  FOURTHWALL_MIN_ACCEPTED_PX,
  buildDesignProductRequest,
  buildRegisterImageRequest,
  buildUploadUrlRequest,
  contentTypeForUrl,
  evaluateArtworkForMerch,
  isRegisteredImageId,
  merchDescription,
  merchProductName,
  profitMarginForTarget
} from '../merch';

function artwork(overrides: Partial<RoryArtwork> = {}): RoryArtwork {
  return {
    id: '1',
    slug: 'test-piece',
    title: 'Test Piece',
    year: '2020',
    date: '2020-01-01',
    medium: 'Enamel',
    dimensions: '3ft x 4ft',
    status: 'Available',
    series: 'Monsters & Kaiju',
    tags: [],
    description: 'A description.',
    narrative: '',
    collections: [],
    basePriceUSD: 55,
    image: {
      url: 'https://res.cloudinary.com/demo/image/upload/v1/piece.jpg',
      transformedUrl: 'https://res.cloudinary.com/demo/image/upload/v1/piece.jpg',
      width: 2400,
      height: 2400,
      altText: 'alt'
    },
    variantOptions: [],
    ...overrides
  };
}

describe('contentTypeForUrl', () => {
  it('maps the extensions Fourthwall accepts', () => {
    expect(contentTypeForUrl('https://x.com/a.png')).toBe('image/png');
    expect(contentTypeForUrl('https://x.com/a.jpg')).toBe('image/jpeg');
    expect(contentTypeForUrl('https://x.com/a.JPEG')).toBe('image/jpeg');
  });

  it('ignores query strings and fragments', () => {
    expect(contentTypeForUrl('https://x.com/a.png?w=100#frag')).toBe('image/png');
  });

  it('returns null for formats Fourthwall rejects', () => {
    expect(contentTypeForUrl('https://x.com/a.svg')).toBeNull();
    expect(contentTypeForUrl('https://x.com/a.tiff')).toBeNull();
    expect(contentTypeForUrl('https://x.com/no-extension')).toBeNull();
  });
});

describe('evaluateArtworkForMerch', () => {
  it('accepts an image that clears the minimum on both sides', () => {
    const result = evaluateArtworkForMerch(artwork());
    expect(result.eligible).toBe(true);
    expect(result.shortestSide).toBe(2400);
  });

  it('rejects a large-width image whose SHORT side is under the limit', () => {
    // The real catalogue has nine 2100x1400 records. A width-only check would let these through.
    const result = evaluateArtworkForMerch(
      artwork({ image: { ...artwork().image, width: 2100, height: 1400 } })
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('too-small');
    expect(result.shortestSide).toBe(1400);
  });

  it('is inclusive at exactly the minimum', () => {
    const result = evaluateArtworkForMerch(
      artwork({ image: { ...artwork().image, width: FOURTHWALL_MIN_ACCEPTED_PX, height: FOURTHWALL_MIN_ACCEPTED_PX } })
    );
    expect(result.eligible).toBe(true);
  });

  it('rejects one pixel below the minimum', () => {
    const result = evaluateArtworkForMerch(
      artwork({
        image: { ...artwork().image, width: FOURTHWALL_MIN_ACCEPTED_PX - 1, height: FOURTHWALL_MIN_ACCEPTED_PX }
      })
    );
    expect(result.eligible).toBe(false);
  });

  it('honours a raised threshold', () => {
    expect(evaluateArtworkForMerch(artwork(), 5000).eligible).toBe(false);
    expect(evaluateArtworkForMerch(artwork(), 5000).reason).toBe('too-small');
  });

  it('rejects unsupported formats', () => {
    const result = evaluateArtworkForMerch(
      artwork({ image: { ...artwork().image, url: 'https://x.com/a.svg' } })
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('unsupported-format');
  });

  it('rejects a record with no image url', () => {
    const result = evaluateArtworkForMerch(artwork({ image: { ...artwork().image, url: '' } }));
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('missing-image');
  });

  it('rejects dimensions that are missing or unparseable rather than assuming they are fine', () => {
    const result = evaluateArtworkForMerch(
      artwork({ image: { ...artwork().image, width: undefined as unknown as number } })
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('too-small');
  });
});

describe('merchProductName', () => {
  it('qualifies the name with the template so slugs cannot collide', () => {
    expect(merchProductName(artwork(), 'White Glossy Mug')).toBe('Test Piece - White Glossy Mug');
  });
});

describe('merchDescription', () => {
  it('joins the fields the catalogue actually has', () => {
    const description = merchDescription(artwork());
    expect(description).toContain('A description.');
    expect(description).toContain('Enamel, 3ft x 4ft (2020)');
  });

  it('does not leave blank paragraphs when narrative is empty', () => {
    expect(merchDescription(artwork())).not.toContain('\n\n\n');
  });
});

describe('buildUploadUrlRequest', () => {
  it('carries the exact byte size, which must be reused verbatim on the PUT', () => {
    expect(buildUploadUrlRequest('a.jpg', 'image/jpeg', 114015)).toEqual({
      fileName: 'a.jpg',
      contentType: 'image/jpeg',
      size: 114015
    });
  });
});

describe('buildRegisterImageRequest', () => {
  it('sends fileUrl plus pixel dimensions', () => {
    expect(buildRegisterImageRequest('https://cdn/x.jpg', 2400, 2400)).toEqual({
      fileUrl: 'https://cdn/x.jpg',
      width: 2400,
      height: 2400
    });
  });
});

describe('buildDesignProductRequest', () => {
  const base = {
    templateId: 'pro_abc',
    name: 'Test Piece - Mug',
    description: 'desc',
    imageId: 'img_123'
  };

  it('builds a design product with a front region using AUTO placement', () => {
    const request = buildDesignProductRequest(base);
    expect(request.type).toBe('design');
    expect(request.productTemplateId).toBe('pro_abc');
    expect(request.regions).toEqual([{ region: 'front', imageId: 'img_123', placementStrategy: 'AUTO' }]);
  });

  it('defaults publishOnCreate to false so a run cannot publish by accident', () => {
    expect(buildDesignProductRequest(base).publishOnCreate).toBe(false);
    expect(buildDesignProductRequest({ ...base, publishOnCreate: true }).publishOnCreate).toBe(true);
  });

  it('omits optional keys entirely rather than sending empty arrays', () => {
    const request = buildDesignProductRequest(base);
    expect(request).not.toHaveProperty('colors');
    expect(request).not.toHaveProperty('sizes');
    expect(request).not.toHaveProperty('profitMargin');
  });

  it('includes optional keys when supplied', () => {
    const request = buildDesignProductRequest({
      ...base,
      colors: ['Black'],
      sizes: ['M'],
      profitMargin: 12.5
    });
    expect(request.colors).toEqual(['Black']);
    expect(request.sizes).toEqual(['M']);
    expect(request.profitMargin).toBe(12.5);
  });

  it('requires a placementId when the strategy is PLACEMENT_ID', () => {
    expect(() => buildDesignProductRequest({ ...base, placementStrategy: 'PLACEMENT_ID' })).toThrow(
      /placementId/
    );
    const request = buildDesignProductRequest({
      ...base,
      placementStrategy: 'PLACEMENT_ID',
      placementId: 'pl_1'
    });
    expect(request.regions[0]?.placementId).toBe('pl_1');
  });
});

describe('profitMarginForTarget', () => {
  it('converts a target retail price into the margin Fourthwall expects', () => {
    expect(profitMarginForTarget(29.95, 16.95)).toBe(13);
  });

  it('rounds to cents', () => {
    expect(profitMarginForTarget(29.999, 16.95)).toBe(13.05);
  });

  it('returns null when the target does not clear base cost', () => {
    expect(profitMarginForTarget(16.95, 16.95)).toBeNull();
    expect(profitMarginForTarget(10, 16.95)).toBeNull();
  });

  it('returns null for non-finite input rather than emitting NaN', () => {
    expect(profitMarginForTarget(Number.NaN, 10)).toBeNull();
    expect(profitMarginForTarget(30, Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe('isRegisteredImageId', () => {
  it('rejects URLs, which Fourthwall refuses as a region imageId', () => {
    expect(isRegisteredImageId('https://cdn.fourthwall.com/x.jpg')).toBe(false);
    expect(isRegisteredImageId('img_k66ZW4fsRm6c2def3itltA')).toBe(true);
    expect(isRegisteredImageId('   ')).toBe(false);
  });
});
