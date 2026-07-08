export type StoredSiteUser = {
  username?: string;
  displayName?: string;
  display_name?: string;
  phone?: string;
  email?: string;
};

export function getStoredSiteUser(): StoredSiteUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('site_user');
    if (!raw) return null;
    return JSON.parse(raw) as StoredSiteUser;
  } catch {
    return null;
  }
}

export function getStoredDisplayName(): string {
  const u = getStoredSiteUser();
  return u?.displayName || u?.display_name || '';
}
