export const SITE_AUTH_EVENT = 'site-auth-change';

export function notifySiteAuthChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SITE_AUTH_EVENT));
}
