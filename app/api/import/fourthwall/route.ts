import {
  formatArtworkForFourthwall,
  generateFourthwallCsv,
  getAllArtworks,
  getArtworksSummary,
  getResolvedCredentials,
  syncArtworksToFourthwall
} from 'lib/fourthwall/importer';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
    const all = getAllArtworks();
    const formatted = all.map(formatArtworkForFourthwall);
    return NextResponse.json({
      shop: 'Rory Skagen Art',
      count: formatted.length,
      products: formatted
    });
  }

  const summary = getArtworksSummary();
  const artworks = getAllArtworks();

  return NextResponse.json({
    status: 'ready',
    message: 'Fourthwall Catalog Integration & Importer',
    summary,
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

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { credentials, limit, slugs, dryRun } = body;

    const result = await syncArtworksToFourthwall({
      credentials,
      limit,
      slugs,
      dryRun: dryRun === true
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 207
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process Fourthwall import'
      },
      { status: 500 }
    );
  }
}
