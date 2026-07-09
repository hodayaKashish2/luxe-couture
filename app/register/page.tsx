'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SITE_NAME } from '@/lib/site-config';
import FormError from '@/components/FormError';
import { validateRegisterForm } from '@/lib/form-validation';
import { notifySiteAuthChange } from '@/lib/site-auth-events';

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
    setError('');

    const validationError = validateRegisterForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
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
      notifySiteAuthChange();
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

        <form onSubmit={handleSubmit} noValidate className="bg-white/95 rounded-2xl border-2 border-[#e6c687] shadow-xl p-6 space-y-3">
          <div>
            <input placeholder="שם משתמש *" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full p-2.5 border-2 border-[#decfa8] rounded-xl text-sm focus:border-[#d4af37] focus:outline-none" dir="ltr" />
            <p className="text-[10px] text-[#9a7b4f] mt-1">שם משתמש ייחודי — אם תפוס תופיע הודעה</p>
          </div>
          <input type="password" placeholder="סיסמה (6+ תווים) *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full p-2.5 border-2 border-[#decfa8] rounded-xl text-sm focus:border-[#d4af37] focus:outline-none" dir="ltr" />
          <input placeholder="שם מלא *" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="w-full p-2.5 border-2 border-[#decfa8] rounded-xl text-sm focus:border-[#d4af37] focus:outline-none" />
          <input type="tel" placeholder="טלפון (053...) *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full p-2.5 border-2 border-[#decfa8] rounded-xl text-sm focus:border-[#d4af37] focus:outline-none" dir="ltr" />
          <input type="text" inputMode="email" autoComplete="email" placeholder="אימייל (חובה)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full p-2.5 border-2 border-[#decfa8] rounded-xl text-sm focus:border-[#d4af37] focus:outline-none" dir="ltr" required />

          {error && <FormError message={error} />}

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
