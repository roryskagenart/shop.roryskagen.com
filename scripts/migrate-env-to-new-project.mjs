#!/usr/bin/env node
/**
 * Copy this project's environment variables from the OLD Vercel account to the NEW one.
 *
 * WHY THIS EXISTS
 * The repo moved to a new Vercel account (`roryskagen-5713` / project `shop-roryskagen-com`) so the
 * Git integration could be connected. The new project builds fine but has NO environment variables,
 * so every Fourthwall read fails: collection pages render 0 products, product pages 404, and
 * robots.txt falls back to a per-deployment URL. This script closes that gap.
 *
 * WHY IT READS FILES INSTEAD OF THE API
 * `vercel env pull` writes `[SENSITIVE]` placeholders for secret-typed values, and a Vercel token for
 * one account cannot read another account's project. So the values are assembled from two local
 * files, with `.env.local` (which holds the real secrets) taking precedence:
 *
 *   .env.oldprod   production pull from the OLD project  -> the public/config values
 *   .env.local     local dev file                        -> the real secret values
 *
 * Both match the gitignored `.env*` pattern and are never committed.
 *
 * USAGE
 *   VERCEL_TOKEN=<token for the roryskagen-5713 account> node scripts/migrate-env-to-new-project.mjs
 *
 *   DRY_RUN=1     print what would happen, write nothing
 *   NEW_PROJECT   override the target project (default: shop-roryskagen-com)
 *   NEW_SCOPE     team id, only if the target is a team rather than a personal account
 *
 * NOTE ON `NEXT_PUBLIC_FW_STOREFRONT_TOKEN`
 * It is a *storefront* token — it ships in the client JS bundle by design, so treating it as plain
 * (pullable) rather than encrypted matches how the old project had it, and keeps local `env pull`
 * usable. Everything genuinely secret is written as `encrypted`, which means it CANNOT be pulled
 * back down. That is expected: re-add it by hand if you ever need it locally.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOKEN = process.env.VERCEL_TOKEN;
const PROJECT = process.env.NEW_PROJECT || 'shop-roryskagen-com';
const SCOPE = process.env.NEW_SCOPE || '';
const DRY_RUN = process.env.DRY_RUN === '1';
const TARGETS = ['production', 'preview', 'development'];

/** Values that must be encrypted rather than plain. Everything else is written as `plain`. */
const SECRET_KEYS = new Set([
  'FOURTHWALL_API_USERNAME',
  'FOURTHWALL_API_PASSWORD',
  'FOURTHWALL_WEBHOOK_SECRET',
  'IMPORT_ADMIN_PASSWORD',
  'GEMINI_API_SECRET_KEY',
  'OPENROUTER_API_KEY',
  'AI_GATEWAY_API_KEY',
  'GITHUB_KEY'
]);

/** Only these are ours. Anything else in a pull is Vercel/Turbo-injected and must not be copied. */
const PROJECT_KEYS = new Set([
  'AI_GATEWAY_API_KEY',
  'FOURTHWALL_API_PASSWORD',
  'FOURTHWALL_API_USERNAME',
  'FOURTHWALL_WEBHOOK_SECRET',
  'GEMINI_API_SECRET_KEY',
  'GITHUB_KEY',
  'IMPORT_ADMIN_PASSWORD',
  'IMPORT_ADMIN_USER',
  'NEXT_PUBLIC_FW_API_URL',
  'NEXT_PUBLIC_FW_CHECKOUT',
  'NEXT_PUBLIC_FW_COLLECTION',
  'NEXT_PUBLIC_FW_STOREFRONT_TOKEN',
  'NEXT_PUBLIC_GTM_ID',
  'NEXT_PUBLIC_USE_FW_IMAGE_OPTIMIZATION',
  'NEXT_PUBLIC_VERCEL_URL',
  'OPENROUTER_API_KEY'
]);

