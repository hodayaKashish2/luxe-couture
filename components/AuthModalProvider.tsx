'use client';

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FormError from '@/components/FormError';
import { AUTH_MODAL_COPY, type AuthModalReason } from '@/lib/auth-modal-copy';
import {
  buildAuthModalUrl,
  hasAuthInUrl,
  parseAuthFromUrl,
  stripAuthParams,
  type AuthModalView,
} from '@/lib/auth-url';
import { validateLoginForm, validateRegisterForm } from '@/lib/form-validation';
import { notifySiteAuthChange } from '@/lib/site-auth-events';
import {
  clearAuthDismissed,
  isAuthDismissed,
  markAuthDismissed,
} from '@/lib/auth-dismiss';

const AUTH_INPUT_CLASS =
  'w-full p-2.5 bg-white border border-[#decfa8] rounded-xl text-sm text-[#2c261a] placeholder:text-[#9a7b4f] caret-[#8b6508] focus:outline-none focus:border-[#d4af37]';

export type AuthModalOptions = {
  reason?: AuthModalReason;
  next?: string;
  initialView?: AuthModalView;
  skipUrl?: boolean;
};

type AuthModalContextValue = {
  openAuthModal: (options?: AuthModalOptions) => void;
  closeAuthModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

const emptyRegisterForm = {
  username: '',
  password: '',
  display_name: '',
  phone: '',
  email: '',
};

function ModalShell({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border-2 border-[#d4af37] max-h-[90vh] overflow-y-auto"
        style={{ direction: 'rtl' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 bg-neutral-100 hover:bg-[#d4af37] text-[#b8860b] hover:text-white w-8 h-8 rounded-full flex items-center justify-center border shadow-sm font-bold transition-all"
          aria-label="סגירה"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

function AuthModalProviderInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<AuthModalView>('prompt');
  const [reason, setReason] = useState<AuthModalReason>('general');
  const [nextPath, setNextPath] = useState('/');

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const copy = AUTH_MODAL_COPY[reason];

  const resetForms = useCallback(() => {
    setLoginUsername('');
    setLoginPassword('');
    setRegisterForm(emptyRegisterForm);
    setError('');
    setLoading(false);
  }, []);

  const resetAuthModalState = useCallback(() => {
    setOpen(false);
    resetForms();
    setView('prompt');
    setReason('general');
    setNextPath('/');
  }, [resetForms]);

  const closeAuthModal = useCallback(() => {
    markAuthDismissed();
    if (hasAuthInUrl(searchParams)) {
      const cleaned = stripAuthParams(
        `${window.location.pathname}${window.location.search}`
      );
      router.replace(cleaned, { scroll: false });
    }
    resetAuthModalState();
  }, [router, searchParams, resetAuthModalState]);

  const finishAuth = useCallback(() => {
    clearAuthDismissed();
    notifySiteAuthChange();
    const target = stripAuthParams(nextPath);
    resetAuthModalState();
    router.replace(target);
  }, [nextPath, resetAuthModalState, router]);

  const openAuthModal = useCallback(
    (options?: AuthModalOptions) => {
      if (typeof window === 'undefined') return;

      clearAuthDismissed();

      const pathname = window.location.pathname;
      const search = window.location.search;
      const authReason = options?.reason || 'general';
      const resolvedNext =
        options?.next || stripAuthParams(`${pathname}${search}`);
      const initialView = options?.initialView || 'prompt';

      if (options?.skipUrl) {
        setOpen(true);
        setReason(authReason);
        setNextPath(resolvedNext);
        setView(initialView);
        return;
      }

      const url = buildAuthModalUrl(pathname, search, {
        reason: authReason,
        next: resolvedNext,
        view: initialView,
      });

      const current = new URLSearchParams(search);
      if (
        current.get('auth') === authReason &&
        current.get('authNext') === resolvedNext &&
        (current.get('authView') || 'prompt') === initialView
      ) {
        setOpen(true);
        setReason(authReason);
        setNextPath(resolvedNext);
        setView(initialView);
        return;
      }

      router.push(url, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    const parsed = parseAuthFromUrl(searchParams);
    if (!parsed) {
      if (open) resetAuthModalState();
      return;
    }

    if (isAuthDismissed()) {
      const cleaned = stripAuthParams(
        `${window.location.pathname}${window.location.search}`
      );
      if (cleaned !== `${window.location.pathname}${window.location.search}`) {
        router.replace(cleaned, { scroll: false });
      }
      resetAuthModalState();
      return;
    }

    setOpen(true);
    setReason(parsed.reason);
    setNextPath(parsed.next);
    setView(parsed.view);
  }, [searchParams, resetAuthModalState, router]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const validationError = validateLoginForm(loginUsername, loginPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה');

      sessionStorage.setItem('site_token', data.token);
      sessionStorage.setItem('site_user', JSON.stringify(data.user));
      finishAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const validationError = validateRegisterForm(registerForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה');

      sessionStorage.setItem('site_token', data.token);
      sessionStorage.setItem('site_user', JSON.stringify(data.user));
      finishAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoading(false);
    }
  }

  const value = useMemo(
    () => ({ openAuthModal, closeAuthModal }),
    [openAuthModal, closeAuthModal]
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}

      {open && view === 'prompt' && (
        <ModalShell onClose={closeAuthModal}>
          <div className="text-center mb-6 pt-2">
            <span className="text-[10px] tracking-[0.2em] text-[#b8860b] font-black block mb-1">
              {copy.eyebrow}
            </span>
            <h3 className="text-xl font-black text-neutral-950">{copy.title}</h3>
            <div className="w-12 h-px bg-[#d4af37] mx-auto mt-2" />
            <p className="text-sm text-[#5c5037] mt-4 leading-relaxed">{copy.body}</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setError('');
                setView('login');
              }}
              className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white rounded-xl font-black text-sm shadow-lg"
            >
              התחברות →
            </button>
            <button
              type="button"
              onClick={() => {
                setError('');
                setView('register');
              }}
              className="w-full py-3.5 bg-white border-2 border-[#d4af37] text-[#8b6508] rounded-xl font-black text-sm hover:bg-[#fffdf8] transition-colors"
            >
              הרשמה מהירה — חינם
            </button>
            <button
              type="button"
              onClick={closeAuthModal}
              className="w-full py-2 text-xs text-[#9a7b4f] hover:text-[#8b6508] transition-colors"
            >
              המשיכי לגלוש בלי חשבון
            </button>
          </div>
        </ModalShell>
      )}

      {open && view === 'login' && (
        <ModalShell onClose={closeAuthModal}>
          <div className="text-center mb-5 pt-2">
            <span className="text-[10px] tracking-[0.2em] text-[#b8860b] font-black block mb-1">
              ✦ התחברות ✦
            </span>
            <h3 className="text-xl font-black text-neutral-950">שמחים שחזרת</h3>
            <div className="w-12 h-px bg-[#d4af37] mx-auto mt-2" />
          </div>

          <form onSubmit={handleLogin} noValidate className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-black text-[#8b6508] mb-1">שם משתמש</label>
              <input
                type="text"
                required
                autoComplete="username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className={AUTH_INPUT_CLASS}
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-[#8b6508] mb-1">סיסמה</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className={AUTH_INPUT_CLASS}
                dir="ltr"
              />
            </div>

            {error && <FormError message={error} />}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white rounded-xl font-black text-sm shadow-lg disabled:opacity-60"
            >
              {loading ? 'מתחברת...' : 'כניסה →'}
            </button>

            <p className="text-center text-xs text-[#6e634c]">
              אין לך חשבון?{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setView('register');
                }}
                className="text-[#b8860b] font-bold underline"
              >
                הרשמה
              </button>
            </p>
            <button
              type="button"
              onClick={() => {
                setError('');
                setView('prompt');
              }}
              className="text-center text-xs text-[#9a7b4f] hover:text-[#8b6508]"
            >
              ← חזרה
            </button>
          </form>
        </ModalShell>
      )}

      {open && view === 'register' && (
        <ModalShell onClose={closeAuthModal}>
          <div className="text-center mb-5 pt-2">
            <span className="text-[10px] tracking-[0.2em] text-[#b8860b] font-black block mb-1">
              ✦ הרשמה ✦
            </span>
            <h3 className="text-xl font-black text-neutral-950">יצירת חשבון חדש</h3>
            <div className="w-12 h-px bg-[#d4af37] mx-auto mt-2" />
            <p className="text-[11px] text-[#6e634c] mt-2">הטלפון יקשר את השמלות וההזמנות שלך</p>
          </div>

          <form onSubmit={handleRegister} noValidate className="flex flex-col gap-2.5">
            <div>
              <input
                placeholder="שם משתמש *"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                className={AUTH_INPUT_CLASS}
                dir="ltr"
              />
              <p className="text-[10px] text-[#9a7b4f] mt-1">שם משתמש ייחודי</p>
            </div>
            <input
              type="password"
              placeholder="סיסמה (6+ תווים) *"
              value={registerForm.password}
              onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
              className={AUTH_INPUT_CLASS}
              dir="ltr"
            />
            <input
              placeholder="שם מלא *"
              value={registerForm.display_name}
              onChange={(e) => setRegisterForm({ ...registerForm, display_name: e.target.value })}
              className={AUTH_INPUT_CLASS}
            />
            <input
              type="tel"
              placeholder="טלפון (053...) *"
              value={registerForm.phone}
              onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
              className={AUTH_INPUT_CLASS}
              dir="ltr"
            />
            <input
              type="text"
              inputMode="email"
              autoComplete="email"
              placeholder="אימייל *"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              className={AUTH_INPUT_CLASS}
              dir="ltr"
              required
            />

            {error && <FormError message={error} />}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#2c261a] text-white rounded-xl font-bold text-sm disabled:opacity-60"
            >
              {loading ? 'נרשמת...' : 'יצירת חשבון →'}
            </button>

            <p className="text-center text-xs text-[#6e634c]">
              יש לך חשבון?{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setView('login');
                }}
                className="text-[#b8860b] font-bold underline"
              >
                התחברות
              </button>
            </p>
            <button
              type="button"
              onClick={() => {
                setError('');
                setView('prompt');
              }}
              className="text-center text-xs text-[#9a7b4f] hover:text-[#8b6508]"
            >
              ← חזרה
            </button>
          </form>
        </ModalShell>
      )}
    </AuthModalContext.Provider>
  );
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AuthModalProviderInner>{children}</AuthModalProviderInner>
    </Suspense>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider');
  return ctx;
}
