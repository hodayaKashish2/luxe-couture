'use client';

import { useEffect, useState } from 'react';
import type { Dress } from '@/lib/types';

type DressRating = {
  id: string;
  customer_name: string;
  stars: number;
  review_text: string;
};

type Props = {
  dress: Dress;
};

export default function DressRatingsSection({ dress }: Props) {
  const [ratings, setRatings] = useState<DressRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (dress.rating_count <= 0) return;

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
  }, [dress.id, dress.rating_count]);

  if (dress.rating_count <= 0) return null;

  return (
    <div className="bg-white border border-[#eadaaf] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-black text-[#8b6508]">דירוגים</p>
        <p className="text-xs text-[#b8860b] font-bold">
          ⭐ {dress.rating_avg} · {dress.rating_count} דירוגים
        </p>
      </div>

      {loading && <p className="text-xs text-[#8b6508] text-center py-2">טוענת דירוגים...</p>}
      {!loading && error && <p className="text-xs text-red-700 text-center py-2">{error}</p>}
      {!loading && !error && ratings.length === 0 && (
        <p className="text-xs text-[#6e634c] text-center py-2">עדיין אין דירוגים עם טקסט לשמלה זו.</p>
      )}
      {!loading &&
        !error &&
        ratings.map((rating) => (
          <article
            key={rating.id}
            className="bg-[#fffdf9] border border-[#f0e6cc] rounded-lg p-3 space-y-1.5"
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
  );
}
