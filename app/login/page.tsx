'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SITE_NAME } from '@/lib/site-config';
import FormError from '@/components/FormError';
import { validateLoginForm } from '@/lib/form-validation';
import { notifySiteAuthChange } from '@/lib/site-auth-events';
import { persistSiteSession } from '@/lib/site-session';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf7f5] via-[#f3e9ec] to-[#ead8dc] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.svg?v=8" alt="" className="mx-auto mb-4 h-20 w-20 drop-shadow-lg" />
          <h1 className="font-[family-name:var(--font-luxury)] text-3xl text-[#2c2426]">
            {SITE_NAME}
          </h1>
          <p className="text-sm text-[#6e5e62] mt-2">התחברי כדי לשמור מועדפים, לפרסם שמלה ולגשת לאזור האישי</p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white/95 rounded-2xl border-2 border-[#d4b4bb] shadow-xl p-6 sm:p-8 space-y-4"
        >
          <div>
            <label className="block text-xs font-black text-[#6b2340] mb-1.5">שם משתמש</label>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border-2 border-[#e3cfd3] rounded-xl text-sm text-[#2c261a] placeholder:text-[#7a5e64] caret-[#6b2340] focus:border-[#6b2340] focus:outline-none bg-white"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-[#6b2340] mb-1.5">סיסמה</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border-2 border-[#e3cfd3] rounded-xl text-sm text-[#2c261a] placeholder:text-[#7a5e64] caret-[#6b2340] focus:border-[#6b2340] focus:outline-none bg-white"
              dir="ltr"
            />
          </div>

          {error && <FormError message={error} />}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[#6b2340] to-[#4a152c] text-white rounded-xl font-black text-sm shadow-lg disabled:opacity-60"
          >
            {loading ? 'מתחברת...' : 'התחברות →'}
          </button>

          <p className="text-center text-xs text-[#6e5e62]">
            אין לך חשבון?{' '}
            <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-[#6b2340] font-bold underline">
              הרשמה
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#6b2340]">טוען...</div>}>
      <LoginForm />
    </Suspense>
  );
}
