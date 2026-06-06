import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware that extracts the request pathname and injects it as a
 * x-locale-pathname request header so server components can reliably
 * detect the current locale for the <html lang> attribute.
 *
 * x-pathname (set by Netlify as a response header) is not consistently
 * forwarded as a request header to the Next.js serverless function,
 * so middleware provides the canonical source of truth.
 */
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale-pathname', request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Match all public site routes. Skip builder, API, Next internals, and assets.
 */
export const config = {
  matcher: ['/((?!ycode|api|_next|a/|icon\\.svg|favicon\\.ico).*)'],
};
