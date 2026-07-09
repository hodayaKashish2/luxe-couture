'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  buildModalEntry,
  closeTopModalFromHistory,
  getModalStack,
  isTopModal,
  pushModal,
  subscribeModalStack,
  type ModalHistoryEntry,
} from '@/lib/modal-history';

type UseModalHistoryOptions = {
  key: string;
  isOpen: boolean;
  data?: Record<string, string>;
  onOpen?: (data?: Record<string, string>) => void;
  onClose: () => void;
};

export function useModalHistory({
  key,
  isOpen,
  data,
  onOpen,
  onClose,
}: UseModalHistoryOptions) {
  const entry = buildModalEntry(key, data);
  const isOpenRef = useRef(isOpen);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const syncingRef = useRef(false);

  isOpenRef.current = isOpen;
  onOpenRef.current = onOpen;
  onCloseRef.current = onClose;

  useEffect(() => {
    return subscribeModalStack((stack) => {
      if (syncingRef.current) return;

      const top = stack.at(-1);
      const shouldBeOpen = isTopModal(entry);

      if (shouldBeOpen) {
        if (!isOpenRef.current) {
          syncingRef.current = true;
          onOpenRef.current?.(top?.data);
          syncingRef.current = false;
        }
        return;
      }

      const stillInStack = stack.some(
        (item) =>
          item.key === entry.key &&
          JSON.stringify(item.data ?? {}) === JSON.stringify(entry.data ?? {})
      );

      if (isOpenRef.current && !stillInStack) {
        syncingRef.current = true;
        onCloseRef.current();
        syncingRef.current = false;
      }
    });
  }, [entry.key, JSON.stringify(entry.data ?? {})]);

  useEffect(() => {
    if (!isOpen || syncingRef.current) return;
    if (isTopModal(entry)) return;
    pushModal(entry);
  }, [isOpen, entry.key, JSON.stringify(entry.data ?? {})]);

  useEffect(() => {
    if (isOpen || syncingRef.current) return;

    const stack = getModalStack();
    const index = stack.findIndex(
      (item) =>
        item.key === entry.key &&
        JSON.stringify(item.data ?? {}) === JSON.stringify(entry.data ?? {})
    );
    if (index < 0 || index !== stack.length - 1) return;

    syncingRef.current = true;
    closeTopModalFromHistory();
    syncingRef.current = false;
  }, [isOpen, entry.key, JSON.stringify(entry.data ?? {})]);

  const close = useCallback(() => {
    if (syncingRef.current) return;

    if (isOpenRef.current && isTopModal(entry)) {
      syncingRef.current = true;
      onCloseRef.current();
      closeTopModalFromHistory();
      syncingRef.current = false;
      return;
    }

    onCloseRef.current();
  }, [entry.key, JSON.stringify(entry.data ?? {})]);

  return { close };
}

export function useIsModalStackTop(entry: ModalHistoryEntry): boolean {
  return isTopModal(entry);
}

export function getCurrentModalStack() {
  return getModalStack();
}
