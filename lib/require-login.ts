import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import { getSiteToken, restoreSiteSession } from '@/lib/site-session';

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  restoreSiteSession();
  return Boolean(getSiteToken());
}

export function loginUrl(next?: string): string {
  const path =
    next ||
    (typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}`
      : '/');
  return `/login?next=${encodeURIComponent(path)}`;
}

export function redirectToLogin(router: AppRouterInstance, next?: string): void {
  router.push(loginUrl(next));
}
