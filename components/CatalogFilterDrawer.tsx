'use client';

import { useEffect } from 'react';
import CatalogFilterPanel, { type CatalogFilterPanelProps } from '@/components/CatalogFilterPanel';

type CatalogFilterDrawerProps = CatalogFilterPanelProps & {
  open: boolean;
  onClose: () => void;
  onClear: () => void;
  activeFilterCount: number;
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

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed inset-0 z-40 bg-neutral-900/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="סגור סינון"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-filter-title"
        className="lg:hidden fixed z-50 flex flex-col bg-white shadow-2xl inset-y-0 right-0 w-[min(100vw,20rem)] sm:w-72 max-h-[100dvh]"
      >
        <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-[#f0e6cc] bg-[#fffdf8]">
          <h2 id="catalog-filter-title" className="text-sm font-black text-[#3d2f24]">
            סינון
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 text-[#8b6508] font-bold flex items-center justify-center"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-2">
          <CatalogFilterPanel {...filterProps} />
        </div>

        <div className="shrink-0 px-4 py-3 border-t border-[#f0e6cc] bg-[#fffdf8] space-y-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white rounded-xl text-xs font-black"
          >
            הצג {isLoading ? 'תוצאות' : `${resultCount} שמלות`}
          </button>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => {
                onClear();
              }}
              className="w-full py-2 text-[11px] font-bold text-[#b8860b]"
            >
              נקה סינון ({activeFilterCount})
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
