import {
  FOURTHWALL_WRITE_PATH_STATUS,
  formatArtworkForFourthwall,
  generateFourthwallCsv,
  getAllArtworks,
  getArtworksSummary,
  getFourthwallConnectionState,
  getPublishableArtworks
} from 'lib/fourthwall/importer';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Safety net for the live Fourthwall probe. The Platform API allows 100 requests / 10s per
 * shop, so this endpoint issues at most two. Kept well inside the platform default so the
 * page degrades to an error rather than hanging.
 */
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format');

  if (format === 'csv') {
    const csvContent = generateFourthwallCsv();
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="rory-skagen-fourthwall-catalog.csv"'
      }
    });
  }

  if (format === 'fourthwall-json') {
    const publishable = getPublishableArtworks();
    const formatted = publishable.map(formatArtworkForFourthwall);
    return NextResponse.json({
      shop: 'Rory Skagen Art',
      note: 'Intended catalogue payload. NOT accepted by any documented Fourthwall write endpoint — see writePath.',
      writePath: FOURTHWALL_WRITE_PATH_STATUS,
      count: formatted.length,
      products: formatted
    });
  }

  const summary = getArtworksSummary();
  const artworks = getAllArtworks();

  // The only trustworthy statement about what is live. Never inferred from local data.
  const fourthwall = await getFourthwallConnectionState();

  return NextResponse.json({
    status: 'ready',
    message: 'Fourthwall Catalog Integration & Importer',
    summary,
    writePath: FOURTHWALL_WRITE_PATH_STATUS,
    fourthwall,
    artworks: artworks.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      series: a.series,
      year: a.year,
      medium: a.medium,
      dimensions: a.dimensions,
      priceUSD: a.basePriceUSD,
      status: a.status,
      imageUrl: a.image.url,
      collections: a.collections,
      variantCount: a.variantOptions.length
    }))
  });
}

/**
 * The write path is intentionally not implemented.
 *
 * `POST /open-api/v1.0/products` is a print-on-demand design pipeline that requires a
 * `productTemplateId` and `regions[]`, and accepts no price, variants or stock. Every
 * payload this importer can build would return 400. Returning 501 is deliberate: the
 * previous implementation counted a 401 as a success and rendered a green "SYNC COMPLETE".
 *
 * Credentials are resolved server-side from the environment and are never read from the
 * request body.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      created: 0,
      failed: 0,
      totalProcessed: 0,
      error: 'The Fourthwall write path is not implemented.',
      writePath: FOURTHWALL_WRITE_PATH_STATUS
    },
    { status: 501 }
  );
}
