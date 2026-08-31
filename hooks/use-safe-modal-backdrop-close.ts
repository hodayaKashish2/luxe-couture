'use client';

import { useRef, type MouseEventHandler } from 'react';

/**
 * סגירת מודאל בלחיצה על הרקע בלבד:
 * רק אם mousedown ו-click שניהם על הרקע (לא על תוכן החלון).
 * סימון טקst שיוצא מחוץ לחלון — לא סוגר.
 */
export function useSafeModalBackdropClose(onClose: () => void, enabled = true) {
  const pressStartedOnBackdrop = useRef(false);

  const onBackdropMouseDown: MouseEventHandler<HTMLDivElement> = (event) => {
    pressStartedOnBackdrop.current = event.target === event.currentTarget;
  };

  const onPanelMouseDown: MouseEventHandler<HTMLDivElement> = () => {
    pressStartedOnBackdrop.current = false;
  };

  const onBackdropClick: MouseEventHandler<HTMLDivElement> = (event) => {
    if (!enabled) return;

    const selectedText = typeof window !== 'undefined' ? window.getSelection()?.toString() : '';
    if (selectedText) {
      pressStartedOnBackdrop.current = false;
      return;
    }

    const endedOnBackdrop = event.target === event.currentTarget;
    if (endedOnBackdrop && pressStartedOnBackdrop.current) {
      onClose();
    }
    pressStartedOnBackdrop.current = false;
  };

  return { onBackdropMouseDown, onPanelMouseDown, onBackdropClick };
}
