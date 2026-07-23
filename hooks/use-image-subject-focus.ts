'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_FOCUS,
  loadImageSubjectFocus,
  type ImageSubjectFocus,
} from '@/lib/image-subject-crop';

export function useImageSubjectFocus(src: string, enabled = true, targetAspect = 3 / 4) {
  const [focus, setFocus] = useState<ImageSubjectFocus>(DEFAULT_FOCUS);

  useEffect(() => {
    if (!enabled || !src) {
      setFocus(DEFAULT_FOCUS);
      return;
    }

    let cancelled = false;
    setFocus(DEFAULT_FOCUS);

    void loadImageSubjectFocus(src, targetAspect).then((result) => {
      if (!cancelled) setFocus(result);
    });

    return () => {
      cancelled = true;
    };
  }, [src, enabled, targetAspect]);

  return focus;
}
