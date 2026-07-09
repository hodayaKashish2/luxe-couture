import type { AuthModalReason } from '@/lib/auth-modal-copy';

export const AUTH_QUERY = 'auth';
export const AUTH_NEXT_QUERY = 'authNext';
export const AUTH_VIEW_QUERY = 'authView';

const AUTH_REASONS = new Set<AuthModalReason>([
  'cart',
  'favorites',
  'account',
  'publish',
  'general',
]);

const AUTH_VIEWS = new Set(['prompt', 'login', 'register']);

export type AuthModalView = 'prompt' | 'login' | 'register';

export function stripAuthParams(pathWithQuery: string): string {
  const [path, query = ''] = pathWithQuery.split('?');
  if (!query) return path;

  const params = new URLSearchParams(query);
  params.delete(AUTH_QUERY);
  params.delete(AUTH_NEXT_QUERY);
  params.delete(AUTH_VIEW_QUERY);

  const nextQuery = params.toString();
  return nextQuery ? `${path}?${nextQuery}` : path;
}

export function buildAuthModalUrl(
  pathname: string,
  search: string,
  options: {
    reason: AuthModalReason;
    next?: string;
    view?: AuthModalView;
  }
): string {
  const params = new URLSearchParams(search);
  params.delete(AUTH_QUERY);
  params.delete(AUTH_NEXT_QUERY);
  params.delete(AUTH_VIEW_QUERY);

  params.set(AUTH_QUERY, options.reason);
  if (options.next) params.set(AUTH_NEXT_QUERY, options.next);
  if (options.view && options.view !== 'prompt') params.set(AUTH_VIEW_QUERY, options.view);

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function parseAuthFromUrl(searchParams: URLSearchParams): {
  reason: AuthModalReason;
  next: string;
  view: AuthModalView;
} | null {
  const auth = searchParams.get(AUTH_QUERY);
  if (!auth || !AUTH_REASONS.has(auth as AuthModalReason)) return null;

  const view = searchParams.get(AUTH_VIEW_QUERY) || 'prompt';
  const safeView = AUTH_VIEWS.has(view) ? (view as AuthModalView) : 'prompt';

  return {
    reason: auth as AuthModalReason,
    next: searchParams.get(AUTH_NEXT_QUERY) || '/',
    view: safeView,
  };
}

export function hasAuthInUrl(searchParams: URLSearchParams): boolean {
  return searchParams.has(AUTH_QUERY);
}
