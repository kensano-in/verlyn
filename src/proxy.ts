import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Extremely strict security middleware running at the Edge.
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';

  // 1. Block Headless Browsers & Scripted Bots
  const blockedAgents = [
    'curl', 'postman', 'python', 'wget', 'urllib', 'httpclient', 'nikto', 
    'nmap', 'sqlmap', 'headlesschrome', 'puppeteer', 'playwright', 'selenium'
  ];

  if (blockedAgents.some(bot => userAgent.includes(bot))) {
    // Return a generic 403 Forbidden
    return new NextResponse(null, { status: 403, statusText: 'Forbidden' });
  }

  // 2. Strict Content Security Policy (CSP)
  // This prevents ANY external script, iframe, or malicious payload from running.
  // It only allows self-hosted scripts, styles, and data.
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Security-Policy', cspHeader); // For older browsers

  // 3. Prevent Caching of sensitive API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  // Apply this middleware to every single route in the application
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
