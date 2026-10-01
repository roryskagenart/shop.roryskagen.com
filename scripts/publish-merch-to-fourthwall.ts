import {
  FOURTHWALL_MIN_ACCEPTED_PX,
  buildDesignProductRequest,
  buildRegisterImageRequest,
  buildUploadUrlRequest,
  contentTypeForUrl,
  evaluateArtworkForMerch,
  merchDescription,
  merchProductName,
  profitMarginForTarget
} from '../lib/fourthwall/merch';
import {
  buildPlatformAuthHeader,
  getPublishableArtworks,
  getResolvedCredentials,
  getPlatformBaseUrl,
  PLATFORM_API_PREFIX
} from '../lib/fourthwall/importer';

/**
 * Publish merch carrying Rory's artwork to Fourthwall, via the design pipeline.
 *
 * DRY RUN BY DEFAULT. Nothing is uploaded or created unless `--apply` is passed. This is deliberate:
 * the previous version of this script reported success for responses it never checked, and created a
 * count of "137 synced" against a shop holding one product.
 *
 * Usage:
 *   npx tsx scripts/publish-merch-to-fourthwall.ts                       # dry run, shows the plan
 *   npx tsx scripts/publish-merch-to-fourthwall.ts --template <id|name>  # dry run against a template
 *   npx tsx scripts/publish-merch-to-fourthwall.ts --template <id> --apply
 *
 * Flags:
 *   --apply              actually upload and create. Without it, nothing leaves this process.
 *   --template <id|name> required to create; matched on id, then on exact name.
 *   --target-price <usd> target retail price; converted to Fourthwall's profitMargin.
 *   --margin <usd>       explicit margin, used instead of --target-price.
 *   --region <id>        which customizable area to render into. Resolved from the template when the
 *                        template offers exactly one area; required when it offers several.
 *   --publish            publish on create. Default is hidden.
 *   --limit <n>          stop after n eligible artworks.
 *   --min-px <n>         override the 1500px gate.
 *   --only <slug>        single artwork by slug.
 */

interface Args {
  apply: boolean;
  template?: string;
  targetPrice?: number;
  margin?: number;
  region?: string;
  publish: boolean;
  limit?: number;
  minPx: number;
  only?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { apply: false, publish: false, minPx: FOURTHWALL_MIN_ACCEPTED_PX };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const next = (): string => {
      const value = argv[++i];
      if (value === undefined) throw new Error(`${flag} needs a value`);
      return value;
    };
    switch (flag) {
      case '--apply':
        args.apply = true;
        break;
      case '--template':
        args.template = next();
        break;
      case '--target-price':
        args.targetPrice = Number(next());
        break;
      case '--margin':
        args.margin = Number(next());
        break;
      case '--region':
        args.region = next();
        break;
      case '--publish':
        args.publish = true;
        break;
      case '--limit':
        args.limit = Number(next());
        break;
      case '--min-px':
        args.minPx = Number(next());
        break;
      case '--only':
        args.only = next();
        break;
      default:
        throw new Error(`Unknown flag: ${flag}`);
    }
  }
  return args;
}

interface Template {
  productId: string;
  name: string;
  category?: string;
  basePrice?: { amount: number; currency: string };
  productionMethod?: string;
}

interface TemplateArea {
  regionId: string;
  name?: string;
  type?: string;
  available?: boolean;
  dimensions?: {
    dpi?: number;
    pixelsWidth?: number;
    pixelsHeight?: number;
    inchesWidth?: number;
    inchesHeight?: number;
  };
  placements?: Array<{ id: string; name?: string }>;
}

interface ProductSummary {
  id: string;
  name: string;
}

function baseUrl(): string {
  return `${getPlatformBaseUrl(getResolvedCredentials())}${PLATFORM_API_PREFIX}`;
}

function authHeader(): Record<string, string> {
  const auth = buildPlatformAuthHeader(getResolvedCredentials());
  if (!auth) throw new Error('No usable Platform API credentials. Set FOURTHWALL_API_USERNAME/PASSWORD.');
  return auth;
}

