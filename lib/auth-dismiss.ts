export const AUTH_DISMISSED_KEY = 'auth_modal_dismissed';

export function markAuthDismissed() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(AUTH_DISMISSED_KEY, '1');
}

export function clearAuthDismissed() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(AUTH_DISMISSED_KEY);
}

export function isAuthDismissed() {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(AUTH_DISMISSED_KEY) === '1';
}
