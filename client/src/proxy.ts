import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy for admin routes (formerly middleware).
 *
 * Because auth tokens are stored in localStorage (not cookies), this proxy
 * cannot verify JWT validity. It provides URL-based access control as a
 * defense-in-depth layer alongside the client-side auth guard in admin/layout.tsx.
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

  // For all other /admin/* routes, check for an auth token cookie
  // (set by the client after login). If absent, redirect to login.
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