/** Every call goes through here so a non-2xx can never be mistaken for success. */
async function api(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
  timeoutMs = 30000
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs)
  });
  const text = await res.text();
  let data: unknown = text;
  try {
    data = JSON.parse(text);
  } catch {
    /* keep raw text so HTML error pages surface instead of being hidden */
  }
  return { ok: res.ok, status: res.status, data };
}

function describeError(data: unknown): string {
  if (typeof data === 'string') return data.slice(0, 300);
  const d = data as { title?: string; detail?: string; message?: string };
  return d?.detail || d?.message || d?.title || JSON.stringify(data).slice(0, 300);
}

async function fetchTemplates(): Promise<Template[]> {
  const res = await api('GET', '/product-templates');
  if (!res.ok) throw new Error(`Could not list templates: ${res.status} ${describeError(res.data)}`);
  return ((res.data as { results?: Template[] }).results ?? []) as Template[];
}

/**
 * The template's customizable areas.
 *
 * `regions[].region` on the create call must equal one of these `regionId` values — NOT a placement.
 * The distinction bites: a tee exposes `front` / `back` / `sleeve_left` …, so a hardcoded "front"
 * happens to work there, but a mug exposes a single area named `default` whose *placements* are
 * `front` and `back`. Passing "front" for a mug is rejected. Hence: always resolve against the
 * template rather than assuming.
 */
async function fetchTemplateAreas(productId: string): Promise<TemplateArea[]> {
  const res = await api('GET', `/product-templates/${encodeURIComponent(productId)}`);
  if (!res.ok) {
    throw new Error(`Could not read template ${productId}: ${res.status} ${describeError(res.data)}`);
  }
  return ((res.data as { customizableAreas?: TemplateArea[] }).customizableAreas ?? []) as TemplateArea[];
}

async function resolveRegionArea(template: Template, requested?: string): Promise<TemplateArea> {
  const areas = (await fetchTemplateAreas(template.productId)).filter((a) => a.available !== false);
  const available = areas.map((a) => a.regionId).join(', ') || '(none reported)';

  if (requested) {
    const match = areas.find((a) => a.regionId === requested);
    if (!match) {
      throw new Error(`Region "${requested}" is not on "${template.name}". Available: ${available}`);
    }
    return match;
  }

  const only = areas[0];
  if (areas.length === 1 && only) return only;

  throw new Error(
    `"${template.name}" offers ${areas.length} customizable areas (${available}). Pass --region <id> to choose one.`
  );
}

function describeArea(area: TemplateArea): string {
  const d = area.dimensions;
  const px = d?.pixelsWidth && d?.pixelsHeight ? `${d.pixelsWidth}x${d.pixelsHeight}px` : 'size unknown';
  const dpi = d?.dpi ? ` @ ${d.dpi} DPI` : '';
  const placements = (area.placements ?? []).map((p) => p.id).join('/');
  return `${px}${dpi}${placements ? ` · placements: ${placements}` : ''}`;
}

async function fetchExistingProductNames(): Promise<Set<string>> {
  const res = await api('GET', '/products?size=100');
  if (!res.ok) throw new Error(`Could not list products: ${res.status} ${describeError(res.data)}`);
  const results = ((res.data as { results?: ProductSummary[] }).results ?? []) as ProductSummary[];
  return new Set(results.map((p) => p.name));
}

