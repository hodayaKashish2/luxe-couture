import { useEffect, type RefObject } from 'react';

export function useScrollToError(ref: RefObject<HTMLElement | null>, error: string) {
  useEffect(() => {
    if (!error) return;
    requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [error, ref]);
}
