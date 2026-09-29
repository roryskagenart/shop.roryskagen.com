import {
  getAllArtworks,
  getArtworksSummary,
  getResolvedCredentials,
  syncArtworksToFourthwall
} from '../lib/fourthwall/importer';

async function main() {
  console.log('====================================================');
  console.log(' Rory Skagen Studio -> Fourthwall Catalog Importer ');
  console.log('====================================================\n');

  const summary = getArtworksSummary();
  console.log(`📦 Total Artworks Ready: ${summary.totalArtworks}`);
  console.log('Series Breakdown:');
  Object.entries(summary.seriesBreakdown).forEach(([series, count]) => {
    console.log(`  - ${series}: ${count} pieces`);
  });

  const creds = getResolvedCredentials();
  console.log('\n🔑 Fourthwall Connection Settings:');
  console.log(`  - API URL: ${creds.apiUrl}`);
  console.log(`  - Storefront Token: ${creds.storefrontToken ? '✓ Detected' : '✗ Missing'}`);
  console.log(`  - Platform Token: ${creds.platformToken ? '✓ Detected' : '✗ Missing'}`);
  console.log(`  - Basic Auth API Key: ${creds.apiKey ? '✓ Detected' : '✗ Missing'}`);
  console.log(`  - Checkout: ${creds.checkoutDomain}\n`);

  const isDryRun = process.argv.includes('--dry-run');
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]!, 10) : undefined;

  console.log(`🚀 Starting sync (dryRun=${isDryRun}, limit=${limit || 'all'})...\n`);

  const result = await syncArtworksToFourthwall({
    dryRun: isDryRun,
    limit
  });

  console.log('\n====================================================');
  console.log(' Import Summary:');
  console.log(`  Total Processed: ${result.totalProcessed}`);
  console.log(`  Successfully Ready / Synced: ${result.created}`);
  console.log(`  Failed: ${result.failed}`);
  console.log('====================================================\n');

  if (result.errors.length > 0) {
    console.error('Errors encountered:');
    result.errors.forEach((err) => {
      console.error(`  - ${err.slug}: ${err.error}`);
    });
  } else {
    console.log('✨ All fine art pieces successfully processed and verified!');
  }
}

main().catch((err) => {
  console.error('Fatal import error:', err);
  process.exit(1);
});
