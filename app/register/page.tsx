'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SITE_NAME } from '@/lib/site-config';
import FormError from '@/components/FormError';
import MarketingEmailOptInCheckbox from '@/components/MarketingEmailOptInCheckbox';
import { validateRegisterForm } from '@/lib/form-validation';
import { notifySiteAuthChange } from '@/lib/site-auth-events';
import { persistSiteSession } from '@/lib/site-session';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/account';

  const [form, setForm] = useState({
    username: '',
    password: '',
    display_name: '',
    phone: '',
    email: '',
    marketing_emails_opt_in: false,
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
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#2c2426]">הרשמה ל-{SITE_NAME}</h1>
          <p className="text-xs text-[#6e5e62] mt-2">הטלפון יקשר את השמלות וההזמנות שלך</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-white/95 rounded-2xl border-2 border-[#d4b4bb] shadow-xl p-6 space-y-3">
          <div>
            <input placeholder="שם משתמש *" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full p-2.5 border-2 border-[#e3cfd3] rounded-xl text-sm text-[#2c261a] placeholder:text-[#7a5e64] bg-white focus:border-[#6b2340] focus:outline-none" dir="ltr" />
            <p className="text-[10px] text-[#7a5e64] mt-1">שם משתמש ייחודי — אם תפוס תופיע הודעה</p>
          </div>
          <input type="password" placeholder="סיסמה (6+ תווים) *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full p-2.5 border-2 border-[#e3cfd3] rounded-xl text-sm text-[#2c261a] placeholder:text-[#7a5e64] bg-white focus:border-[#6b2340] focus:outline-none" dir="ltr" />
          <input placeholder="שם מלא *" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="w-full p-2.5 border-2 border-[#e3cfd3] rounded-xl text-sm text-[#2c261a] placeholder:text-[#7a5e64] bg-white focus:border-[#6b2340] focus:outline-none" />
          <input type="tel" placeholder="טלפון (0501234567) *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full p-2.5 border-2 border-[#e3cfd3] rounded-xl text-sm text-[#2c261a] placeholder:text-[#7a5e64] bg-white focus:border-[#6b2340] focus:outline-none" dir="ltr" />
          <input type="text" inputMode="email" autoComplete="email" placeholder="אימייל (חובה)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full p-2.5 border-2 border-[#e3cfd3] rounded-xl text-sm text-[#2c261a] placeholder:text-[#7a5e64] bg-white focus:border-[#6b2340] focus:outline-none" dir="ltr" required />

          <MarketingEmailOptInCheckbox
            checked={form.marketing_emails_opt_in}
            onChange={(marketing_emails_opt_in) => setForm({ ...form, marketing_emails_opt_in })}
            compact
          />

          {error && <FormError message={error} />}

          <button type="submit" disabled={loading} className="w-full py-3 bg-[#2c261a] text-white rounded-xl font-bold text-sm">
            {loading ? 'נרשמת...' : 'יצירת חשבון'}
          </button>
          <p className="text-center text-xs">
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-[#6b2340] underline">יש לי חשבון — התחברות</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#6b2340]">טוען...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
