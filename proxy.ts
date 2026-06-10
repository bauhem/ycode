import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public API routes that skip authentication.
 */
const PUBLIC_API_PREFIXES = [
  '/ycode/api/setup/',    // Setup wizard — needed before any user exists
  '/ycode/api/supabase/', // Supabase config — needed for browser client init
  '/ycode/api/auth/',     // Auth callbacks and session checks
  '/ycode/api/v1/',       // Public API — has own API key auth
];

/**
 * Patterns for collection item endpoints that must be accessible on published pages
 * (load-more pagination, filter). Matched via regex since the collection ID is dynamic.
 */
const PUBLIC_COLLECTION_ITEM_SUFFIXES = ['/items/filter', '/items/load-more'];

const PUBLIC_API_EXACT = [
  '/ycode/api/revalidate', // Cache revalidation — has own secret token auth
  '/ycode/api/oauth/register', // RFC 7591 Dynamic Client Registration — anonymous
  '/ycode/api/oauth/token',    // OAuth token exchange — auth is via PKCE/refresh
];

/**
 * Derive the Supabase project URL and anon key from environment variables.
 * Returns null if env vars are not set (pre-setup or local dev without .env.local).
 *
 * Uses SUPABASE_URL when set (self-hosted instances), otherwise derives from
 * the project ref in the connection string (hosted Supabase).
 */
function getSupabaseEnvConfig(): { url: string; anonKey: string } | null {
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_ANON_KEY;
  const connectionUrl = process.env.SUPABASE_CONNECTION_URL;

  if (!anonKey || !connectionUrl) return null;

  if (process.env.SUPABASE_URL) {
    return {
      url: process.env.SUPABASE_URL.replace(/\/+$/, ''),
      anonKey,
    };
  }

  // Hosted Supabase: extract project ID from connection URL
  const match = connectionUrl.match(/\/\/postgres\.([a-z0-9]+):/);
  if (!match) return null;

  return {
    url: `https://${match[1]}.supabase.co`,
    anonKey,
  };
}

function isPublicApiRoute(pathname: string, method: string): boolean {
  // POST to form-submissions is public (website visitors submitting forms)
  if (pathname === '/ycode/api/form-submissions' && method === 'POST') {
    return true;
  }

  if (PUBLIC_API_EXACT.includes(pathname)) return true;

  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;

  // Collection item endpoints for published pages (POST only — filter, load-more)
  if (method === 'POST' && pathname.startsWith('/ycode/api/collections/') &&
      PUBLIC_COLLECTION_ITEM_SUFFIXES.some(suffix => pathname.endsWith(suffix))) {
    return true;
  }

  return false;
}

/**
 * Verify Supabase session for protected API routes.
 * Returns a 401 response if not authenticated, or null to continue.
 */
async function verifyApiAuth(request: NextRequest): Promise<NextResponse | null> {
  if (isPublicApiRoute(request.nextUrl.pathname, request.method)) {
    return null;
  }

  const config = getSupabaseEnvConfig();

  // If env vars aren't set (pre-setup or local dev without .env.local), let through
  if (!config) return null;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  // Authenticated — pass through with any refreshed cookies
  const authResponse = NextResponse.next({ request });
  response.cookies.getAll().forEach((cookie) => {
    authResponse.cookies.set(cookie.name, cookie.value);
  });

  return authResponse;
}

/**
 * Supported locale codes for browser-language auto-redirect.
 * The first entry is the default (fallback) locale.
 */
const SUPPORTED_LOCALES: string[] = ['fr', 'en'];
const DEFAULT_LOCALE = SUPPORTED_LOCALES[0];
const LOCALE_PREFIX_RE = /^\/(en|fr)(\/|$)/;

/**
 * Parse the Accept-Language header and return the best matching supported locale,
 * or null if the user's preference matches the default locale.
 *
 * Accept-Language format: "fr-FR,fr;q=0.9,en;q=0.8"
 * Quality defaults to 1.0 when omitted.
 */
