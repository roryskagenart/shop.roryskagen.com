#!/usr/bin/env node
/**
 * fw-seeder CLI — Universal Fourthwall Merchandise Seeder
 *
 * Usage:
 *   npx tsx lib/fw-seeder/cli.ts --config ./seed-config.json
 *   npx tsx lib/fw-seeder/cli.ts --config ./seed-config.json --dry-run
 *   npx tsx lib/fw-seeder/cli.ts --template <id> --artwork <url> --name "My Product"
 *
 * The --config mode reads a JSON file matching SeederConfig.
 * The --template mode creates a single product from CLI flags.
 */

import {
  type FourthwallCredentials,
  type SeederConfig,
  type SeederResult,
  type SeederArtwork,
  type SeederTemplateConfig
} from './types';
import {
  resolveAuthMode,
  buildAuthHeader,
  listTemplates,
  getTemplateAreas,
  FourthwallApiError
} from './client';
import { fetchUploadAndRegister } from './upload';
import { createProduct } from './product';
import { ensureCollection } from './collection';

interface CliArgs {
  config?: string;
  template?: string;
  artwork?: string;
  name?: string;
  description?: string;
  region?: string;
  margin?: number;
  dryRun: boolean;
  publish: boolean;
  token?: string;
  username?: string;
  password?: string;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { dryRun: false, publish: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const next = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${flag} needs a value`);
      return v;
    };
    switch (flag) {
      case '--config':
        args.config = next();
        break;
      case '--template':
        args.template = next();
        break;
      case '--artwork':
        args.artwork = next();
        break;
      case '--name':
        args.name = next();
        break;
      case '--description':
        args.description = next();
        break;
      case '--region':
        args.region = next();
        break;
      case '--margin':
        args.margin = Number(next());
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--publish':
        args.publish = true;
        break;
      case '--token':
        args.token = next();
        break;
      case '--username':
        args.username = next();
        break;
      case '--password':
        args.password = next();
        break;
      default:
        if (flag && flag.startsWith('-')) throw new Error(`Unknown flag: ${flag}`);
    }
  }
  return args;
}

function resolveCredentials(args: CliArgs): FourthwallCredentials {
  return {
    accessToken: args.token || process.env.FOURTHWALL_ACCESS_TOKEN || undefined,
    apiUsername: args.username || process.env.FOURTHWALL_API_USERNAME || undefined,
    apiPassword: args.password || process.env.FOURTHWALL_API_PASSWORD || undefined
  };
}

function printUsage() {
  console.log(`
fw-seeder — Universal Fourthwall Merchandise Seeder

Usage (config mode):
  npx tsx lib/fw-seeder/cli.ts --config ./seed-config.json [--dry-run]

Usage (single product mode):
  npx tsx lib/fw-seeder/cli.ts --template <id> --artwork <url> --name "Product Name"
    [--description "..."] [--region <id>] [--margin <usd>] [--publish]

Authentication (pick one):
  --token <bearer>          or env FOURTHWALL_ACCESS_TOKEN
  --username <u> --password <p>  or env FOURTHWALL_API_USERNAME / API_PASSWORD

Flags:
  --config <path>     JSON config file (SeederConfig shape)
  --dry-run           Validate config, list plan, do not create
  --publish           Publish products immediately (default: hidden)
`);
}

async function runConfigMode(args: CliArgs, creds: FourthwallCredentials): Promise<void> {
  if (!args.config) {
    console.error('Error: --config required for config mode');
    printUsage();
    process.exit(1);
  }

  // Read config file
  const fs = await import('fs');
  const config: SeederConfig = JSON.parse(fs.readFileSync(args.config, 'utf-8'));

  // Validate credentials
  const authMode = resolveAuthMode(creds);
  if (authMode === 'none') {
    console.error('Error: No credentials. Set --token or --username/--password.');
    process.exit(1);
  }

  console.log('='.repeat(72));
  console.log(` fw-seeder — Config Mode — ${args.dryRun ? 'DRY RUN' : 'APPLY'}`);
  console.log('='.repeat(72));
  console.log(` Auth mode    : ${authMode}`);
  console.log(` Artworks     : ${config.artworks.length}`);
  console.log(` Templates    : ${config.templates.length}`);
  console.log(` Collections  : ${config.collections.length}`);
  console.log('');

  if (args.dryRun) {
    console.log('DRY RUN — No products will be created.');
    console.log('\nPlanned products:');
    for (const collection of config.collections) {
      console.log(`\n  Collection: ${collection.name} (${collection.handle})`);
      for (const pair of collection.pairs) {
        const artwork = config.artworks.find((a) => a.id === pair.artworkId);
        const template = config.templates.find((t) => t.templateId === pair.templateId);
        console.log(`    - ${artwork?.name ?? pair.artworkId} × ${template?.templateName ?? pair.templateId}`);
      }
    }
    return;
  }

  // Execute: create products
  const result: SeederResult = {
    executionId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    products: [],
    collections: [],
    errors: []
  };

  // Track created products to avoid duplicate uploads
  const productCache = new Map<string, { productId: string; imageId: string }>();

  for (const collection of config.collections) {
    console.log(`\nProcessing collection: ${collection.name}`);
    const collectionProductIds: string[] = [];

    for (const pair of collection.pairs) {
      const artwork = config.artworks.find((a) => a.id === pair.artworkId);
      const template = config.templates.find((t) => t.templateId === pair.templateId);

      if (!artwork || !template) {
        result.errors.push({
          artworkId: pair.artworkId,
          templateId: pair.templateId,
          collectionHandle: collection.handle,
          step: 'CREATE_PRODUCT',
          message: `Missing artwork or template config`
        });
        continue;
      }

      const cacheKey = `${pair.artworkId}:${pair.templateId}`;
      const cached = productCache.get(cacheKey);

      let productId: string;
      let imageId: string;

      if (cached) {
        console.log(`  ✓ ${artwork.name} × ${template.templateName} (cached)`);
        productId = cached.productId;
        imageId = cached.imageId;
      } else {
        try {
          // Upload image
          console.log(`  → Uploading image for ${artwork.name}...`);
          imageId = await fetchUploadAndRegister({
            credentials: creds,
            imageUrl: artwork.imageUrl,
            fileName: `${artwork.id}.${artwork.imageContentType === 'image/png' ? 'png' : 'jpg'}`,
            contentType: artwork.imageContentType,
            width: artwork.imageWidth,
            height: artwork.imageHeight
          });

          // Create product
          console.log(`  → Creating product: ${artwork.name} — ${template.templateName}...`);
          const created = await createProduct({
            credentials: creds,
            templateId: template.templateId,
            name: `${artwork.name} — ${template.templateName}`,
            description: artwork.description,
            imageId,
            region: template.region,
            placementStrategy: template.placementStrategy,
            colors: template.colors,
            sizes: template.sizes,
            profitMargin: template.profitMargin,
            publishOnCreate: args.publish || template.publishOnCreate
          });

          productId = created.productId;
          productCache.set(cacheKey, { productId, imageId });

          result.products.push({
            artworkId: artwork.id,
            templateId: template.templateId,
            productId,
            name: `${artwork.name} — ${template.templateName}`,
            imageId
          });

          console.log(`  ✓ Created: ${productId}`);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          result.errors.push({
            artworkId: artwork.id,
            templateId: template.templateId,
            collectionHandle: collection.handle,
            step: 'CREATE_PRODUCT',
            message
          });
          console.error(`  ✗ Failed: ${message}`);
          continue;
        }
      }

      collectionProductIds.push(productId);
    }

    // Create/update collection
    try {
      console.log(`  → Updating collection: ${collection.name}...`);
      const { collection: col, created } = await ensureCollection({
        credentials: creds,
        name: collection.name,
        description: collection.description,
        productIds: collectionProductIds
      });

      result.collections.push({
        handle: collection.handle,
        collectionId: col.id,
        name: col.name
      });

      console.log(`  ✓ Collection ${created ? 'created' : 'updated'}: ${col.id} (${col.slug})`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push({
        collectionHandle: collection.handle,
        step: 'CREATE_COLLECTION',
        message
      });
      console.error(`  ✗ Collection failed: ${message}`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(72));
  console.log(' SUMMARY');
  console.log('='.repeat(72));
  console.log(` Products created : ${result.products.length}`);
  console.log(` Collections      : ${result.collections.length}`);
  console.log(` Errors           : ${result.errors.length}`);
  console.log(` Execution ID     : ${result.executionId}`);
  console.log('='.repeat(72));

  if (result.errors.length > 0) {
    console.log('\nErrors:');
    for (const err of result.errors) {
      console.log(`  [${err.step}] ${err.message}`);
    }
    process.exitCode = 1;
  }
}

async function runSingleMode(args: CliArgs, creds: FourthwallCredentials): Promise<void> {
  if (!args.template || !args.artwork || !args.name) {
    console.error('Error: --template, --artwork, and --name are required for single product mode');
    printUsage();
    process.exit(1);
  }

  const authMode = resolveAuthMode(creds);
  if (authMode === 'none') {
    console.error('Error: No credentials. Set --token or --username/--password.');
    process.exit(1);
  }

  console.log('='.repeat(72));
  console.log(` fw-seeder — Single Product — ${args.dryRun ? 'DRY RUN' : 'APPLY'}`);
  console.log('='.repeat(72));
  console.log(` Template : ${args.template}`);
  console.log(` Artwork  : ${args.artwork}`);
  console.log(` Name     : ${args.name}`);
  console.log(` Publish  : ${args.publish ? 'yes' : 'no (hidden)'}`);
  console.log('');

  if (args.dryRun) {
    console.log('DRY RUN — No product will be created.');
    return;
  }

  // Fetch template areas to validate region
  console.log('Fetching template info...');
  const areas = await getTemplateAreas(creds, args.template);
  const availableRegions = areas.map((a) => a.regionId).join(', ') || '(none)';

  const region = args.region || areas[0]?.regionId;
  if (!region) {
    console.error(`Error: No region specified and template has no available areas.`);
    process.exit(1);
  }
  if (!areas.some((a) => a.regionId === region)) {
    console.error(`Error: Region "${region}" not available. Available: ${availableRegions}`);
    process.exit(1);
  }

  console.log(`Region   : ${region} (available: ${availableRegions})`);

  // Upload image
  console.log('\nUploading artwork...');
  const imageId = await fetchUploadAndRegister({
    credentials: creds,
    imageUrl: args.artwork,
    fileName: 'artwork.jpg',
    contentType: 'image/jpeg',
    width: 2400,
    height: 2400
  });
  console.log(`Image registered: ${imageId}`);

  // Create product
  console.log('\nCreating product...');
  const created = await createProduct({
    credentials: creds,
    templateId: args.template,
    name: args.name,
    description: args.description || '',
    imageId,
    region,
    profitMargin: args.margin,
    publishOnCreate: args.publish
  });

  console.log('\n' + '='.repeat(72));
  console.log(' PRODUCT CREATED');
  console.log('='.repeat(72));
  console.log(` Product ID       : ${created.productId}`);
  console.log(` Customization ID : ${created.customizationId}`);
  console.log(` Images           : ${created.images.length}`);
  console.log('='.repeat(72));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (process.argv.slice(2).includes('--help') || process.argv.slice(2).includes('-h')) {
    printUsage();
    return;
  }

  const creds = resolveCredentials(args);

  if (args.config) {
    await runConfigMode(args, creds);
  } else {
    await runSingleMode(args, creds);
  }
}

main().catch((err) => {
  console.error('\nFatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
