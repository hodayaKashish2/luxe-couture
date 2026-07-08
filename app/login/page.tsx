'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SITE_NAME } from '@/lib/site-config';

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
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה');

      sessionStorage.setItem('site_token', data.token);
      sessionStorage.setItem('site_user', JSON.stringify(data.user));
      router.replace(next);
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
          <p className="text-sm text-[#6e634c] mt-2">התחברי כדי להיכנס לאתר</p>
        </div>

        <form
          onSubmit={handleSubmit}
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
              className="w-full p-3 border-2 border-[#decfa8] rounded-xl text-sm focus:border-[#d4af37] focus:outline-none"
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
              className="w-full p-3 border-2 border-[#decfa8] rounded-xl text-sm focus:border-[#d4af37] focus:outline-none"
              dir="ltr"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white rounded-xl font-black text-sm shadow-lg disabled:opacity-60"
          >
            {loading ? 'מתחברת...' : 'כניסה לאתר →'}
          </button>

          <p className="text-center text-xs text-[#6e634c]">
            אין לך חשבון?{' '}
            <Link href="/register" className="text-[#b8860b] font-bold underline">
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#8b6508]">טוען...</div>}>
      <LoginForm />
    </Suspense>
  );
}
