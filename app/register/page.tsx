'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SITE_NAME } from '@/lib/site-config';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '',
    password: '',
    display_name: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'שגיאה');

      sessionStorage.setItem('site_token', data.token);
      sessionStorage.setItem('site_user', JSON.stringify(data.user));
      router.replace('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf8f0] via-[#f3ebd6] to-[#e8dcbd] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="font-[family-name:var(--font-luxury)] text-2xl text-[#3d2f24]">הרשמה ל-{SITE_NAME}</h1>
          <p className="text-xs text-[#6e634c] mt-2">הטלפון יקשר את השמלות והשריונות שלך</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/95 rounded-2xl border-2 border-[#e6c687] shadow-xl p-6 space-y-3">
          <input required placeholder="שם משתמש *" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full p-2.5 border rounded-xl text-sm" dir="ltr" />
          <input required type="password" placeholder="סיסמה (6+ תווים) *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full p-2.5 border rounded-xl text-sm" dir="ltr" />
          <input required placeholder="שם מלא *" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="w-full p-2.5 border rounded-xl text-sm" />
          <input required type="tel" placeholder="טלפון (053...) *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full p-2.5 border rounded-xl text-sm" dir="ltr" />
          <input type="email" placeholder="אימייל (לשריונות)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full p-2.5 border rounded-xl text-sm" dir="ltr" />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="w-full py-3 bg-[#2c261a] text-white rounded-xl font-bold text-sm">
            {loading ? 'נרשמת...' : 'יצירת חשבון'}
          </button>
          <p className="text-center text-xs">
            <Link href="/login" className="text-[#b8860b] underline">יש לי חשבון — התחברות</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
