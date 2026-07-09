import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(sessionStorage.getItem('site_token'));
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
