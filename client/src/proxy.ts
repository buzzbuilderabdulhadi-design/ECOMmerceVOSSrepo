import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy for admin routes (formerly middleware).
 *
 * Sessions are now HttpOnly cookies set by the API, which this proxy can read
 * on the server but client-side JavaScript cannot forge. The proxy still does
 * not verify JWT validity, so it is only a defense-in-depth redirect layer;
 * the real access boundary is `authenticate` + `authorizeAdmin` on the API
 * (plus the client-side guard in admin/layout.tsx).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login page, API routes, static assets, and Next.js internals
  const isLogin = pathname === '/admin/login';
  const isApi = pathname.startsWith('/api/');
  const isStatic = pathname.startsWith('/_next/') || pathname.includes('.');

  if (isLogin || isApi || isStatic) {
    return NextResponse.next();
  }

  // For all other /admin/* routes, check for the HttpOnly session cookie set
  // by the API on login. If absent, redirect to login.
  const hasToken = request.cookies.get('voss_access_token')?.value;

  if (!hasToken) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};