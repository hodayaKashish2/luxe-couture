'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Dress } from '@/lib/types';
import { invalidateDressesCatalog, preloadDressesCatalog } from '@/lib/dress-api';
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
import { SITE_AUTH_EVENT } from '@/lib/site-auth-events';
import { isLoggedIn } from '@/lib/require-login';
import { useAuthModal } from '@/components/AuthModalProvider';

type LuxeStorageContextValue = {
  cart: SavedDress[];
  favorites: SavedDress[];
  cartCount: number;
  favCount: number;
  cartPruneNotice: string[];
  favoritesPruneNotice: string[];
  dismissCartPruneNotice: () => void;
  dismissFavoritesPruneNotice: () => void;
  toggleCart: (dress: Dress, e?: React.MouseEvent) => void;
  toggleFavorite: (dress: Dress, e?: React.MouseEvent) => void;
  removeFromCart: (id: string) => void;
  removeFromFavorites: (id: string) => void;
  isDressInCart: (id: string) => boolean;
  isDressFavorite: (id: string) => boolean;
  refresh: () => void;
  reconcileWithCatalog: () => Promise<void>;
};

const LuxeStorageContext = createContext<LuxeStorageContextValue | null>(null);

function namesFromRemoved(items: SavedDress[]) {
  return items.map((item) => item.name || 'שמלה');
}

export function LuxeStorageProvider({ children }: { children: ReactNode }) {
  const { openAuthModal } = useAuthModal();
  const [cart, setCart] = useState<SavedDress[]>([]);
  const [favorites, setFavorites] = useState<SavedDress[]>([]);
  const [cartPruneNotice, setCartPruneNotice] = useState<string[]>([]);
  const [favoritesPruneNotice, setFavoritesPruneNotice] = useState<string[]>([]);
  const syncingRef = useRef(false);

  const refresh = useCallback(() => {
    setCart(loadCart());
    setFavorites(loadFavorites());
  }, []);

  const reconcileWithCatalog = useCallback(async () => {
    if (typeof window === 'undefined' || syncingRef.current) return;
    syncingRef.current = true;

    try {
      invalidateDressesCatalog();
      const dresses = await preloadDressesCatalog();
      if (!Array.isArray(dresses)) return;

      const availableIds = new Set(dresses.map((dress) => String(dress.id)));

      setCart((prev) => {
        const removed = prev.filter((item) => !availableIds.has(item.id));
        const next = prev.filter((item) => availableIds.has(item.id));
        if (!removed.length) return prev;
        saveCart(next);
        setCartPruneNotice(namesFromRemoved(removed));
        return next;
      });

      setFavorites((prev) => {
        const removed = prev.filter((item) => !availableIds.has(item.id));
        let next = prev.filter((item) => availableIds.has(item.id));
        next = mergeFavoriteDetails(next, dresses);
        const detailsChanged = next.some(
          (item, index) =>
            item.images?.[0] !== prev[index]?.images?.[0] || item.name !== prev[index]?.name
        );
        if (!removed.length && !detailsChanged) return prev;
        saveFavorites(next);
        if (removed.length) {
          setFavoritesPruneNotice(namesFromRemoved(removed));
        }
        return next;
      });
    } catch {
      // ignore sync errors — cart stays as-is until next attempt
    } finally {
      syncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();

    const onStorage = (e: StorageEvent) => {
      if (
        e.key === null ||
        (e.key && (e.key.startsWith('luxe_cart') || e.key.startsWith('luxe_favs')))
      ) {
        refresh();
      }
    };
    const onCustom = () => refresh();
    const onAuth = () => {
      refresh();
      if (isLoggedIn()) void reconcileWithCatalog();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(LUXE_STORAGE_EVENT, onCustom);
    window.addEventListener(SITE_AUTH_EVENT, onAuth);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(LUXE_STORAGE_EVENT, onCustom);
      window.removeEventListener(SITE_AUTH_EVENT, onAuth);
    };
  }, [refresh, reconcileWithCatalog]);

  useEffect(() => {
    if (!isLoggedIn()) return;
    void reconcileWithCatalog();
  }, [reconcileWithCatalog]);

  const toggleCart = useCallback((dress: Dress, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isLoggedIn()) {
      openAuthModal({ reason: 'cart' });
      return;
    }
    setCart((prev) => {
      const saved = toSavedDress(dress);
      const next = isInCart(prev, saved.id)
        ? prev.filter((item) => item.id !== saved.id)
        : [...prev, saved];
      saveCart(next);
      return next;
    });
  }, [openAuthModal]);

  const toggleFavorite = useCallback((dress: Dress, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isLoggedIn()) {
      openAuthModal({ reason: 'favorites' });
      return;
    }
    setFavorites((prev) => {
      const saved = toSavedDress(dress);
      const next = isFavorite(prev, saved.id)
        ? prev.filter((item) => item.id !== saved.id)
        : [...prev, saved];
      saveFavorites(next);
      return next;
    });
  }, [openAuthModal]);

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

  const dismissCartPruneNotice = useCallback(() => setCartPruneNotice([]), []);
  const dismissFavoritesPruneNotice = useCallback(() => setFavoritesPruneNotice([]), []);

  const value = useMemo<LuxeStorageContextValue>(
    () => ({
      cart,
      favorites,
      cartCount: cart.length,
      favCount: favorites.length,
      cartPruneNotice,
      favoritesPruneNotice,
      dismissCartPruneNotice,
      dismissFavoritesPruneNotice,
      toggleCart,
      toggleFavorite,
      removeFromCart,
      removeFromFavorites,
      isDressInCart: (id) => isInCart(cart, id),
      isDressFavorite: (id) => isFavorite(favorites, id),
      refresh,
      reconcileWithCatalog,
    }),
    [
      cart,
      favorites,
      cartPruneNotice,
      favoritesPruneNotice,
      dismissCartPruneNotice,
      dismissFavoritesPruneNotice,
      toggleCart,
      toggleFavorite,
      removeFromCart,
      removeFromFavorites,
      refresh,
      reconcileWithCatalog,
    ]
  );

  return <LuxeStorageContext.Provider value={value}>{children}</LuxeStorageContext.Provider>;
}

export function useLuxeStorage() {
  const ctx = useContext(LuxeStorageContext);
  if (!ctx) throw new Error('useLuxeStorage must be used within LuxeStorageProvider');
  return ctx;
}
