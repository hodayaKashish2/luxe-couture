'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Dress } from '@/lib/types';
import {
  LUXE_STORAGE_EVENT,
  isFavorite,
  isInCart,
  loadCart,
  loadFavorites,
  mergeFavoriteDetails,
  saveCart,
  saveFavorites,
  toSavedDress,
  type SavedDress,
} from '@/lib/luxe-storage';

type LuxeStorageContextValue = {
  cart: SavedDress[];
  favorites: SavedDress[];
  cartCount: number;
  favCount: number;
  toggleCart: (dress: Dress, e?: React.MouseEvent) => void;
  toggleFavorite: (dress: Dress, e?: React.MouseEvent) => void;
  removeFromCart: (id: string) => void;
  removeFromFavorites: (id: string) => void;
  isDressInCart: (id: string) => boolean;
  isDressFavorite: (id: string) => boolean;
  refresh: () => void;
};

const LuxeStorageContext = createContext<LuxeStorageContextValue | null>(null);

export function LuxeStorageProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<SavedDress[]>([]);
  const [favorites, setFavorites] = useState<SavedDress[]>([]);

  const refresh = useCallback(() => {
    setCart(loadCart());
    setFavorites(loadFavorites());
  }, []);

  useEffect(() => {
    refresh();

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'luxe_cart' || e.key === 'luxe_favs' || e.key === null) refresh();
    };
    const onCustom = () => refresh();

    window.addEventListener('storage', onStorage);
    window.addEventListener(LUXE_STORAGE_EVENT, onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(LUXE_STORAGE_EVENT, onCustom);
    };
  }, [refresh]);

  useEffect(() => {
    const needsDetails = favorites.some((f) => !f.images?.length || f.name === 'שמלה');
    if (!needsDetails) return;

    fetch('/api/dresses')
      .then((r) => (r.ok ? r.json() : []))
      .then((dresses: Dress[]) => {
        if (!Array.isArray(dresses) || dresses.length === 0) return;
        const merged = mergeFavoriteDetails(favorites, dresses);
        const changed = merged.some(
          (f, i) => f.images?.[0] !== favorites[i]?.images?.[0] || f.name !== favorites[i]?.name
        );
        if (changed) {
          saveFavorites(merged);
          setFavorites(merged);
        }
      })
      .catch(() => {});
  }, [favorites]);

  const toggleCart = useCallback((dress: Dress, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCart((prev) => {
      const saved = toSavedDress(dress);
      const next = isInCart(prev, saved.id)
        ? prev.filter((item) => item.id !== saved.id)
        : [...prev, saved];
      saveCart(next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((dress: Dress, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((prev) => {
      const saved = toSavedDress(dress);
      const next = isFavorite(prev, saved.id)
        ? prev.filter((item) => item.id !== saved.id)
        : [...prev, saved];
      saveFavorites(next);
      return next;
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveCart(next);
      return next;
    });
  }, []);

  const removeFromFavorites = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveFavorites(next);
      return next;
    });
  }, []);

  const value = useMemo<LuxeStorageContextValue>(
    () => ({
      cart,
      favorites,
      cartCount: cart.length,
      favCount: favorites.length,
      toggleCart,
      toggleFavorite,
      removeFromCart,
      removeFromFavorites,
      isDressInCart: (id) => isInCart(cart, id),
      isDressFavorite: (id) => isFavorite(favorites, id),
      refresh,
    }),
    [cart, favorites, toggleCart, toggleFavorite, removeFromCart, removeFromFavorites, refresh]
  );

  return <LuxeStorageContext.Provider value={value}>{children}</LuxeStorageContext.Provider>;
}

export function useLuxeStorage() {
  const ctx = useContext(LuxeStorageContext);
  if (!ctx) throw new Error('useLuxeStorage must be used within LuxeStorageProvider');
  return ctx;
}
