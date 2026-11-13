import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/types/domain';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API, Next internals, static assets, and /admin
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/admin') ||
    pathname.includes('.')
  ) {
    // Prevent public caching of CRM routes
    if (pathname.startsWith('/admin')) {
      const res = NextResponse.next();
      res.headers.set('Cache-Control', 'no-store, private, max-age=0');
      return res;
    }
    return NextResponse.next();
  }

  const hasLocale = SUPPORTED_LOCALES.some(
    (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)
  );

  if (!hasLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
