'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SITE_NAME } from '@/lib/site-config';
import FormError from '@/components/FormError';
import { validateLoginForm } from '@/lib/form-validation';
import { notifySiteAuthChange } from '@/lib/site-auth-events';
import { persistSiteSession } from '@/lib/site-session';

const FIELD_CLASS =
  'w-full p-3 border-2 border-[#decfa8] rounded-xl text-sm text-[#2c261a] placeholder:text-[#9a7b4f] caret-[#8b6508] focus:border-[#d4af37] focus:outline-none bg-white';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';
  const resetToken = searchParams.get('reset') || '';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [identifier, setIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [info, setInfo] = useState('');
  const [resetDone, setResetDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const validationError = validateLoginForm(username, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה');

      persistSiteSession(data.token, data.user);
      notifySiteAuthChange();
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!identifier.trim()) {
      setError('הזיני שם משתמש או אימייל');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה');
      setInfo(data.message || 'שלחנו קישור לאיפוס אל המייל.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (newPassword.length < 6) {
      setError('סיסמה — לפחות 6 תווים');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('הסיסמאות לא תואמות');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה');
      setInfo(data.message || 'הסיסמה עודכנה.');
      setNewPassword('');
      setConfirmPassword('');
      setResetDone(true);
      router.replace('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf8f0] via-[#f3ebd6] to-[#e8dcbd] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="" className="w-16 h-16 mx-auto mb-4 drop-shadow-lg" />
          <h1 className="font-[family-name:var(--font-luxury)] text-3xl text-[#3d2f24]">
            {SITE_NAME}
          </h1>
          <p className="text-sm text-[#6e634c] mt-2">התחברי כדי לשמור מועדפים, לפרסם שמלה ולגשת לאזור האישי</p>
        </div>

        {resetToken && !resetDone ? (
          <form
            onSubmit={handleReset}
            noValidate
            className="bg-white/95 rounded-2xl border-2 border-[#e6c687] shadow-xl p-6 sm:p-8 space-y-4"
          >
            <h2 className="text-lg font-black text-[#3d2f24] text-center">סיסמה חדשה</h2>
            <p className="text-xs text-[#6e634c] text-center leading-relaxed">
              הקישור מהמייל תקף ל-20 דקות, ורק לחשבון שנשלח אליו.
            </p>
            <div>
              <label className="block text-xs font-black text-[#8b6508] mb-1.5">סיסמה חדשה</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={FIELD_CLASS}
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-[#8b6508] mb-1.5">אימות סיסמה</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={FIELD_CLASS}
                dir="ltr"
              />
            </div>
            {error && <FormError message={error} />}
            {info && <p className="text-xs font-bold text-[#8b6508] leading-relaxed">{info}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white rounded-xl font-black text-sm shadow-lg disabled:opacity-60"
            >
              {loading ? 'שומרת...' : 'שמירת סיסמה'}
            </button>
          </form>
        ) : mode === 'forgot' ? (
          <form
            onSubmit={handleForgot}
            noValidate
            className="bg-white/95 rounded-2xl border-2 border-[#e6c687] shadow-xl p-6 sm:p-8 space-y-4"
          >
            <h2 className="text-lg font-black text-[#3d2f24] text-center">שכחתי סיסמה</h2>
            <p className="text-xs text-[#6e634c] text-center leading-relaxed">
              הזיני שם משתמש או אימייל. אם למייל יש כמה חשבונות, הזיני את שם המשתמש של החשבון הנכון.
            </p>
            <div>
              <label className="block text-xs font-black text-[#8b6508] mb-1.5">שם משתמש או אימייל</label>
              <input
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={FIELD_CLASS}
                dir="ltr"
              />
            </div>
            {error && <FormError message={error} />}
            {info && <p className="text-xs font-bold text-[#8b6508] leading-relaxed">{info}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white rounded-xl font-black text-sm shadow-lg disabled:opacity-60"
            >
              {loading ? 'שולחת...' : 'שליחת קישור למייל'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setInfo('');
              }}
              className="w-full text-center text-xs text-[#9a7b4f]"
            >
              ← חזרה להתחברות
            </button>
          </form>
        ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white/95 rounded-2xl border-2 border-[#e6c687] shadow-xl p-6 sm:p-8 space-y-4"
        >
          <div>
            <label className="block text-xs font-black text-[#8b6508] mb-1.5">שם משתמש</label>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={FIELD_CLASS}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-[#8b6508] mb-1.5">סיסמה</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={FIELD_CLASS}
              dir="ltr"
            />
          </div>

          {error && <FormError message={error} />}
          {info && <p className="text-xs font-bold text-[#8b6508] leading-relaxed">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white rounded-xl font-black text-sm shadow-lg disabled:opacity-60"
          >
            {loading ? 'מתחברת...' : 'התחברות →'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setError('');
              setInfo('');
            }}
            className="w-full text-center text-xs font-bold text-[#b8860b] underline"
          >
            שכחתי סיסמה
          </button>

          <p className="text-center text-xs text-[#6e634c]">
            אין לך חשבון?{' '}
            <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-[#b8860b] font-bold underline">
              הרשמה
            </Link>
          </p>
        </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#8b6508]">טוען...</div>}>
      <LoginForm />
    </Suspense>
  );
}
