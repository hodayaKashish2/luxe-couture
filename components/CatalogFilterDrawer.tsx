'use client';

import { useEffect } from 'react';
import CatalogFilterPanel from '@/components/CatalogFilterPanel';
import type { SortOption } from '@/lib/types';

type CatalogFilterDrawerProps = {
  open: boolean;
  onClose: () => void;
  onClear: () => void;
  activeFilterCount: number;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCity: string;
  setSelectedCity: (value: string) => void;
  selectedSize: string;
  setSelectedSize: (value: string) => void;
  selectedEventType: string;
  setSelectedEventType: (value: string) => void;
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
  selectedColor: string;
  setSelectedColor: (value: string) => void;
  maxPrice: number;
  setMaxPrice: (value: number) => void;
  uniqueCities: string[];
  uniqueColors: string[];
  resultCount: number;
  isLoading: boolean;
};

export default function CatalogFilterDrawer({
  open,
  onClose,
  onClear,
  activeFilterCount,
  resultCount,
  isLoading,
  ...filterProps
}: CatalogFilterDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-40 bg-neutral-900/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-label="סגור סינון"
        tabIndex={open ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-filter-title"
        className={`fixed z-50 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out
          inset-y-0 right-0 w-[min(100vw,22rem)] sm:w-[min(92vw,26rem)] lg:w-[min(36vw,30rem)]
          lg:inset-y-auto lg:top-20 lg:bottom-6 lg:right-5 lg:max-h-[calc(100dvh-6.5rem)] lg:rounded-2xl lg:border lg:border-[#eadaaf]
          ${open ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
      >
        <div className="shrink-0 px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-[#f0e6cc] bg-gradient-to-b from-[#fffdf8] to-white lg:rounded-t-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.2em] text-[#b8860b] font-black mb-1">✦ סינון ✦</p>
              <h2 id="catalog-filter-title" className="font-black text-base text-[#3d2f24]">
                מצאי את השמלה המושלמת
              </h2>
              <p className="text-[11px] text-[#9a7b4f] mt-1">
                {isLoading ? 'טוענת...' : `${resultCount} שמלות מתאימות`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 w-9 h-9 rounded-full bg-neutral-100 text-[#8b6508] font-bold flex items-center justify-center hover:bg-[#f4ebd4] transition-colors"
              aria-label="סגור"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4">
          <CatalogFilterPanel {...filterProps} />
        </div>

        <div className="shrink-0 px-4 sm:px-5 py-4 border-t border-[#f0e6cc] bg-[#fffdf8] space-y-2 lg:rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white rounded-xl text-sm font-black shadow-md"
          >
            הצג {isLoading ? 'תוצאות' : `${resultCount} שמלות`}
          </button>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="w-full py-2.5 border border-[#decfa8] text-[#8b6508] rounded-xl text-xs font-bold bg-white hover:bg-[#faf8f3] transition-colors"
            >
              נקה סינון ({activeFilterCount})
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
