import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Generate a random nonce for this request using Web Crypto API
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const nonce = btoa(String.fromCharCode(...array));
  
  // Create the CSP header with the nonce
  const host = request.nextUrl.hostname;
  const isPreview = host.endsWith('.netlify.app');

  const cspHeader = (
    isPreview
      ? `
        default-src 'self';
        script-src 'self' 'nonce-${nonce}' 'unsafe-inline' https:;
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: blob:;
        font-src 'self' data:;
        connect-src 'self' https:;
        frame-src 'self' https:;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        upgrade-insecure-requests;
      `
      : `
        default-src 'self';
        script-src 'self' 'nonce-${nonce}' 'unsafe-inline' https:;
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: blob:;
        font-src 'self' data:;
        connect-src 'self' https:;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        upgrade-insecure-requests;
      `
  ).replace(/\s{2,}/g, ' ').trim();

  // Inject nonce into the request headers so Next.js can automatically
  // apply it to its internal scripts/styles during rendering.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  // Set the CSP header
  response.headers.set('Content-Security-Policy', cspHeader);
  
  // Also expose the nonce on the response for debugging/clients if needed
  response.headers.set('x-nonce', nonce);
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
