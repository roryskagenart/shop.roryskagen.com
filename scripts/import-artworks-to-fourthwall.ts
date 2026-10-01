import {
  FOURTHWALL_WRITE_PATH_STATUS,
  getArtworksSummary,
  getFourthwallConnectionState,
  getPublishableArtworks
} from '../lib/fourthwall/importer';

/**
 * Diagnostic CLI for the Fourthwall integration.
 *
 * This script deliberately does NOT attempt a write. See FOURTHWALL_WRITE_PATH_STATUS in
 * lib/fourthwall/importer.ts: Fourthwall exposes no endpoint that creates a physical
 * product with an explicit price and variant list, so any write would return 400. The
 * previous version of this script called syncArtworksToFourthwall() and reported success
 * for responses it never checked.
 */
async function main() {
  console.log('====================================================');
  console.log(' Rory Skagen Studio -> Fourthwall Diagnostics       ');
  console.log('====================================================\n');

  const summary = getArtworksSummary();

  console.log('📦 Local catalogue');
  console.log(`  Total artworks      : ${summary.totalArtworks}`);
  console.log(`  Status breakdown    : ${JSON.stringify(summary.statusBreakdown)}`);
  console.log(`  Publishable (Available): ${summary.publishableCount}`);
  console.log(`    with original record : ${summary.publishableWithOriginal}`);
  console.log(`    prints only          : ${summary.publishablePrintsOnly}`);

  console.log('\n📚 Series breakdown');
  Object.entries(summary.seriesBreakdown).forEach(([series, count]) => {
    console.log(`  - ${series}: ${count} pieces`);
  });

  console.log('\n🔑 Resolved configuration');
  console.log(`  Storefront API URL  : ${summary.credentialsStatus.storefrontApiUrl}`);
  console.log(`  Platform API URL    : ${summary.credentialsStatus.platformApiUrl}`);
  console.log(`  Auth mode           : ${summary.credentialsStatus.authMode}`);
  console.log(`  Checkout domain     : ${summary.credentialsStatus.checkoutDomain}`);

  console.log('\n📡 Live Fourthwall state (queried, not inferred)');
  const state = await getFourthwallConnectionState();
  console.log(`  Reachable           : ${state.reachable}`);
  console.log(`  Authenticated       : ${state.authenticated}`);
  if (state.shop) {
    console.log(`  Shop                : ${state.shop.name} (${state.shop.status}) — ${state.shop.domain}`);
  }
  if (typeof state.productCount === 'number') {
    console.log(`  Products in store   : ${state.productCount}`);
  }
  if (state.collections) {
    console.log(`  Collections         : ${state.collections.map((c) => c.slug).join(', ') || '(none)'}`);
  }
  if (state.error) {
    console.log(`  ⚠️  ${state.error}`);
  }
  console.log(`  Checked at          : ${state.checkedAt}`);

  console.log('\n🚧 Write path');
  console.log(`  Supported           : ${FOURTHWALL_WRITE_PATH_STATUS.supported}`);
  console.log(`  Reason              : ${FOURTHWALL_WRITE_PATH_STATUS.reason}`);
  console.log(`  Detail              : ${FOURTHWALL_WRITE_PATH_STATUS.detail}`);
  console.log(`  Verified against    : ${FOURTHWALL_WRITE_PATH_STATUS.verifiedAgainst} (${FOURTHWALL_WRITE_PATH_STATUS.verifiedOn})`);

  console.log('\n' + '='.repeat(52));
  console.log(` Publishable artworks: ${getPublishableArtworks().length}`);
  console.log(' No write attempted. See the write-path status above.');
  console.log('='.repeat(52) + '\n');
}

main().catch((err) => {
  console.error('Fatal diagnostics error:', err);
  process.exit(1);
});
