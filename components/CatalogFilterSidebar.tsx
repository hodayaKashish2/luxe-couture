'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import CatalogFilterPanel, { type CatalogFilterPanelProps } from '@/components/CatalogFilterPanel';

type CatalogFilterSidebarProps = CatalogFilterPanelProps & {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeFilterCount: number;
  onClear: () => void;
};

const STICKY_PANEL =
  'sticky top-3 z-20 w-full flex flex-col bg-white border border-[#eadaaf] rounded-xl shadow-sm self-start';

const COLLAPSED_PANEL =
  'sticky top-3 z-20 w-full flex flex-col bg-white border border-[#eadaaf] rounded-xl shadow-sm self-start min-h-[calc(100dvh-1.5rem)]';

export default function CatalogFilterSidebar({
  collapsed,
  onToggleCollapse,
  activeFilterCount,
  onClear,
  ...filterProps
}: CatalogFilterSidebarProps) {
  const asideRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [contentMaxHeight, setContentMaxHeight] = useState<number | null>(null);

  const updateOverflowState = useCallback(() => {
    const aside = asideRef.current;
    const inner = innerRef.current;
    if (!aside || !inner) return;

    const header = aside.querySelector<HTMLElement>('[data-filter-header]');
    const footer = aside.querySelector<HTMLElement>('[data-filter-footer]');
    const headerHeight = header?.offsetHeight ?? 0;
    const footerHeight = footer?.offsetHeight ?? 0;
    const viewportLimit = window.innerHeight - 12;
    const maxContentHeight = Math.max(160, viewportLimit - headerHeight - footerHeight);
    const needsScroll = inner.scrollHeight > maxContentHeight + 1;
    const nextMaxHeight = needsScroll ? maxContentHeight : null;

    setHasOverflow((prev) => (prev === needsScroll ? prev : needsScroll));
    setContentMaxHeight((prev) => (prev === nextMaxHeight ? prev : nextMaxHeight));
  }, []);

  useEffect(() => {
    if (collapsed) return;

    let frame = 0;
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => updateOverflowState());
    };

    scheduleUpdate();

    const inner = innerRef.current;
    if (!inner) return;

    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(inner);

    const onWindowResize = () => scheduleUpdate();
    window.addEventListener('resize', onWindowResize);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', onWindowResize);
    };
  }, [collapsed, updateOverflowState]);

  useEffect(() => {
    if (collapsed || !hasOverflow) return;

    const aside = asideRef.current;
    const content = contentRef.current;
    if (!aside || !content) return;

    const onWheel = (event: WheelEvent) => {
      if (!aside.contains(event.target as Node)) return;

      let node = event.target instanceof HTMLElement ? event.target : null;
      while (node && node !== content) {
        const style = window.getComputedStyle(node);
        const canScroll = node.scrollHeight > node.clientHeight + 1;
        if (
          canScroll &&
          (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflowY === 'overlay')
        ) {
          const { scrollTop, scrollHeight, clientHeight } = node;
          const canScrollUp = scrollTop > 0;
          const canScrollDown = scrollTop + clientHeight < scrollHeight - 1;
          const scrollingDown = event.deltaY > 0;
          const scrollingUp = event.deltaY < 0;

          if ((scrollingDown && canScrollDown) || (scrollingUp && canScrollUp)) {
            event.preventDefault();
            node.scrollTop += event.deltaY;
            return;
          }

          event.preventDefault();
          return;
        }
        node = node.parentElement;
      }

      const { scrollTop, scrollHeight, clientHeight } = content;
      const canScrollUp = scrollTop > 0;
      const canScrollDown = scrollTop + clientHeight < scrollHeight - 1;
      const scrollingDown = event.deltaY > 0;
      const scrollingUp = event.deltaY < 0;

      if ((scrollingDown && canScrollDown) || (scrollingUp && canScrollUp)) {
        event.preventDefault();
        content.scrollTop += event.deltaY;
        return;
      }

      event.preventDefault();
    };

    aside.addEventListener('wheel', onWheel, { passive: false });
    return () => aside.removeEventListener('wheel', onWheel);
  }, [collapsed, hasOverflow]);

  if (collapsed) {
    return (
      <div className="hidden lg:block w-11 shrink-0">
        <aside className={COLLAPSED_PANEL}>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="h-full w-full flex flex-col items-center justify-center gap-3 py-6 bg-[#fffdf8] text-[#8b6508] hover:bg-[#f4ebd4] transition-colors"
            aria-label="פתח סינון"
            title="פתח סינון"
          >
            <span className="text-lg" aria-hidden>
              🔍
            </span>
            <span
              className="text-[11px] font-black tracking-wide"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              סינון
            </span>
            {activeFilterCount > 0 && (
              <span className="bg-[#d4af37] text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </aside>
      </div>
    );
  }

  return (
    <div className="hidden lg:block w-56 xl:w-60 shrink-0">
      <aside ref={asideRef} className={STICKY_PANEL}>
        <div
          data-filter-header
          className="shrink-0 flex items-center justify-between gap-2 px-3 py-2.5 border-b border-[#f0e6cc] bg-[#fffdf8]"
        >
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

        <div
          ref={contentRef}
          className={hasOverflow ? 'overflow-y-auto overscroll-contain px-3 pb-3' : 'px-3 pb-3'}
          style={contentMaxHeight ? { maxHeight: contentMaxHeight } : undefined}
        >
          <div ref={innerRef}>
            <CatalogFilterPanel {...filterProps} showSort={false} compact />
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div
            data-filter-footer
            className="shrink-0 px-3 py-2.5 border-t border-[#f0e6cc] bg-[#fffdf8]"
          >
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