function parsePreferredLocale(header: string | null): string | null {
  if (!header) return null;

  const entries: { code: string; q: number }[] = [];

  for (const part of header.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const [lang, qRaw] = trimmed.split(';');
    const code = lang.split('-')[0].toLowerCase();
    const q = qRaw ? parseFloat(qRaw.replace(/^q\s*=\s*/, '')) : 1;
    if (isNaN(q)) continue;
    entries.push({ code, q });
  }

  entries.sort((a, b) => {
    if (b.q !== a.q) return b.q - a.q;
    // Tie-break: prefer exact match over wildcard
    if (a.code === '*') return 1;
    if (b.code === '*') return -1;
    return 0;
  });

  const SUPPORTED = new Set(SUPPORTED_LOCALES);

  for (const { code } of entries) {
    if (code === '*') break; // Wildcard means "default", stop searching
    if (SUPPORTED.has(code)) return code;
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // MCP endpoints use their own token-based authentication — skip session auth.
  // Cloud overlay proxies MUST also exempt these paths to avoid login redirects.
  //   - `/ycode/mcp/<token>`: legacy URL-token endpoint (Cursor, Windsurf, etc.)
  //   - `/ycode/mcp`: OAuth Bearer-token endpoint (Claude.ai web, ChatGPT)
  if (pathname === '/ycode/mcp' || pathname.startsWith('/ycode/mcp/')) {
    const response = NextResponse.next();
    response.headers.set('x-pathname', pathname);
    return response;
  }

  // Debug escape hatch: skip auth on preview routes when explicitly enabled.
  const skipPreviewAuth = process.env.DISABLE_PREVIEW_AUTH === 'true'
    && pathname.startsWith('/ycode/preview');

  // Protect API and preview routes with auth
  if (!skipPreviewAuth && (pathname.startsWith('/ycode/api') || pathname.startsWith('/ycode/preview'))) {
    const authResponse = await verifyApiAuth(request);
    if (authResponse) {
      if (authResponse.status === 401) {
        if (pathname.startsWith('/ycode/preview')) {
          return NextResponse.redirect(new URL('/ycode', request.url));
        }
        return authResponse;
      }
      // Authenticated — pass through
      authResponse.headers.set('x-pathname', pathname);
      return authResponse;
    }
  }

  const isAssetProxyRoute = pathname.startsWith('/a/');
  const isStaticFile = /\.[a-zA-Z0-9]+$/.test(pathname);
  const isPublicPage = !pathname.startsWith('/ycode')
    && !pathname.startsWith('/_next')
    && !pathname.startsWith('/api')
    && !pathname.startsWith('/dynamic')
    && !isAssetProxyRoute
    && !isStaticFile;
  const hasPaginationParams = Array.from(request.nextUrl.searchParams.keys())
    .some((key) => key.startsWith('p_'));

  if (isPublicPage && hasPaginationParams) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = pathname === '/' ? '/dynamic' : `/dynamic${pathname}`;

    const rewriteResponse = NextResponse.rewrite(rewriteUrl);
    rewriteResponse.headers.set('x-pathname', pathname);
    return rewriteResponse;
  }

  // Auto-redirect to the user's preferred locale based on Accept-Language.
  // Skip if already on a locale-prefixed path or if the user has a saved preference.
  if (isPublicPage && !LOCALE_PREFIX_RE.test(pathname)) {
    const cookieLocale = request.cookies.get('ycode_locale')?.value;
    if (!cookieLocale) {
      const preferred = parsePreferredLocale(request.headers.get('Accept-Language'));
      if (preferred && preferred !== DEFAULT_LOCALE) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = pathname === '/' ? `/${preferred}` : `/${preferred}${pathname}`;
        return NextResponse.redirect(redirectUrl, { status: 302 });
      }
    }
  }

  // Create response
  const response = NextResponse.next({
    request: {
      headers: (() => {
        const headers = new Headers(request.headers);
        headers.set('x-pathname', pathname);
        return headers;
      })(),
    },
  });

  // Also set as response header for Netlify edge visibility
  response.headers.set('x-pathname', pathname);

  // Cache-Control for public pages is configured centrally via next.config.ts headers().

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
