import type { StoredSiteUser } from '@/lib/session-user';

const TOKEN_KEY = 'site_token';
const USER_KEY = 'site_user';

export function restoreSiteSession() {
  if (typeof window === 'undefined') return;
  if (!sessionStorage.getItem(TOKEN_KEY)) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
  }
  if (!sessionStorage.getItem(USER_KEY)) {
    const user = localStorage.getItem(USER_KEY);
    if (user) sessionStorage.setItem(USER_KEY, user);
  }
}

export function getSiteToken(): string | null {
  if (typeof window === 'undefined') return null;
  restoreSiteSession();
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

export function persistSiteSession(token: string, user: StoredSiteUser) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_KEY, token);
  const serialized = JSON.stringify(user);
  sessionStorage.setItem(USER_KEY, serialized);
  localStorage.setItem(USER_KEY, serialized);
}

export function clearSiteSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(USER_KEY);
}

if (typeof window !== 'undefined') {
  restoreSiteSession();
}
