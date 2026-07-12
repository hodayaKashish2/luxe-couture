'use client';

import { useRef, type RefObject } from 'react';
import CatalogFilterPanel, { type CatalogFilterPanelProps } from '@/components/CatalogFilterPanel';
import { useCatalogSidebarPosition, type SidebarPosition } from '@/hooks/use-catalog-sidebar-position';

type CatalogFilterSidebarProps = CatalogFilterPanelProps & {
  catalogRef: RefObject<HTMLElement | null>;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeFilterCount: number;
  onClear: () => void;
};

function panelStyle(position: SidebarPosition) {
  if (position.mode === 'fixed') {
    return {
      position: 'fixed' as const,
      top: position.top,
      right: position.right,
      width: position.width,
      zIndex: 25,
    };
  }
  if (position.mode === 'bottom') {
    return {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 25,
    };
  }
  return {
    position: 'relative' as const,
    zIndex: 20,
  };
}

export default function CatalogFilterSidebar({
  catalogRef,
  collapsed,
  onToggleCollapse,
  activeFilterCount,
  onClear,
  ...filterProps
}: CatalogFilterSidebarProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const position = useCatalogSidebarPosition(anchorRef, catalogRef, sidebarRef, collapsed);

  if (collapsed) {
    return (
      <div
        ref={anchorRef}
        className="hidden lg:block relative self-stretch w-11 shrink-0"
        aria-hidden={false}
      >
        <aside
          ref={sidebarRef}
          style={panelStyle(position)}
          className="w-11 flex flex-col"
        >
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full min-h-[9rem] flex flex-col items-center justify-center gap-2 py-4 bg-white border border-[#eadaaf] rounded-xl text-[#8b6508] hover:border-[#d4af37] hover:bg-[#fffdf8] transition-colors shadow-sm"
            aria-label="פתח סינון"
            title="פתח סינון"
          >
            <span className="text-base" aria-hidden>
              🔍
            </span>
            <span
              className="text-[10px] font-black tracking-wide"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              סינון
            </span>
            {activeFilterCount > 0 && (
              <span className="bg-[#d4af37] text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </aside>
      </div>
    );
  }

  return (
    <div ref={anchorRef} className="hidden lg:block relative self-stretch w-56 xl:w-60 shrink-0">
      <aside
        ref={sidebarRef}
        style={panelStyle(position)}
        className="w-full flex flex-col bg-white border border-[#eadaaf] rounded-xl shadow-sm overflow-hidden max-h-[calc(100dvh-1rem)]"
      >
        <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-2.5 border-b border-[#f0e6cc] bg-[#fffdf8]">
          <div className="min-w-0">
            <h2 className="text-sm font-black text-[#3d2f24]">סינון</h2>
            {activeFilterCount > 0 && (
              <p className="text-[10px] text-[#9a7b4f]">{activeFilterCount} פעילים</p>
            )}
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="shrink-0 w-7 h-7 rounded-lg bg-neutral-100 text-[#8b6508] font-bold flex items-center justify-center hover:bg-[#f4ebd4] transition-colors"
            aria-label="מזער סינון"
            title="מזער"
          >
            ‹
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3">
          <CatalogFilterPanel {...filterProps} showSort={false} compact />
        </div>

        {activeFilterCount > 0 && (
          <div className="shrink-0 px-3 py-2.5 border-t border-[#f0e6cc] bg-[#fffdf8]">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear();
              }}
              className="w-full py-2 text-[11px] font-bold text-[#b8860b] hover:bg-[#faf8f3] rounded-lg transition-colors"
            >
              נקה סינון
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
