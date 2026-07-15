export type ModalHistoryEntry = {
  key: string;
  data?: Record<string, string>;
};

type StackListener = (stack: ModalHistoryEntry[]) => void;

let listeners = new Set<StackListener>();
let skipNextPop = false;
let initialized = false;

function entriesMatch(a?: ModalHistoryEntry, b?: ModalHistoryEntry): boolean {
  if (!a || !b) return false;
  if (a.key !== b.key) return false;
  return JSON.stringify(a.data ?? {}) === JSON.stringify(b.data ?? {});
}

function notify() {
  const stack = getModalStack();
  listeners.forEach((listener) => listener(stack));
}

export function getModalStack(): ModalHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  const stack = window.history.state?.modalStack;
  return Array.isArray(stack) ? stack : [];
}

export function initModalHistory() {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  window.addEventListener('popstate', () => {
    if (skipNextPop) {
      skipNextPop = false;
      notify();
      return;
    }
    notify();
  });
}

export function subscribeModalStack(listener: StackListener) {
  initModalHistory();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function pushModal(entry: ModalHistoryEntry) {
  if (typeof window === 'undefined') return;
  initModalHistory();

  const stack = getModalStack();
  const top = stack.at(-1);
  if (entriesMatch(top, entry)) return;

  const next = [...stack, entry];
  window.history.pushState({ modalStack: next }, '');
  notify();
}

export function popModalStackInPlace() {
  if (typeof window === 'undefined') return false;
  const stack = getModalStack();
  if (stack.length === 0) return false;

  const next = stack.slice(0, -1);
  window.history.replaceState({ modalStack: next }, '', window.location.href);
  notify();
  return true;
}

export function closeTopModalFromHistory() {
  if (typeof window === 'undefined') return false;
  const stack = getModalStack();
  if (stack.length === 0) return false;

  skipNextPop = true;
  window.history.back();
  notify();
  return true;
}

export function isTopModal(entry: ModalHistoryEntry): boolean {
  const top = getModalStack().at(-1);
  return entriesMatch(top, entry);
}

export function buildModalEntry(key: string, data?: Record<string, string>): ModalHistoryEntry {
  return data ? { key, data } : { key };
}
