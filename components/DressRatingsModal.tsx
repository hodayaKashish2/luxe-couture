'use client';

import { useEffect, useState } from 'react';
import type { Dress } from '@/lib/types';

type DressRating = {
  id: string;
  customer_name: string;
  stars: number;
  review_text: string;
  created_at?: string;
};

type Props = {
  dress: Dress;
  onClose: () => void;
};

export default function DressRatingsModal({ dress, onClose }: Props) {
  const [ratings, setRatings] = useState<DressRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    fetch(`/api/dress-ratings?dressId=${encodeURIComponent(dress.id)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'שגיאה בטעינת דירוגים');
        if (!cancelled) setRatings(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'שגיאה בטעינת דירוגים');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dress.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border-2 border-[#d4af37] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="shrink-0 flex items-start justify-between gap-3 p-4 border-b border-[#f0e6cc]">
          <div className="min-w-0">
            <p className="text-[10px] text-[#b8860b] font-black tracking-widest mb-1">✦ דירוגים ✦</p>
            <h3 className="text-base font-black text-[#3d2f24] truncate">{dress.name}</h3>
            {dress.rating_count > 0 && (
              <p className="text-xs text-[#8b6508] mt-1">
                ⭐ {dress.rating_avg} · {dress.rating_count} דירוגים
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-full bg-neutral-100 text-[#8b6508] font-bold"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          {loading && <p className="text-sm text-[#8b6508] text-center py-6">טוענת דירוגים...</p>}
          {!loading && error && <p className="text-sm text-red-700 text-center py-6">{error}</p>}
          {!loading && !error && ratings.length === 0 && (
            <p className="text-sm text-[#6e634c] text-center py-6">עדיין אין דירוגים עם טקסט לשמלה זו.</p>
          )}
          {!loading &&
            !error &&
            ratings.map((rating) => (
              <article
                key={rating.id}
                className="bg-[#fffdf9] border border-[#eadaaf] rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black text-[#3d2f24]">{rating.customer_name}</p>
                  <p className="text-xs text-[#b8860b] font-bold" aria-label={`${rating.stars} כוכבים`}>
                    {'⭐'.repeat(rating.stars)}
                  </p>
                </div>
                <p className="text-sm text-[#5c5037] leading-relaxed whitespace-pre-wrap">
                  {rating.review_text?.trim() || 'ללא טקסט — רק דירוג כוכבים'}
                </p>
              </article>
            ))}
        </div>
      </div>
    </div>
  );
}
