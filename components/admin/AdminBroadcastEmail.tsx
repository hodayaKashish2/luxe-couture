'use client';

import { useCallback, useEffect, useState } from 'react';
import FormError from '@/components/FormError';
import type { BroadcastAudience } from '@/lib/broadcast-email';

type Props = {
  token: string;
};

type BroadcastStats = {
  allCount: number;
  optInCount: number;
};

type BroadcastFormState = {
  subject: string;
  body: string;
};

const EMPTY_FORM: BroadcastFormState = { subject: '', body: '' };

function BroadcastPanel({
  title,
  description,
  count,
  audience,
  token,
  warning,
}: {
  title: string;
  description: string;
  count: number;
  audience: BroadcastAudience;
  token: string;
  warning?: string;
}) {
  const [form, setForm] = useState<BroadcastFormState>(EMPTY_FORM);
  const [busy, setBusy] = useState<'test' | 'send' | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [resultMsg, setResultMsg] = useState('');

  async function postBroadcast(payload: Record<string, unknown>) {
    const response = await fetch('/api/admin/broadcast-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'שגיאה');
    return data;
  }

  async function handleTest() {
    setError('');
    setResultMsg('');
    setBusy('test');
    try {
      const data = await postBroadcast({
        action: 'test',
        audience,
        subject: form.subject,
        body: form.body,
      });
      setResultMsg(`נשלח מייל בדיקה ל-${data.sentTo}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setBusy(null);
    }
  }

  async function handleSend() {
    setError('');
    setResultMsg('');
    setProgress(null);

    const confirmText =
      audience === 'all'
        ? `לשלוח מייל תפעולי ל-${count} משתמשות רשומות?\n\n(כולל מי שלא אישרה עדכונים — רק להודעות חשובות)`
        : `לשלוח ל-${count} משתמשות שאישרו לקבל דברי דואר מהאתר?`;

    if (!window.confirm(confirmText)) return;

    setBusy('send');
    let offset = 0;
    let totalSent = 0;
    let totalFailed = 0;
    let total = count;

    try {
      while (true) {
        const data = await postBroadcast({
          action: 'send',
          audience,
          subject: form.subject,
          body: form.body,
          offset,
        });

        totalSent += data.sent || 0;
        totalFailed += data.failed || 0;
        total = data.total || total;
        setProgress({ sent: totalSent, failed: totalFailed, total });

        if (data.done) break;
        offset = data.nextOffset || offset + (data.processed || 0);
      }

      setResultMsg(`סיום: נשלחו ${totalSent}${totalFailed ? `, נכשלו ${totalFailed}` : ''} מתוך ${total}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
      if (totalSent > 0) {
        setResultMsg(`נשלחו ${totalSent} לפני השגיאה${totalFailed ? ` (${totalFailed} נכשלו)` : ''}`);
      }
    } finally {
      setBusy(null);
      setProgress(null);
    }
  }

  const disabled = busy !== null || count === 0;

  return (
    <section className="bg-white border border-[#eadaaf] rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="font-black text-[#3d2f24] text-lg">{title}</h3>
        <p className="text-xs text-[#6e634c] mt-1 leading-relaxed">{description}</p>
        <p className="text-sm font-bold text-[#8b6508] mt-2">נמענות ברשימה: {count}</p>
        {warning && (
          <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2 leading-relaxed">
            {warning}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-[#8b6508] mb-1">נושא המייל</label>
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="למשל: שמלות חדשות השבוע בקטלוג"
            className="w-full p-2.5 border border-[#decfa8] rounded-xl text-sm bg-white"
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#8b6508] mb-1">תוכן המייל</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="כתבי כאן את ההודעה — שורות רגילות, בלי HTML"
            rows={6}
            className="w-full p-2.5 border border-[#decfa8] rounded-xl text-sm bg-white resize-y min-h-[120px]"
            disabled={disabled}
          />
        </div>
      </div>

      {error && <FormError message={error} />}
      {progress && (
        <p className="text-xs font-bold text-[#8b6508]">
          שולח… {progress.sent + progress.failed} / {progress.total}
        </p>
      )}
      {resultMsg && <p className="text-xs text-[#2c261a] bg-[#f4ebd4] border border-[#decfa8] rounded-xl px-3 py-2">{resultMsg}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleTest}
          disabled={disabled || !form.subject.trim() || !form.body.trim()}
          className="px-4 py-2.5 rounded-xl border-2 border-[#decfa8] bg-white text-xs font-bold text-[#8b6508] disabled:opacity-50"
        >
          {busy === 'test' ? 'שולחת בדיקה…' : 'שלחי לעצמך לבדיקה'}
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !form.subject.trim() || !form.body.trim()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2c261a] to-[#4a3f2b] text-white text-xs font-black disabled:opacity-50"
        >
          {busy === 'send' ? 'שולחת…' : audience === 'all' ? 'שלחי לכל הרשומות' : 'שלחי למאשרות'}
        </button>
      </div>
    </section>
  );
}

export default function AdminBroadcastEmail({ token }: Props) {
  const [stats, setStats] = useState<BroadcastStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/broadcast-email', {
        headers: { 'x-admin-token': token },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'שגיאה');
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  if (loading) {
    return <p className="text-sm text-[#6e634c]">טוען רשימות תפוצה…</p>;
  }

  if (error) {
    return <FormError message={error} />;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-black text-xl text-[#3d2f24]">מיילים לרשימות תפוצה</h2>
        <p className="text-xs text-[#6e634c] mt-1 leading-relaxed">
          שתי רשימות נפרדות — עדכונים למאשרות, והודעות חשובות לכל הרשומות.
        </p>
      </div>

      <BroadcastPanel
        title="מייל לכל הרשומות (חובה / תפעולי)"
        description="כל משתמשת רשומה עם מייל — גם מי שלא סימנה אישור לעדכונים."
        count={stats.allCount}
        audience="all"
        token={token}
        warning="השתמשי רק להודעות חשובות: תקלה באתר, שינוי תנאים, אבטחה. לא לשיווק."
      />

      <BroadcastPanel
        title="מייל למאשרות"
        description="רק מי שסימנה בהרשמה או בפרטי חשבון שהיא מסכימה לקבל דברי דואר מהאתר."
        count={stats.optInCount}
        audience="opt_in"
        token={token}
      />
    </div>
  );
}
