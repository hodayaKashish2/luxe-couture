import type { Dress } from '@/lib/types';

export type SavedDress = {
  id: string;
  name: string;
  price: number;
  size: string;
  city: string;
  images: string[];
};

export const LUXE_STORAGE_EVENT = 'luxe-storage-change';

const CART_BASE = 'luxe_cart';
const FAVS_BASE = 'luxe_favs';

export function toSavedDress(dress: Dress): SavedDress {
  return {
    id: String(dress.id),
    name: dress.name,
    price: Number(dress.price),
    size: dress.size,
    city: dress.city || '',
    images: Array.isArray(dress.images) ? dress.images : [],
  };
}

function getStorageUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('site_user');
    if (!raw) return null;
    const user = JSON.parse(raw) as { userId?: string };
    return user.userId ? String(user.userId) : null;
  } catch {
    return null;
  }
}

function storageKey(base: string) {
  const userId = getStorageUserId();
  return userId ? `${base}_u_${userId}` : `${base}_guest`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(LUXE_STORAGE_EVENT));
}

function normalizeSaved(items: unknown[]): SavedDress[] {
  return items
    .filter((item): item is SavedDress => !!item && typeof item === 'object' && 'id' in item)
    .map((item) => ({
      id: String(item.id),
      name: item.name || 'שמלה',
      price: Number(item.price) || 0,
      size: item.size || '',
      city: item.city || '',
      images: Array.isArray(item.images) ? item.images : [],
    }));
}

export function loadCart(): SavedDress[] {
  const raw = readJson<unknown[]>(storageKey(CART_BASE), []);
  if (!Array.isArray(raw)) return [];
  return normalizeSaved(raw);
}

export function loadFavorites(): SavedDress[] {
  const raw = readJson<unknown[]>(storageKey(FAVS_BASE), []);
  if (!Array.isArray(raw) || raw.length === 0) return [];

  if (typeof raw[0] === 'string') {
    return (raw as string[]).map((id) => ({
      id: String(id),
      name: 'שמלה',
      price: 0,
      size: '',
      city: '',
      images: [],
    }));
  }

  return normalizeSaved(raw);
}

export function saveCart(items: SavedDress[]) {
  writeJson(storageKey(CART_BASE), items);
}

export function saveFavorites(items: SavedDress[]) {
  writeJson(storageKey(FAVS_BASE), items);
}

/** מוחק סל ומועדפים — כל המשתמשות (לאחר איפוס אתר או התנתקות מלאה) */
export function clearAllLuxeStorage() {
  if (typeof window === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith(CART_BASE) || key.startsWith(FAVS_BASE))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new CustomEvent(LUXE_STORAGE_EVENT));
}

export function favoriteIds(favorites: SavedDress[]): string[] {
  return favorites.map((f) => f.id);
}

export function isFavorite(favorites: SavedDress[], id: string) {
  return favorites.some((f) => f.id === id);
}

export function isInCart(cart: SavedDress[], id: string) {
  return cart.some((item) => item.id === id);
}

export function mergeFavoriteDetails(favorites: SavedDress[], dresses: Dress[]): SavedDress[] {
  const byId = new Map(dresses.map((d) => [String(d.id), toSavedDress(d)]));
  return favorites.map((fav) => byId.get(fav.id) || fav);
}