/** Step 2+3: request a pre-signed URL, then PUT the bytes straight to GCS. */
async function uploadBytes(
  bytes: Buffer,
  fileName: string,
  contentType: string
): Promise<{ fileUrl: string }> {
  // Computed once, from the bytes we actually hold, and reused verbatim in the PUT header. GCS
  // rejects the upload with 403 SignatureDoesNotMatch if the two ever disagree.
  const size = bytes.byteLength;

  const urlRes = await api('POST', '/media/upload-url', buildUploadUrlRequest(fileName, contentType, size));
  if (!urlRes.ok) throw new Error(`upload-url failed: ${urlRes.status} ${describeError(urlRes.data)}`);

  const { uploadUrl, fileUrl } = urlRes.data as { uploadUrl?: string; fileUrl?: string };
  if (!uploadUrl || !fileUrl) throw new Error('upload-url returned no uploadUrl/fileUrl');

  // Direct to Google Cloud Storage — Fourthwall credentials must NOT be sent here.
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'x-goog-content-length-range': `0,${size}`
    },
    body: new Uint8Array(bytes),
    signal: AbortSignal.timeout(120000)
  });
  if (!put.ok) throw new Error(`GCS PUT failed: ${put.status} ${(await put.text()).slice(0, 200)}`);

  return { fileUrl };
}

