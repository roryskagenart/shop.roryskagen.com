import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';

/**
 * Guards an invariant that is otherwise invisible until a real visitor hits it.
 *
 * `middleware.ts` puts `/import` and `/api/import/fourthwall` behind HTTP Basic auth. Those paths
 * are reachable by URL, but any *link* to them from a public surface hands an anonymous visitor a
 * browser password prompt. That is not a crash and not a 404 — nothing in CI would notice — so it
 * needs an explicit guard.
 *
 * SCOPE AND HONEST LIMITS. This is a static scan of `href` attributes in `components/**`. It
 * deliberately does not catch:
 *   - hrefs built from variables or template literals (e.g. href={`/${slug}`})
 *   - hrefs in `app/**` (the gated page itself legitimately links to its own CSV export)
 *   - plain <a> links to an absolute gated URL
 * It is a tripwire for the obvious regression, not a proof. If it ever feels like proof, it is
 * being trusted for more than it does.
 */

// Keep in sync with the `matcher` in middleware.ts. middleware.test.ts asserts the matcher itself,
// so if the gate is widened there, this list is the thing to revisit.
const GATED_PATHS = ['/import', '/api/import/fourthwall'];

function collectTsx(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...collectTsx(full));
    } else if (entry.endsWith('.tsx')) {
      found.push(full);
    }
  }
  return found;
}

/** Every literal href value, with the line it appears on. */
function hrefLiterals(source: string): { value: string; line: number }[] {
  const results: { value: string; line: number }[] = [];
  const patterns = [
    /\bhref\s*=\s*"([^"]*)"/g, // href="/import"
    /\bhref\s*=\s*'([^']*)'/g, // href='/import'
    /\bhref\s*=\s*\{\s*['"]([^'"]*)['"]\s*\}/g, // href={'/import'}
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const value = match[1];
      // `noUncheckedIndexedAccess` makes the capture group optional in the type even though the
      // pattern always captures. Skip rather than assert.
      if (value === undefined) continue;
      const line = source.slice(0, match.index).split('\n').length;
      results.push({ value, line });
    }
  }
  return results;
}

function isGated(href: string): boolean {
  const pathOnly = href.split('?')[0]?.split('#')[0] ?? '';
  return GATED_PATHS.some((gated) => pathOnly === gated || pathOnly.startsWith(`${gated}/`));
}

describe('public surfaces do not link to gated routes', () => {
  const componentsDir = path.resolve(process.cwd(), 'components');
  const files = collectTsx(componentsDir);

  it('finds component files to scan', () => {
    // A scan that silently walks zero files would pass forever while guarding nothing.
    expect(files.length).toBeGreaterThan(10);
  });

  it('has no href in components/** pointing at /import or the import API', () => {
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      for (const { value, line } of hrefLiterals(source)) {
        if (isGated(value)) {
          offenders.push(`${path.relative(process.cwd(), file)}:${line} -> ${value}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('detects a gated href when one is present (the guard can fail)', () => {
    // Proves the matcher actually matches, so the passing test above is not passing because the
    // regex never fires. Without this, a typo in `isGated` would make the whole file vacuous.
    expect(hrefLiterals('<Link href="/import">x</Link>').map((h) => h.value)).toEqual(['/import']);
    expect(isGated('/import')).toBe(true);
    expect(isGated('/import/anything')).toBe(true);
    expect(isGated('/api/import/fourthwall?format=csv')).toBe(true);
    expect(isGated('/imported-art')).toBe(false);
    expect(isGated('/docs')).toBe(false);
  });
});
