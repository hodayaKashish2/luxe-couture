'use client';

import { useEffect, useState } from 'react';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

type DressRow = {
  id: number;
  name: string;
  price: number;
  size: string;
  city: string;
  owner_name: string;
  images: string[];
  created_at: string;
};

type PendingReview = {
  id: number;
  name: string;
  role: string;
  text: string;
  stars: number;
  created_at: string;
};

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [savedToken, setSavedToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [pendingDresses, setPendingDresses] = useState<DressRow[]>([]);
  const [publishedDresses, setPublishedDresses] = useState<DressRow[]>([]);
  const [reviews, setReviews] = useState<PendingReview[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_token');
    if (stored) setSavedToken(stored);
  }, []);

  async function loadData(adminToken: string) {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin', {
        headers: { 'x-admin-token': adminToken },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'שגיאה');
      setPendingDresses(data.pendingDresses || []);
      setPublishedDresses(data.publishedDresses || []);
      setReviews(data.pendingReviews || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem('admin_token', token);
    setSavedToken(token);
    loadData(token);
  }

  useEffect(() => {
    if (savedToken) loadData(savedToken);
  }, [savedToken]);

  async function handleAction(
    type: 'dress' | 'review',
    id: number,
    action: 'approve' | 'reject' | 'delete'
  ) {
    if (!savedToken) return;
    if (action === 'delete' && !confirm('להסיר את השמלה מהאתר? היא לא תופיע יותר בקטalog.')) return;

    setActionMsg('');
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': savedToken,
      },
      body: JSON.stringify({ type, id, action }),
    });
    const data = await response.json();
    if (response.ok) {
      setActionMsg(action === 'delete' ? '✓ השמלה הוסרה מהאתר' : '✓ עודכן בהצלחה');
      loadData(savedToken);
    } else {
      setActionMsg(data.error || 'שגיאה בפעולה');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf8f0] to-[#e8dcbd] text-[#332c1e]" dir="rtl">
      <SiteHeader />

      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="font-[family-name:var(--font-luxury)] text-3xl text-[#3d2f24] mb-2">ניהול האתר</h1>
        <p className="text-sm text-[#6e634c] mb-2">כאן מאשרים שמלות חדשות ו<strong className="text-[#8b6508]">מוחקים שמלות מהאתר</strong></p>
        <p className="text-xs text-[#9a7b4f] mb-8">נתיב: /admin · סיסמה: ADMIN_SECRET מ-.env.local</p>

        {!savedToken ? (
          <form onSubmit={handleLogin} className="bg-white rounded-2xl border border-[#eadaaf] p-6 max-w-md space-y-4">
            <label className="block text-xs font-bold text-[#8b6508]">סיסמת ניהול (ADMIN_SECRET)</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full p-3 border border-[#decfa8] rounded-xl text-sm"
              required
            />
            <button type="submit" className="w-full py-3 bg-[#2c261a] text-white rounded-xl text-sm font-bold">
              כניסה
            </button>
          </form>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-xs text-[#8b6508]">מחוברת ✓</span>
              {actionMsg && <span className="text-xs font-bold text-[#b8860b]">{actionMsg}</span>}
              <button
                onClick={() => {
                  sessionStorage.removeItem('admin_token');
                  setSavedToken('');
                }}
                className="text-xs text-red-600 hover:underline"
              >
                התנתקי
              </button>
            </div>

            {loading && <p className="text-sm">טוען...</p>}
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

            {/* מחיקה — ראשון וברור */}
            <section className="bg-red-50/50 border-2 border-red-200 rounded-2xl p-5">
              <h2 className="font-black text-lg mb-1 text-red-900">🗑️ מחיקת שמלה מהאתר ({publishedDresses.length})</h2>
              <p className="text-xs text-red-800/80 mb-4">כל השמלות המפורסמות כרגע — לחצי «הסר מהאתר» כדי להסיר מהקטalog</p>
              {publishedDresses.length === 0 ? (
                <p className="text-xs text-[#6e634c]">אין שמלות מפורסמות כרגע</p>
              ) : (
                <div className="space-y-3">
                  {publishedDresses.map((dress) => (
                    <div key={dress.id} className="bg-white rounded-xl border border-red-100 p-4 flex gap-4 items-center">
                      {dress.images?.[0] && (
                        <img src={dress.images[0]} alt="" className="w-16 h-20 object-cover rounded-lg" />
                      )}
                      <div className="flex-grow min-w-0">
                        <h3 className="font-bold text-sm">{dress.name}</h3>
                        <p className="text-[10px] text-[#6e634c]">
                          ₪{dress.price} · מידה {dress.size} · {dress.city || '—'} · משכירה: {dress.owner_name || '—'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAction('dress', dress.id, 'delete')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded-xl font-black shrink-0 shadow-md"
                      >
                        הסר מהאתר
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="font-bold text-lg mb-4">שמלות ממתינות לאישור ({pendingDresses.length})</h2>
              {pendingDresses.length === 0 ? (
                <p className="text-xs text-[#6e634c]">אין שמלות ממתינות</p>
              ) : (
                <div className="space-y-4">
                  {pendingDresses.map((dress) => (
                    <div key={dress.id} className="bg-white rounded-xl border border-[#eadaaf] p-4 flex gap-4">
                      {dress.images?.[0] && (
                        <img src={dress.images[0]} alt="" className="w-20 h-24 object-cover rounded-lg" />
                      )}
                      <div className="flex-grow">
                        <h3 className="font-bold">{dress.name}</h3>
                        <p className="text-xs text-[#6e634c]">₪{dress.price} · מידה {dress.size} · {dress.city}</p>
                        <p className="text-xs">משכירה: {dress.owner_name}</p>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleAction('dress', dress.id, 'approve')}
                            className="px-3 py-1.5 bg-[#b8860b] text-white text-xs rounded-lg font-bold"
                          >
                            אשר
                          </button>
                          <button
                            onClick={() => handleAction('dress', dress.id, 'reject')}
                            className="px-3 py-1.5 border border-red-300 text-red-600 text-xs rounded-lg"
                          >
                            דחה
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="font-bold text-lg mb-4">תגובות ממתינות ({reviews.length})</h2>
              {reviews.length === 0 ? (
                <p className="text-xs text-[#6e634c]">אין תגובות ממתינות</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-xl border border-[#eadaaf] p-4">
                      <p className="text-xs italic mb-2">&quot;{review.text}&quot;</p>
                      <p className="text-xs font-bold">{review.name} · {review.role} · {'⭐'.repeat(review.stars)}</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAction('review', review.id, 'approve')}
                          className="px-3 py-1.5 bg-[#b8860b] text-white text-xs rounded-lg font-bold"
                        >
                          אשר
                        </button>
                        <button
                          onClick={() => handleAction('review', review.id, 'reject')}
                          className="px-3 py-1.5 border border-red-300 text-red-600 text-xs rounded-lg"
                        >
                          דחה
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
