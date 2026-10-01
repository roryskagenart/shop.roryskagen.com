import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

import { middleware, config } from './middleware';

/** Build a request against the gated surface, optionally with an Authorization header. */
function req(url = 'http://localhost/import', authorization?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authorization) headers.Authorization = authorization;
  return new NextRequest(url, { method: 'GET', headers });
}

/** Encode credentials the way a browser would for HTTP Basic. */
function basic(user: string, pass: string): string {
  return `Basic ${Buffer.from(`${user}:${pass}`, 'utf8').toString('base64')}`;
}

/** NextResponse.next() marks itself with this header; 401/503 responses do not. */
function isPassthrough(res: Response): boolean {
  return res.headers.get('x-middleware-next') === '1';
}

/**
 * `@types/node` declares `NODE_ENV` readonly on ProcessEnv, so a direct assignment fails
 * `tsc --noEmit` even though it works at runtime. Write through a mutable view instead.
 */
function setNodeEnv(value: 'production' | 'development' | 'test'): void {
  (process.env as Record<string, string>).NODE_ENV = value;
}

describe('Admin gate middleware', () => {
  const originalEnv = { ...process.env };
  const USER = 'studioadmin';
  const PASS = 'correct-horse-battery-staple';

  beforeEach(() => {
    process.env = { ...originalEnv, IMPORT_ADMIN_USER: USER, IMPORT_ADMIN_PASSWORD: PASS };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('matcher coverage', () => {
    it('gates /import, its subpaths and the import API', () => {
      expect(config.matcher).toEqual(['/import', '/import/:path*', '/api/import/fourthwall']);
    });
  });

  describe('unconfigured gate', () => {
    beforeEach(() => {
      delete process.env.IMPORT_ADMIN_USER;
      delete process.env.IMPORT_ADMIN_PASSWORD;
    });

    it('fails closed with 503 in production', () => {
      setNodeEnv('production');
      const res = middleware(req());
      expect(res.status).toBe(503);
      expect(isPassthrough(res)).toBe(false);
      expect(res.headers.get('Cache-Control')).toBe('no-store');
    });

    it('fails closed in production when only the password is missing', () => {
      setNodeEnv('production');
      process.env.IMPORT_ADMIN_USER = USER;
      const res = middleware(req());
      expect(res.status).toBe(503);
    });

    it('allows through in development so the surface stays usable locally', () => {
      setNodeEnv('development');
      const res = middleware(req());
      expect(res.status).toBe(200);
      expect(isPassthrough(res)).toBe(true);
    });
  });

  describe('rejects bad credentials', () => {
    it('returns 401 with a Basic challenge when no Authorization header is present', () => {
      const res = middleware(req());
      expect(res.status).toBe(401);
      expect(res.headers.get('WWW-Authenticate')).toContain('Basic realm=');
      expect(res.headers.get('Cache-Control')).toBe('no-store');
    });

    it('returns 401 for a non-Basic scheme', () => {
      expect(middleware(req('http://localhost/import', 'Bearer some-token')).status).toBe(401);
    });

    it('returns 401 for undecodable base64', () => {
      expect(middleware(req('http://localhost/import', 'Basic !!!not-base64!!!')).status).toBe(401);
    });

    it('returns 401 when the decoded value has no colon separator', () => {
      const encoded = `Basic ${Buffer.from('nocolonhere', 'utf8').toString('base64')}`;
      expect(middleware(req('http://localhost/import', encoded)).status).toBe(401);
    });

    it('returns 401 for a correct user with the wrong password', () => {
      expect(middleware(req('http://localhost/import', basic(USER, 'wrong'))).status).toBe(401);
    });

    it('returns 401 for a wrong user with the correct password', () => {
      expect(middleware(req('http://localhost/import', basic('nobody', PASS))).status).toBe(401);
    });

    it('returns 401 for a correct prefix with extra trailing characters', () => {
      expect(middleware(req('http://localhost/import', basic(USER, `${PASS}x`))).status).toBe(401);
    });
  });

  describe('accepts correct credentials', () => {
    it('passes through for the exact configured pair', () => {
      const res = middleware(req('http://localhost/import', basic(USER, PASS)));
      expect(res.status).toBe(200);
      expect(isPassthrough(res)).toBe(true);
    });

    it('passes through on the API route as well as the page', () => {
      const res = middleware(req('http://localhost/api/import/fourthwall', basic(USER, PASS)));
      expect(isPassthrough(res)).toBe(true);
    });

    it('accepts a password that itself contains a colon', () => {
      process.env.IMPORT_ADMIN_PASSWORD = 'pa:ss:word';
      const res = middleware(req('http://localhost/import', basic(USER, 'pa:ss:word')));
      expect(isPassthrough(res)).toBe(true);
    });

    it('accepts credentials containing non-ASCII characters', () => {
      process.env.IMPORT_ADMIN_PASSWORD = 'pässwörd-ünïcode';
      const res = middleware(req('http://localhost/import', basic(USER, 'pässwörd-ünïcode')));
      expect(isPassthrough(res)).toBe(true);
    });
  });

  describe('environment value normalisation', () => {
    it('strips surrounding double quotes from a configured value', () => {
      process.env.IMPORT_ADMIN_USER = `"${USER}"`;
      expect(isPassthrough(middleware(req('http://localhost/import', basic(USER, PASS))))).toBe(true);
    });

    it('strips surrounding single quotes from a configured value', () => {
      process.env.IMPORT_ADMIN_PASSWORD = `'${PASS}'`;
      expect(isPassthrough(middleware(req('http://localhost/import', basic(USER, PASS))))).toBe(true);
    });

    it('strips a trailing comment from a configured value', () => {
      process.env.IMPORT_ADMIN_USER = `${USER} # studio admin`;
      expect(isPassthrough(middleware(req('http://localhost/import', basic(USER, PASS))))).toBe(true);
    });

    it('tolerates surrounding whitespace', () => {
      process.env.IMPORT_ADMIN_USER = `  ${USER}  `;
      expect(isPassthrough(middleware(req('http://localhost/import', basic(USER, PASS))))).toBe(true);
    });

    it('treats a whitespace-only value as unset and fails closed in production', () => {
      setNodeEnv('production');
      process.env.IMPORT_ADMIN_USER = '   ';
      expect(middleware(req()).status).toBe(503);
    });
  });
});