/** Step 4: register the uploaded file, returning the imageId a region needs. */
async function registerImage(fileUrl: string, width: number, height: number): Promise<string> {
  const res = await api('POST', '/media/images', buildRegisterImageRequest(fileUrl, width, height));
  if (!res.ok) throw new Error(`media/images failed: ${res.status} ${describeError(res.data)}`);
  const { id } = res.data as { id?: string };
  if (!id) throw new Error('media/images returned no id');
  return id;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.apply ? 'APPLY' : 'DRY RUN';

  console.log('='.repeat(72));
  console.log(` Fourthwall merch publish — ${mode}`);
  console.log('='.repeat(72));
  if (!args.apply) console.log(' Nothing will be uploaded or created. Pass --apply to execute.\n');

  const creds = getResolvedCredentials();
  console.log(` Platform API : ${getPlatformBaseUrl(creds)}`);
  console.log(` Gate         : shortest side >= ${args.minPx}px`);
  console.log('');

  const templates = await fetchTemplates();
  const existingNames = await fetchExistingProductNames();

  let template: Template | undefined;
  if (args.template) {
    template = templates.find((t) => t.productId === args.template) ?? templates.find((t) => t.name === args.template);
    if (!template) {
      console.log(`Template "${args.template}" not found. Available:\n`);
      for (const t of templates) {
        console.log(`  ${t.productId}  ${t.name}  [${t.category}]  base ${t.basePrice?.amount ?? '?'}`);
      }
      process.exitCode = 1;
      return;
    }
    console.log(` Template     : ${template.name} (${template.productId})`);
    if (template.basePrice) console.log(` Base cost    : ${template.basePrice.amount} ${template.basePrice.currency}`);
  } else {
    console.log(` Template     : (none given — ${templates.length} available; pass --template to create)`);
  }

  let region: string | undefined;
  if (template) {
    const area = await resolveRegionArea(template, args.region);
    region = area.regionId;
    console.log(` Region       : ${region} — ${describeArea(area)}`);
  }

  let margin: number | undefined = args.margin;
  if (margin === undefined && args.targetPrice !== undefined) {
    const base = template?.basePrice?.amount;
    if (base === undefined) {
      console.log('\n --target-price needs a --template with a known base cost.');
      process.exitCode = 1;
      return;
    }
    const computed = profitMarginForTarget(args.targetPrice, base);
    if (computed === null) {
      console.log(`\n Target ${args.targetPrice} does not clear base cost ${base} — refusing to create an unsellable product.`);
      process.exitCode = 1;
      return;
    }
    margin = computed;
    console.log(` Margin       : ${margin} USD (target ${args.targetPrice} - base ${base})`);
  } else if (margin !== undefined) {
    console.log(` Margin       : ${margin} USD (explicit)`);
  }
  console.log(` Publish      : ${args.publish ? 'yes' : 'no (created hidden)'}`);
  console.log('');

  let candidates = getPublishableArtworks();
  if (args.only) candidates = candidates.filter((a) => a.slug === args.only);

  const eligible = [];
  const skipped = [];
  for (const artwork of candidates) {
    const verdict = evaluateArtworkForMerch(artwork, args.minPx);
    if (verdict.eligible) eligible.push(artwork);
    else skipped.push({ artwork, verdict });
  }

  console.log('-'.repeat(72));
  console.log(` Publishable artworks      : ${candidates.length}`);
  console.log(` Eligible at ${args.minPx}px gate    : ${eligible.length}`);
  console.log(` Skipped                   : ${skipped.length}`);
  console.log('-'.repeat(72));
  if (skipped.length) {
    const byReason = new Map<string, number>();
    for (const s of skipped) byReason.set(s.verdict.reason ?? '?', (byReason.get(s.verdict.reason ?? '?') ?? 0) + 1);
    for (const [reason, count] of byReason) console.log(`   skipped (${reason}): ${count}`);
    console.log('');
    for (const s of skipped.slice(0, 3)) console.log(`   e.g. ${s.artwork.slug}: ${s.verdict.detail}`);
    if (skipped.length > 3) console.log(`   ... and ${skipped.length - 3} more`);
  }

  if (eligible.length === 0) {
    console.log('\n Nothing is eligible. No write attempted.');
    return;
  }
  if (!template) {
    console.log('\n No --template given, so no product can be created. No write attempted.');
    return;
  }

  const queue = args.limit ? eligible.slice(0, args.limit) : eligible;
  console.log(`\n Will process ${queue.length} artwork(s):\n`);

  let created = 0;
  let alreadyPresent = 0;
  let failed = 0;

  for (const artwork of queue) {
    const name = merchProductName(artwork, template.name);
    const prefix = `  ${artwork.slug}`;

    if (existingNames.has(name)) {
      console.log(`${prefix} — SKIP, a product named "${name}" already exists`);
      alreadyPresent++;
      continue;
    }

    if (!args.apply) {
      const contentType = contentTypeForUrl(artwork.image.url) ?? '?';
      console.log(`${prefix} — would create "${name}"`);
      console.log(`      image ${artwork.image.width}x${artwork.image.height} ${contentType}`);
      console.log(`      ${artwork.image.url}`);
      continue;
    }

    try {
      const contentType = contentTypeForUrl(artwork.image.url);
      if (!contentType) throw new Error(`unsupported image format for ${artwork.image.url}`);

      const res = await fetch(artwork.image.url, { signal: AbortSignal.timeout(60000) });
      if (!res.ok) throw new Error(`fetch image failed: ${res.status}`);
      const bytes = Buffer.from(await res.arrayBuffer());

      const fileName = `${artwork.slug}.${contentType === 'image/png' ? 'png' : 'jpg'}`;
      const { fileUrl } = await uploadBytes(bytes, fileName, contentType);
      const imageId = await registerImage(fileUrl, artwork.image.width, artwork.image.height);

      const productRes = await api(
        'POST',
        '/products',
        buildDesignProductRequest({
          templateId: template.productId,
          name,
          description: merchDescription(artwork),
          imageId,
          region,
          profitMargin: margin,
          publishOnCreate: args.publish
        }),
        120000
      );
      if (!productRes.ok) throw new Error(`create failed: ${productRes.status} ${describeError(productRes.data)}`);

      const { productId } = productRes.data as { productId?: string };
      console.log(`${prefix} — CREATED ${productId ?? '(no id returned)'}  imageId=${imageId}  "${name}"`);
      created++;
    } catch (err) {
      // Never counted as success. This is the bug the previous importer shipped.
      console.log(`${prefix} — FAILED: ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(72));
  console.log(` ${args.apply ? 'Created' : 'Would create'} : ${args.apply ? created : queue.length - alreadyPresent}`);
  if (alreadyPresent) console.log(` Already present : ${alreadyPresent}`);
  if (failed) console.log(` FAILED          : ${failed}`);
  console.log(` Skipped (quality/format): ${skipped.length}`);
  console.log('='.repeat(72));

  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('\nFatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
