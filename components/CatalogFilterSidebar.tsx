'use client';

import CatalogFilterPanel, { type CatalogFilterPanelProps } from '@/components/CatalogFilterPanel';

type CatalogFilterSidebarProps = CatalogFilterPanelProps & {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeFilterCount: number;
  onClear: () => void;
};

const WRAPPER_BASE = 'hidden lg:block shrink-0 self-stretch min-h-0';

const PANEL =
  'flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm sticky top-20 z-20 max-h-[calc(100dvh-6rem)]';

export default function CatalogFilterSidebar({
  collapsed,
  onToggleCollapse,
  activeFilterCount,
  onClear,
  ...filterProps
}: CatalogFilterSidebarProps) {
  if (collapsed) {
    return (
      <div className={`${WRAPPER_BASE} w-11`}>
        <aside className={`${PANEL} w-11 min-h-[calc(100dvh-2rem)]`}>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="h-full w-full flex flex-col items-center justify-center gap-3 py-6 bg-[#fffafb] text-[#6b2340] hover:bg-[#f3e9ec] transition-colors rounded-xl"
            aria-label="פתח סינון"
            title="פתח סינון"
          >
            <span className="text-lg" aria-hidden>
              ⌕
            </span>
            <span
              className="text-[11px] font-black tracking-wide"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              סינון
            </span>
            {activeFilterCount > 0 && (
              <span className="bg-[#6b2340] text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </aside>
      </div>
    );
  }

  return (
    <div className={`${WRAPPER_BASE} w-56 xl:w-60`}>
      <aside className={PANEL}>
        <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-2.5 border-b border-[#ead8dc] bg-[#fffafb] rounded-t-xl">
          <div className="min-w-0">
            <h2 className="text-sm font-black text-[#2c2426]">סינון</h2>
            {activeFilterCount > 0 && (
              <p className="text-[10px] text-[#7a5e64]">{activeFilterCount} פעילים</p>
            )}
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="shrink-0 w-7 h-7 rounded-lg bg-neutral-100 text-[#6b2340] font-bold flex items-center justify-center hover:bg-[#f3e9ec] transition-colors"
            aria-label="מזער סינון"
            title="מזער"
          >
            ‹
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pb-3">
          <CatalogFilterPanel {...filterProps} showSort={false} compact />
        </div>

        {activeFilterCount > 0 && (
          <div className="shrink-0 px-3 py-2.5 border-t border-[#ead8dc] bg-[#fffafb] rounded-b-xl">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear();
              }}
              className="w-full py-2 text-[11px] font-bold text-[#6b2340] hover:bg-[#faf7f5] rounded-lg transition-colors"
            >
              נקה סינון
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
