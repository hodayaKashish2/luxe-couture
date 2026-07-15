'use client';

import { useState } from 'react';
import FormError from '@/components/FormError';
import type { Dress } from '@/lib/types';

export default function DressRateModal({
  dress,
  onClose,
  onRated,
}: {
  dress: Dress;
  onClose: () => void;
  onRated: (dressId: string, ratingAvg: number, ratingCount: number) => void;
}) {
  const [name, setName] = useState('');
  const [stars, setStars] = useState(5);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) {
      setError('אנא מלאי שם');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/dress-ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dressId: dress.id, name: name.trim(), stars, text: text.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'שגיאה בשמירת הדירוג');
        return;
      }
      onRated(dress.id, data.rating_avg, data.rating_count);
      setSuccess('תודה! הדירוג שלך פורסם ויעזור לשאר הבנות.');
      window.setTimeout(onClose, 1400);
    } catch {
      setError('תקלה בשליחה — נסי שוב');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-[80] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border-2 border-[#d4af37]" dir="rtl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 bg-neutral-100 hover:bg-[#d4af37] text-[#b8860b] hover:text-white w-8 h-8 rounded-full flex items-center justify-center border font-bold cursor-pointer"
        >
          ✕
        </button>
        <h3 className="text-lg font-black text-neutral-950 mb-1">דרגי את השמלה</h3>
        <p className="text-xs text-[#6e634c] mb-4">{dress.name}</p>

        {success ? (
          <div className="bg-gradient-to-l from-[#fffdf9] to-[#f4ebd4] border border-[#e6c687] rounded-xl p-5 text-center space-y-2">
            <p className="text-2xl">⭐</p>
            <p className="text-sm font-bold text-[#3d2f24]">{success}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {error && <FormError message={error} />}
            <input
              type="text"
              required
              placeholder="שמך"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs"
            />
            <div className="flex gap-1 bg-neutral-50 p-2 rounded-xl border border-[#decfa8]">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStars(s)}
                  className={`text-xl cursor-pointer transition-transform hover:scale-110 ${s <= stars ? '' : 'opacity-40 grayscale'}`}
                >
                  ⭐
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              placeholder="ספרי על החוויה (אופציונלי)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs resize-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white text-xs font-black rounded-xl disabled:opacity-60"
            >
              {loading ? 'שולחת...' : 'פרסמי דירוג'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
