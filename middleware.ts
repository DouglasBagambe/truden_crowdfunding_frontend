import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const { pathname, search } = req.nextUrl;

  // Protect profile (private) while keeping all other routes public
  if (pathname.startsWith('/profile') && !token) {
    const loginUrl = new URL('/login', req.url);
    const nextPath = `${pathname}${search || ''}`;
    loginUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*'],
};