/**
 * The old value is `https://roryskagenshop.vercel.app`, a project alias that cannot follow us to a
 * different account (vercel.app subdomains are bound to the project name). Point it at the domain
 * the shop is meant to live on, so sitemap.xml and robots.txt stop advertising a deployment URL.
 */
const OVERRIDES = {
  NEXT_PUBLIC_VERCEL_URL: 'https://shop.roryskagenart.com'
};

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const masked = (v) => (v && v.length > 8 ? `${v.slice(0, 5)}…${v.length} chars` : '(short)');

function api(path, init) {
  const url = new URL(`https://api.vercel.com${path}`);
  if (SCOPE) url.searchParams.set('teamId', SCOPE);
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  });
}

async function main() {
  if (!TOKEN) {
    console.error('VERCEL_TOKEN is not set. Export a token for the roryskagen-5713 account first.');
    process.exit(1);
  }

  const fromOld = parseEnvFile(resolve(ROOT, '.env.oldprod'));
  const fromLocal = parseEnvFile(resolve(ROOT, '.env.local'));
  // `.env.local` wins: it holds the real secret values, the pull holds placeholders for them.
  const merged = { ...fromOld, ...fromLocal };

  const plan = [];
  const skipped = [];

  for (const key of PROJECT_KEYS) {
    const raw = merged[key];
    if (raw === undefined || raw === '' || raw === '[SENSITIVE]') {
      skipped.push(key);
      continue;
    }
    plan.push({ key, value: OVERRIDES[key] ?? raw, type: SECRET_KEYS.has(key) ? 'encrypted' : 'plain' });
  }

  console.log(`Target project : ${PROJECT}${SCOPE ? ` (team ${SCOPE})` : ''}`);
  console.log(`Will write     : ${plan.length} variables -> ${TARGETS.join(', ')}`);
  if (skipped.length) {
    console.log(`\n⚠️  No value found for ${skipped.length}: ${skipped.join(', ')}`);
    console.log('   These must be added by hand. A webhook secret cannot be recovered from Vercel —');
    console.log('   if it is regenerated, Fourthwall\'s webhook config must be updated to match.');
  }

  console.log('');
  for (const p of plan) {
    const note = OVERRIDES[p.key] ? '  <- overridden' : '';
    console.log(`  ${p.type === 'encrypted' ? '🔒' : '  '} ${p.key.padEnd(38)} ${masked(p.value)}${note}`);
  }

  if (DRY_RUN) {
    console.log('\nDRY_RUN=1 — nothing written.');
    return;
  }

  // Read what already exists so re-runs update instead of failing on a duplicate key.
  const listRes = await api(`/v9/projects/${PROJECT}/env?decrypt=false`);
  if (!listRes.ok) {
    console.error(`\nCould not list env for "${PROJECT}": ${listRes.status} ${await listRes.text()}`);
    process.exit(1);
  }
  const existing = new Map();
  for (const e of (await listRes.json()).envs ?? []) existing.set(e.key, e);

  console.log('\nApplying:');
  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const p of plan) {
    const prior = existing.get(p.key);
    const body = { key: p.key, value: p.value, type: p.type, target: TARGETS };
    const res = prior
      ? await api(`/v9/projects/${PROJECT}/env/${prior.id}`, { method: 'PATCH', body: JSON.stringify(body) })
      : await api(`/v10/projects/${PROJECT}/env`, { method: 'POST', body: JSON.stringify(body) });

    if (res.ok) {
      if (prior) updated++;
      else created++;
      console.log(`  ✓ ${prior ? 'updated' : 'created'}  ${p.key}`);
    } else {
      failed++;
      console.log(`  ✗ FAILED   ${p.key}  ${res.status} ${(await res.text()).slice(0, 200)}`);
    }
  }

  console.log(`\nCreated ${created}, updated ${updated}, failed ${failed}, skipped ${skipped.length}.`);
  if (failed) process.exitCode = 1;
  else console.log('Now redeploy so the new variables take effect: the next push, or `vercel --prod`.');
}

main().catch((err) => {
  console.error('\nFatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});
