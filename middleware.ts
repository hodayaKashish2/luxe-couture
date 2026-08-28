import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const dressId = request.nextUrl.searchParams.get('dress');
  if (!dressId || request.nextUrl.pathname !== '/') return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/dress/${encodeURIComponent(dressId)}`;
  url.searchParams.delete('dress');
  url.searchParams.delete('text');
  return NextResponse.redirect(url);
}

export const config = {
  matcher: '/',
};
