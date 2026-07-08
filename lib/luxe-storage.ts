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

export function loadCart(): SavedDress[] {
  const raw = readJson<unknown[]>('luxe_cart', []);
  if (!Array.isArray(raw)) return [];
  return raw
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

export function loadFavorites(): SavedDress[] {
  const raw = readJson<unknown[]>('luxe_favs', []);
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

  return raw
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

export function saveCart(items: SavedDress[]) {
  writeJson('luxe_cart', items);
}

export function saveFavorites(items: SavedDress[]) {
  writeJson('luxe_favs', items);
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
