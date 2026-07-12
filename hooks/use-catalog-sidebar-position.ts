'use client';

import { useEffect, useState, type RefObject } from 'react';

export type SidebarPositionMode = 'static' | 'fixed' | 'bottom';

export type SidebarPosition = {
  mode: SidebarPositionMode;
  top?: number;
  right?: number;
  width?: number;
};

const DESKTOP_MIN = 1024;
const VIEWPORT_TOP_GAP = 8;

export function useCatalogSidebarPosition(
  anchorRef: RefObject<HTMLElement | null>,
  catalogRef: RefObject<HTMLElement | null>,
  sidebarRef: RefObject<HTMLElement | null>,
  collapsed: boolean
) {
  const [position, setPosition] = useState<SidebarPosition>({ mode: 'static' });

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const anchor = anchorRef.current;
      const catalog = catalogRef.current;
      const sidebar = sidebarRef.current;

      if (!anchor || !catalog || !sidebar || window.innerWidth < DESKTOP_MIN) {
        setPosition({ mode: 'static' });
        return;
      }

      const catalogRect = catalog.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();
      const sidebarHeight = sidebar.offsetHeight;
      const fixedTop = VIEWPORT_TOP_GAP;
      const width = anchorRect.width;

      if (catalogRect.top > fixedTop) {
        setPosition({ mode: 'static' });
        return;
      }

      if (catalogRect.bottom <= sidebarHeight + fixedTop + 16) {
        setPosition({ mode: 'bottom' });
        return;
      }

      setPosition({
        mode: 'fixed',
        top: fixedTop,
        right: Math.max(0, window.innerWidth - anchorRect.right),
        width,
      });
    };

    const onScrollOrResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);

    const observer = new ResizeObserver(onScrollOrResize);
    if (catalogRef.current) observer.observe(catalogRef.current);
    if (sidebarRef.current) observer.observe(sidebarRef.current);
    if (anchorRef.current) observer.observe(anchorRef.current);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      observer.disconnect();
    };
  }, [anchorRef, catalogRef, sidebarRef, collapsed]);

  return position;
}
