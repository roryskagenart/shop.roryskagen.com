import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin gate for the catalog import surface.
 *
 * `/import` and `POST /api/import/fourthwall` were publicly reachable: anyone could load
 * the full catalog and trigger a live Fourthwall sync. Both are now behind HTTP Basic
 * auth. The browser caches the credentials for the session, so the page's own fetch to
 * the sync endpoint is authorised automatically and no token field is needed in the UI.
 *
 * Configure in Vercel (Production + Preview):
 *   IMPORT_ADMIN_USER
 *   IMPORT_ADMIN_PASSWORD
 *
 * If either is unset in production the route fails closed with 503 rather than silently
 * exposing the admin surface. In development an unset gate is allowed through.
 */
export const config = {
  matcher: ['/import', '/import/:path*', '/api/import/fourthwall']
};

/**
 * Local copy of lib/utils cleanEnv — kept inline so the Edge middleware bundle does not
 * pull in `next/navigation` via that module.
 */
function cleanEnv(value: string | undefined): string {
  if (!value) return '';
  let str = value.trim();
  const match = str.match(/^["']([^"']*)["']/);
  if (match) {
    str = match[1]!.trim();
  } else {
    const hashIdx = str.indexOf('#');
    if (hashIdx !== -1) {
      str = str.slice(0, hashIdx).trim();
    }
    if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
      str = str.slice(1, -1).trim();
    }
  }
  return str;
}

/** Constant-time string comparison — avoids leaking length/prefix via early exit. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function unauthorized(): NextResponse {
  return new NextResponse('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Rory Skagen Art Admin", charset="UTF-8"',
      'Cache-Control': 'no-store'
    }
  });
}

export function middleware(req: NextRequest) {
  const expectedUser = cleanEnv(process.env.IMPORT_ADMIN_USER);
  const expectedPass = cleanEnv(process.env.IMPORT_ADMIN_PASSWORD);

  if (!expectedUser || !expectedPass) {
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse(
        'Import admin gate is not configured. Set IMPORT_ADMIN_USER and IMPORT_ADMIN_PASSWORD in the deployment environment.',
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    console.warn('[Admin Gate] IMPORT_ADMIN_USER / IMPORT_ADMIN_PASSWORD unset — allowing through in development only.');
    return NextResponse.next();
  }

  const header = req.headers.get('authorization') || '';
  if (!header.startsWith('Basic ')) {
    return unauthorized();
  }

  let decoded: string;
  try {
    // `atob` returns a Latin-1 byte string, so a UTF-8 password ("pässwörd") would be mangled and
    // rejected — even though the challenge below advertises charset="UTF-8". Re-read the decoded
    // bytes as UTF-8. TextDecoder is available in both the Edge and Node runtimes.
    const bytes = Uint8Array.from(atob(header.slice('Basic '.length)), (char) => char.charCodeAt(0));
    decoded = new TextDecoder().decode(bytes);
  } catch {
    return unauthorized();
  }

  const separator = decoded.indexOf(':');
  if (separator === -1) {
    return unauthorized();
  }

  const user = decoded.slice(0, separator);
  const pass = decoded.slice(separator + 1);

  if (safeEqual(user, expectedUser) && safeEqual(pass, expectedPass)) {
    return NextResponse.next();
  }

  return unauthorized();
}
