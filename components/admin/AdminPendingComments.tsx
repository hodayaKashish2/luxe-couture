'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminCollapsibleItem from '@/components/admin/AdminCollapsibleItem';
import AdminPagination from '@/components/admin/AdminPagination';
import type { AdminDressRatingRow, AdminSiteReview } from '@/lib/admin-types';

type AdminPendingCommentsProps = {
  token: string;
  refreshKey: number;
  onApprove: (type: 'review' | 'dress_rating', id: number) => Promise<boolean>;
  onRejectRequest: (
    type: 'review' | 'dress_rating',
    id: number,
    label: string,
    action: 'reject' | 'delete'
  ) => void;
  onDeleteReview: (id: number) => Promise<boolean>;
};

export default function AdminPendingComments({
  token,
  refreshKey,
  onApprove,
  onRejectRequest,
  onDeleteReview,
}: AdminPendingCommentsProps) {
  const [siteReviews, setSiteReviews] = useState<AdminSiteReview[]>([]);
  const [dressRatings, setDressRatings] = useState<AdminDressRatingRow[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [ratingsPage, setRatingsPage] = useState(1);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [ratingsTotal, setRatingsTotal] = useState(0);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [ratingsTotalPages, setRatingsTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [reviewsRes, ratingsRes] = await Promise.all([
        fetch(`/api/admin?view=reviews&status=pending&page=${reviewsPage}&limit=20`, {
          headers: { 'x-admin-token': token },
        }),
        fetch(`/api/admin?view=ratings&status=pending&page=${ratingsPage}&limit=20`, {
          headers: { 'x-admin-token': token },
        }),
      ]);
      const reviewsData = await reviewsRes.json();
      const ratingsData = await ratingsRes.json();
      if (!reviewsRes.ok) throw new Error(reviewsData.error || 'שגיאה');
      if (!ratingsRes.ok) throw new Error(ratingsData.error || 'שגיאה');
      setSiteReviews(reviewsData.items || []);
      setDressRatings(ratingsData.items || []);
      setReviewsTotal(reviewsData.total || 0);
      setRatingsTotal(ratingsData.total || 0);
      setReviewsTotalPages(reviewsData.totalPages || 1);
      setRatingsTotalPages(ratingsData.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoading(false);
    }
  }, [token, reviewsPage, ratingsPage]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const totalPending = reviewsTotal + ratingsTotal;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-bold text-lg">תגובות ממתינות ({totalPending})</h2>
        <p className="text-xs text-[#6e634c] mt-1">
          רק תגובות לאתר ודירוגים על שמלות שממתינים לאישור
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
      )}

      {loading ? (
        <p className="text-sm">טוען...</p>
      ) : (
        <>
          <div>
            <h3 className="text-sm font-bold text-[#8b6508] mb-2">תגובות לאתר ({reviewsTotal})</h3>
            {siteReviews.length === 0 ? (
              <p className="text-xs text-[#6e634c]">אין תגובות ממתינות לאתר</p>
            ) : (
              <div className="space-y-2">
                {siteReviews.map((review) => (
                  <AdminCollapsibleItem
                    key={`site-${review.id}`}
                    title={review.name}
                    subtitle={`${review.role} · ${'⭐'.repeat(review.stars)}`}
                    badge={
                      <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                        אתר
                      </span>
                    }
                  >
                    <p className="text-xs italic mb-3">&quot;{review.text}&quot;</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onApprove('review', review.id)}
                        className="px-3 py-1.5 bg-[#b8860b] text-white text-xs rounded-lg font-bold"
                      >
                        אשר
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onRejectRequest('review', review.id, review.name, 'reject')
                        }
                        className="px-3 py-1.5 border border-red-300 text-red-600 text-xs rounded-lg"
                      >
                        דחה
                      </button>
                      <button
                        type="button"
                        onClick={() => void onDeleteReview(review.id)}
                        className="px-3 py-1.5 border border-red-400 text-red-700 text-xs rounded-lg font-bold"
                      >
                        מחק
                      </button>
                    </div>
                  </AdminCollapsibleItem>
                ))}
                <AdminPagination
                  page={reviewsPage}
                  totalPages={reviewsTotalPages}
                  total={reviewsTotal}
                  limit={20}
                  onPageChange={setReviewsPage}
                />
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#8b6508] mb-2">
              דירוגים על שמלות ({ratingsTotal})
            </h3>
            {dressRatings.length === 0 ? (
              <p className="text-xs text-[#6e634c]">אין דירוגים ממתינים</p>
            ) : (
              <div className="space-y-2">
                {dressRatings.map((rating) => (
                  <AdminCollapsibleItem
                    key={`rating-${rating.id}`}
                    title={rating.dress_name}
                    subtitle={`${rating.customer_name} · ${'⭐'.repeat(rating.stars)}`}
                    badge={
                      <span className="text-[9px] font-bold text-[#8b6508] bg-[#fff8e8] px-2 py-0.5 rounded-full">
                        שמלה
                      </span>
                    }
                  >
                    {rating.review_text ? (
                      <p className="text-xs italic mb-3">&quot;{rating.review_text}&quot;</p>
                    ) : (
                      <p className="text-xs text-[#9a7b4f] mb-3">(ללא טקסט)</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onApprove('dress_rating', rating.id)}
                        className="px-3 py-1.5 bg-[#b8860b] text-white text-xs rounded-lg font-bold"
                      >
                        אשרי ופרסמי
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onRejectRequest(
                            'dress_rating',
                            rating.id,
                            `${rating.dress_name} — ${rating.customer_name}`,
                            'delete'
                          )
                        }
                        className="px-3 py-1.5 border border-red-300 text-red-600 text-xs rounded-lg font-bold"
                      >
                        מחקי
                      </button>
                    </div>
                  </AdminCollapsibleItem>
                ))}
                <AdminPagination
                  page={ratingsPage}
                  totalPages={ratingsTotalPages}
                  total={ratingsTotal}
                  limit={20}
                  onPageChange={setRatingsPage}
                />
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
