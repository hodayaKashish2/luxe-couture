'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import DressImageFill from '@/components/DressImageFill';
import AdminDressCatalog from '@/components/admin/AdminDressCatalog';
import AdminPagination from '@/components/admin/AdminPagination';
import AdminStatsBar from '@/components/admin/AdminStatsBar';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import type {
  AdminBookingRow,
  AdminDressRatingRow,
  AdminDressRow,
  AdminOverview,
  AdminSiteReview,
  AdminTab,
} from '@/lib/admin-types';
import { BOOKING_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/admin-types';

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'overview', label: 'סקירה' },
  { id: 'catalog', label: 'קטלוג שמלות' },
  { id: 'pending', label: 'שמלות ממתינות' },
  { id: 'pending_payments', label: 'ממתינות לתשלום' },
  { id: 'ratings', label: 'דירוגים על שמלות' },
  { id: 'reviews', label: 'תגובות אתר' },
  { id: 'bookings', label: 'הזמנות מאושרות' },
];

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [savedToken, setSavedToken] = useState('');
  const [tab, setTab] = useState<AdminTab>('overview');
  const [catalogFeatured, setCatalogFeatured] = useState<'all' | 'yes' | 'no'>('all');
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [ratings, setRatings] = useState<AdminDressRatingRow[]>([]);
  const [ratingsPage, setRatingsPage] = useState(1);
  const [ratingsTotal, setRatingsTotal] = useState(0);
  const [ratingsTotalPages, setRatingsTotalPages] = useState(1);
  const [ratingsSearch, setRatingsSearch] = useState('');
  const [ratingsSearchInput, setRatingsSearchInput] = useState('');
  const [ratingsStatus, setRatingsStatus] = useState('pending');
  const [loadingRatings, setLoadingRatings] = useState(false);

  const [reviews, setReviews] = useState<AdminSiteReview[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [reviewsSearch, setReviewsSearch] = useState('');
  const [reviewsSearchInput, setReviewsSearchInput] = useState('');
  const [reviewsStatus, setReviewsStatus] = useState('pending');
  const [loadingReviews, setLoadingReviews] = useState(false);

  const [bookings, setBookings] = useState<AdminBookingRow[]>([]);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(1);
  const [bookingsSearch, setBookingsSearch] = useState('');
  const [bookingsSearchInput, setBookingsSearchInput] = useState('');
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [pendingPayments, setPendingPayments] = useState<AdminBookingRow[]>([]);
  const [pendingPaymentsPage, setPendingPaymentsPage] = useState(1);
  const [pendingPaymentsTotal, setPendingPaymentsTotal] = useState(0);
  const [pendingPaymentsTotalPages, setPendingPaymentsTotalPages] = useState(1);
  const [loadingPendingPayments, setLoadingPendingPayments] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_token');
    if (stored) setSavedToken(stored);
  }, []);

  const loadOverview = useCallback(async (adminToken: string) => {
    setLoadingOverview(true);
    setError('');
    try {
      const response = await fetch('/api/admin?view=overview', {
        headers: { 'x-admin-token': adminToken },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'שגיאה');
      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const loadRatings = useCallback(async () => {
    if (!savedToken) return;
    setLoadingRatings(true);
    try {
      const params = new URLSearchParams({
        view: 'ratings',
        page: String(ratingsPage),
        limit: '20',
        status: ratingsStatus,
      });
      if (ratingsSearch) params.set('search', ratingsSearch);
      const response = await fetch(`/api/admin?${params}`, {
        headers: { 'x-admin-token': savedToken },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'שגיאה');
      setRatings(data.items || []);
      setRatingsTotal(data.total || 0);
      setRatingsTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoadingRatings(false);
    }
  }, [savedToken, ratingsPage, ratingsSearch, ratingsStatus]);

  const loadReviews = useCallback(async () => {
    if (!savedToken) return;
    setLoadingReviews(true);
    try {
      const params = new URLSearchParams({
        view: 'reviews',
        page: String(reviewsPage),
        limit: '20',
        status: reviewsStatus,
      });
      if (reviewsSearch) params.set('search', reviewsSearch);
      const response = await fetch(`/api/admin?${params}`, {
        headers: { 'x-admin-token': savedToken },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'שגיאה');
      setReviews(data.items || []);
      setReviewsTotal(data.total || 0);
      setReviewsTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoadingReviews(false);
    }
  }, [savedToken, reviewsPage, reviewsSearch, reviewsStatus]);

  const loadBookings = useCallback(async () => {
    if (!savedToken) return;
    setLoadingBookings(true);
    try {
      const params = new URLSearchParams({
        view: 'bookings',
        scope: 'confirmed',
        page: String(bookingsPage),
        limit: '20',
      });
      if (bookingsSearch) params.set('search', bookingsSearch);
      const response = await fetch(`/api/admin?${params}`, {
        headers: { 'x-admin-token': savedToken },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'שגיאה');
      setBookings(data.items || []);
      setBookingsTotal(data.total || 0);
      setBookingsTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoadingBookings(false);
    }
  }, [savedToken, bookingsPage, bookingsSearch]);

  const loadPendingPayments = useCallback(async () => {
    if (!savedToken) return;
    setLoadingPendingPayments(true);
    try {
      const params = new URLSearchParams({
        view: 'bookings',
        scope: 'pending',
        page: String(pendingPaymentsPage),
        limit: '20',
      });
      const response = await fetch(`/api/admin?${params}`, {
        headers: { 'x-admin-token': savedToken },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'שגיאה');
      setPendingPayments(data.items || []);
      setPendingPaymentsTotal(data.total || 0);
      setPendingPaymentsTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה');
    } finally {
      setLoadingPendingPayments(false);
    }
  }, [savedToken, pendingPaymentsPage]);

  useEffect(() => {
    if (savedToken) loadOverview(savedToken);
  }, [savedToken, loadOverview, refreshKey]);

  useEffect(() => {
    if (tab === 'ratings' && savedToken) loadRatings();
  }, [tab, savedToken, loadRatings, refreshKey]);

  useEffect(() => {
    if (tab === 'reviews' && savedToken) loadReviews();
  }, [tab, savedToken, loadReviews, refreshKey]);

  useEffect(() => {
    if (tab === 'bookings' && savedToken) loadBookings();
  }, [tab, savedToken, loadBookings, refreshKey]);

  useEffect(() => {
    if (tab === 'pending_payments' && savedToken) loadPendingPayments();
  }, [tab, savedToken, loadPendingPayments, refreshKey]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem('admin_token', token);
    setSavedToken(token);
  }

  function bumpRefresh() {
    setRefreshKey((k) => k + 1);
  }

  async function handleAction(
    type: 'dress' | 'review' | 'dress_rating' | 'booking',
    id: number,
    action:
      | 'approve'
      | 'reject'
      | 'delete'
      | 'toggle_featured'
      | 'extend_featured'
      | 'approve_payment'
  ): Promise<boolean> {
    if (!savedToken) return false;
    if (action === 'delete' && type === 'dress' && !confirm('להסיר את השמלה מהאתר?')) return false;
    if (action === 'delete' && type === 'dress_rating' && !confirm('למחוק את הדירוג?')) return false;
    if (action === 'approve_payment' && !confirm('לאשר שהתשלום התקבל?')) return false;

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
      setActionMsg('✓ עודכן בהצלחה');
      bumpRefresh();
      return true;
    }
    setActionMsg(data.error || 'שגיאה');
    return false;
  }

  const tabBadges = useMemo(() => {
    if (!overview) return {} as Record<AdminTab, number>;
    return {
      overview: 0,
      catalog: overview.stats.published,
      pending: overview.stats.pendingDresses,
      pending_payments: overview.stats.pendingPayments,
      ratings: overview.stats.pendingRatings,
      reviews: overview.stats.pendingReviews,
      bookings: 0,
    };
  }, [overview]);

  function navigateTab(next: AdminTab, featured: 'all' | 'yes' | 'no' = 'all') {
    setCatalogFeatured(featured);
    setTab(next);
    if (next === 'ratings') setRatingsStatus('pending');
    if (next === 'reviews') setReviewsStatus('pending');
  }

  function renderPendingDressCard(dress: AdminDressRow) {
    return (
      <div key={dress.id} className="bg-white rounded-xl border border-[#eadaaf] p-4 flex gap-4">
        {dress.images?.[0] && (
          <DressImageFill src={dress.images[0]} alt="" className="w-20 h-24 shrink-0 rounded-lg" />
        )}
        <div className="flex-grow min-w-0">
          <h3 className="font-bold">{dress.name}</h3>
          <p className="text-xs text-[#6e634c]">
            #{dress.id} · ₪{dress.price} · מידה {dress.size} · {dress.city}
          </p>
          <p className="text-xs">משכירה: {dress.owner_name}</p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => handleAction('dress', dress.id, 'approve')}
              className="px-3 py-1.5 bg-[#b8860b] text-white text-xs rounded-lg font-bold"
            >
              אשר
            </button>
            <button
              type="button"
              onClick={() => handleAction('dress', dress.id, 'reject')}
              className="px-3 py-1.5 border border-red-300 text-red-600 text-xs rounded-lg"
            >
              דחה
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderReviewCard(review: AdminSiteReview, showStatus = false) {
    return (
      <div key={review.id} className="bg-white rounded-xl border border-[#eadaaf] p-4">
        <p className="text-xs italic mb-2">&quot;{review.text}&quot;</p>
        <p className="text-xs font-bold">
          {review.name} · {review.role} · {'⭐'.repeat(review.stars)}
          {showStatus && (
            <span className="mr-2 text-[#9a7b4f]">
              · {review.status === 'approved' ? 'מפורסם' : review.status === 'pending' ? 'ממתין' : 'נדחה'}
            </span>
          )}
        </p>
        {review.status === 'pending' && (
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => handleAction('review', review.id, 'approve')}
              className="px-3 py-1.5 bg-[#b8860b] text-white text-xs rounded-lg font-bold"
            >
              אשר
            </button>
            <button
              type="button"
              onClick={() => handleAction('review', review.id, 'reject')}
              className="px-3 py-1.5 border border-red-300 text-red-600 text-xs rounded-lg"
            >
              דחה
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderPendingPaymentCard(booking: AdminBookingRow) {
    const canApprove = booking.status === 'awaiting_admin_approval';
    return (
      <div key={booking.id} className="bg-white rounded-xl border border-amber-200 p-4">
        <div className="flex justify-between gap-2 flex-wrap mb-2">
          <p className="text-sm font-bold">{booking.customer_name}</p>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded-full">
            {BOOKING_STATUS_LABELS[booking.status] || booking.status}
          </span>
        </div>
        <p className="text-xs text-[#6e634c]">
          שמלה: {booking.dress_name || `#${booking.dress_id}`} · תאריך: {booking.event_date}
        </p>
        <p className="text-xs text-[#6e634c]" dir="ltr">
          {booking.customer_phone} · {booking.customer_email}
        </p>
        {booking.amount_total != null && (
          <p className="text-xs font-bold text-[#8b6508] mt-1">₪{booking.amount_total}</p>
        )}
        {booking.payment_method && (
          <p className="text-xs text-[#6e634c]">
            אמצעי תשלום: {PAYMENT_METHOD_LABELS[booking.payment_method] || booking.payment_method}
          </p>
        )}
        {canApprove && (
          <button
            type="button"
            onClick={() => handleAction('booking', booking.id, 'approve_payment')}
            className="mt-3 px-4 py-2 bg-[#b8860b] text-white text-xs rounded-xl font-black"
          >
            אשרי תשלום
          </button>
        )}
        {booking.status === 'pending_payment' && (
          <p className="mt-2 text-[10px] text-[#9a7b4f]">השוכרת עדיין לא דיווחה על תשלום</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf8f0] to-[#e8dcbd] text-[#332c1e]" dir="rtl">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-[family-name:var(--font-luxury)] text-3xl text-[#3d2f24] mb-1">
            ניהול האתר
          </h1>
          <p className="text-sm text-[#6e634c]">
            ממשק מסודר לניהול מאות שמלות — חיפוש, סינון ועימוד
          </p>
        </div>

        {!savedToken ? (
          <form
            onSubmit={handleLogin}
            className="bg-white rounded-2xl border border-[#eadaaf] p-6 max-w-md space-y-4"
          >
            <label className="block text-xs font-bold text-[#8b6508]">סיסמת ניהול (ADMIN_SECRET)</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full p-3 border border-[#decfa8] rounded-xl text-sm"
              required
            />
            <button
              type="submit"
              className="w-full py-3 bg-[#2c261a] text-white rounded-xl text-sm font-bold"
            >
              כניסה
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#8b6508] font-bold">מחוברת ✓</span>
                {actionMsg && <span className="text-xs font-bold text-[#b8860b]">{actionMsg}</span>}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => bumpRefresh()}
                  className="text-xs px-3 py-1.5 border border-[#decfa8] rounded-lg bg-white"
                >
                  רענון
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.removeItem('admin_token');
                    setSavedToken('');
                    setOverview(null);
                  }}
                  className="text-xs text-red-600 hover:underline px-2"
                >
                  התנתקי
                </button>
              </div>
            </div>

            {loadingOverview && !overview ? (
              <p className="text-sm">טוען נתונים...</p>
            ) : overview ? (
              <AdminStatsBar
                stats={overview.stats}
                onNavigate={(target, featured = 'all') => {
                  navigateTab(target as AdminTab, featured);
                }}
              />
            ) : null}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </p>
            )}

            <div className="sticky top-0 z-20 bg-[#fbf8f0]/95 backdrop-blur-sm py-2 -mx-1 px-1">
              <div className="flex gap-1 overflow-x-auto pb-1">
                {TABS.map((item) => {
                  const badge = tabBadges[item.id];
                  const showBadge =
                    badge > 0 &&
                    (item.id === 'pending' ||
                      item.id === 'pending_payments' ||
                      item.id === 'ratings' ||
                      item.id === 'reviews');
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateTab(item.id)}
                      className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        tab === item.id
                          ? 'bg-[#2c261a] text-white border-[#2c261a]'
                          : 'bg-white text-[#3d2f24] border-[#eadaaf] hover:border-[#d4af37]'
                      }`}
                    >
                      {item.label}
                      {item.id === 'catalog' && overview && (
                        <span className="mr-1 opacity-70">({overview.stats.published})</span>
                      )}
                      {showBadge && (
                        <span className="mr-1 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-amber-500 text-white text-[10px] px-1">
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {tab === 'overview' && overview && (
              <div className="space-y-6">
                {overview.stats.pendingDresses > 0 && (
                  <section className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="font-black text-lg text-amber-900">
                        דורשות טיפול — שמלות ממתינות ({overview.stats.pendingDresses})
                      </h2>
                      <button
                        type="button"
                        onClick={() => navigateTab('pending')}
                        className="text-xs font-bold text-amber-800 underline"
                      >
                        הצג הכל
                      </button>
                    </div>
                    <div className="space-y-3">
                      {overview.pendingDresses.slice(0, 5).map(renderPendingDressCard)}
                    </div>
                  </section>
                )}

                {(overview.stats.pendingPayments > 0 || overview.stats.pendingRatings > 0 || overview.stats.pendingReviews > 0) && (
                  <section className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 space-y-4">
                    <h2 className="font-black text-lg text-amber-900">דורשות טיפול</h2>
                    {overview.stats.pendingPayments > 0 && (
                      <div>
                        <div className="flex justify-between mb-2">
                          <p className="text-sm font-bold">ממתינות לתשלום ({overview.stats.pendingPayments})</p>
                          <button type="button" onClick={() => navigateTab('pending_payments')} className="text-xs underline text-amber-800">הצג הכל</button>
                        </div>
                        <div className="space-y-2">
                          {overview.pendingPayments.slice(0, 3).map(renderPendingPaymentCard)}
                        </div>
                      </div>
                    )}
                    {overview.stats.pendingRatings > 0 && (
                      <div>
                        <div className="flex justify-between mb-2">
                          <p className="text-sm font-bold">דירוגים על שמלות ({overview.stats.pendingRatings})</p>
                          <button type="button" onClick={() => navigateTab('ratings')} className="text-xs underline text-amber-800">הצג הכל</button>
                        </div>
                        <div className="space-y-2">
                          {overview.pendingRatings.slice(0, 3).map((rating) => (
                            <div key={rating.id} className="bg-white rounded-lg p-3 text-xs">
                              <p className="font-bold">{rating.dress_name} · {rating.customer_name} · {'⭐'.repeat(rating.stars)}</p>
                              {rating.review_text && <p className="italic mt-1">&quot;{rating.review_text}&quot;</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {overview.stats.pendingReviews > 0 && (
                      <div>
                        <div className="flex justify-between mb-2">
                          <p className="text-sm font-bold">תגובות אתר ({overview.stats.pendingReviews})</p>
                          <button type="button" onClick={() => navigateTab('reviews')} className="text-xs underline text-amber-800">הצג הכל</button>
                        </div>
                        <div className="space-y-2">
                          {overview.pendingReviews.slice(0, 3).map((r) => renderReviewCard(r))}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                <section className="bg-white rounded-2xl border border-[#eadaaf] p-5">
                  <h2 className="font-bold text-lg mb-4">הזמנות מאושרות אחרונות</h2>
                  {overview.recentBookings.length === 0 ? (
                    <p className="text-xs text-[#6e634c]">אין הזמנות אחרונות</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="text-[#6e634c] border-b border-[#eadaaf]">
                          <tr>
                            <th className="p-2 text-right">שם</th>
                            <th className="p-2 text-right">תאריך אירוע</th>
                            <th className="p-2 text-right">סטטוס</th>
                            <th className="p-2 text-right">נוצר</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overview.recentBookings.map((b) => (
                            <tr key={b.id} className="border-b border-[#f0e8d0]">
                              <td className="p-2">{b.customer_name}</td>
                              <td className="p-2">{b.event_date}</td>
                              <td className="p-2">{BOOKING_STATUS_LABELS[b.status] || b.status}</td>
                              <td className="p-2 text-[#9a7b4f]">
                                {new Date(b.created_at).toLocaleDateString('he-IL')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => navigateTab('bookings')}
                    className="mt-3 text-xs font-bold text-[#8b6508] underline"
                  >
                    הזמנות מאושרות →
                  </button>
                </section>

                <section className="grid sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => navigateTab('catalog')}
                    className="text-right bg-[#fffdf8] border border-[#e6c687] rounded-2xl p-5 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-black text-[#8b6508] mb-1">קטלוג שמלות</h3>
                    <p className="text-xs text-[#6e634c]">
                      חיפוש, סינון לפי עיר וחשיפה, עימוד — לניהול {overview.stats.published} שמלות
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTab('catalog', 'yes')}
                    className="text-right bg-[#fffdf8] border border-[#e6c687] rounded-2xl p-5 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-black text-[#8b6508] mb-1">חשיפה מועדפת</h3>
                    <p className="text-xs text-[#6e634c]">
                      {overview.stats.featured} שמלות עם חשיפה מוגברת בקטלוג
                    </p>
                  </button>
                </section>
              </div>
            )}

            {tab === 'catalog' && savedToken && overview && (
              <AdminDressCatalog
                token={savedToken}
                cities={overview.cities}
                initialFeatured={catalogFeatured}
                refreshKey={refreshKey}
                onAction={(id, action) => handleAction('dress', id, action)}
              />
            )}

            {tab === 'pending' && overview && (
              <section className="space-y-4">
                <h2 className="font-bold text-lg">
                  שמלות ממתינות לאישור ({overview.stats.pendingDresses})
                </h2>
                {overview.pendingDresses.length === 0 ? (
                  <p className="text-xs text-[#6e634c]">אין שמלות ממתינות 🎉</p>
                ) : (
                  overview.pendingDresses.map(renderPendingDressCard)
                )}
              </section>
            )}

            {tab === 'pending_payments' && (
              <section className="space-y-4">
                <h2 className="font-bold text-lg">
                  ממתינות לתשלום ({overview?.stats.pendingPayments ?? pendingPaymentsTotal})
                </h2>
                <p className="text-xs text-[#6e634c]">
                  הזמנות שלא שולמו עדיין, או שדווח עליהן תשלום (ביט/העברה) וממתינות לאישור שלך
                </p>
                {loadingPendingPayments ? (
                  <p className="text-sm">טוען...</p>
                ) : pendingPayments.length === 0 ? (
                  <p className="text-xs text-[#6e634c]">אין הזמנות ממתינות לתשלום 🎉</p>
                ) : (
                  <div className="space-y-3">
                    {pendingPayments.map(renderPendingPaymentCard)}
                    <AdminPagination
                      page={pendingPaymentsPage}
                      totalPages={pendingPaymentsTotalPages}
                      total={pendingPaymentsTotal}
                      limit={20}
                      onPageChange={setPendingPaymentsPage}
                    />
                  </div>
                )}
              </section>
            )}

            {tab === 'reviews' && (
              <section className="space-y-4">
                <h2 className="font-bold text-lg">תגובות כלליות של האתר</h2>
                <p className="text-xs text-[#6e634c]">
                  תגובות שמופיעות בדף הבית — ממתינות לאישור, מפורסמות או נדחות
                </p>
                <div className="bg-white rounded-2xl border border-[#eadaaf] p-4 flex flex-col sm:flex-row gap-2">
                  <form
                    className="flex flex-1 gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setReviewsPage(1);
                      setReviewsSearch(reviewsSearchInput.trim());
                    }}
                  >
                    <input
                      value={reviewsSearchInput}
                      onChange={(e) => setReviewsSearchInput(e.target.value)}
                      placeholder="חיפוש לפי שם, תפקיד או טקסט..."
                      className="flex-1 p-2.5 border border-[#decfa8] rounded-xl text-sm"
                    />
                    <button type="submit" className="px-4 py-2 bg-[#2c261a] text-white rounded-xl text-sm font-bold">
                      חפשי
                    </button>
                  </form>
                  <select
                    value={reviewsStatus}
                    onChange={(e) => {
                      setReviewsStatus(e.target.value);
                      setReviewsPage(1);
                    }}
                    className="text-xs border border-[#decfa8] rounded-lg px-2 py-2"
                  >
                    <option value="pending">ממתינות</option>
                    <option value="approved">מפורסמות</option>
                    <option value="rejected">נדחות</option>
                    <option value="all">הכל</option>
                  </select>
                </div>

                {loadingReviews ? (
                  <p className="text-sm">טוען תגובות...</p>
                ) : reviews.length === 0 ? (
                  <p className="text-xs text-[#6e634c]">לא נמצאו תגובות</p>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((r) => renderReviewCard(r, true))}
                    <AdminPagination
                      page={reviewsPage}
                      totalPages={reviewsTotalPages}
                      total={reviewsTotal}
                      limit={20}
                      onPageChange={setReviewsPage}
                    />
                  </div>
                )}
              </section>
            )}

            {tab === 'ratings' && (
              <section className="space-y-4">
                <h2 className="font-bold text-lg">דירוגים ותגובות על שמלות</h2>
                <p className="text-xs text-[#6e634c]">
                  ביקורות ששוכרות כותבות על שמלה ספציפית — ברירת מחדל: ממתינים לאישור
                </p>
                <div className="bg-white rounded-2xl border border-[#eadaaf] p-4 flex flex-col sm:flex-row gap-2">
                  <form
                    className="flex flex-1 gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setRatingsPage(1);
                      setRatingsSearch(ratingsSearchInput.trim());
                    }}
                  >
                    <input
                      value={ratingsSearchInput}
                      onChange={(e) => setRatingsSearchInput(e.target.value)}
                      placeholder="חיפוש לפי שמלה, שם או טקסט..."
                      className="flex-1 p-2.5 border border-[#decfa8] rounded-xl text-sm"
                    />
                    <button type="submit" className="px-4 py-2 bg-[#2c261a] text-white rounded-xl text-sm font-bold">
                      חפשי
                    </button>
                  </form>
                  <select
                    value={ratingsStatus}
                    onChange={(e) => {
                      setRatingsStatus(e.target.value);
                      setRatingsPage(1);
                    }}
                    className="text-xs border border-[#decfa8] rounded-lg px-2 py-2"
                  >
                    <option value="pending">ממתינים לאישור</option>
                    <option value="approved">מפורסמים</option>
                    <option value="all">הכל</option>
                  </select>
                </div>

                {loadingRatings ? (
                  <p className="text-sm">טוען דירוגים...</p>
                ) : ratings.length === 0 ? (
                  <p className="text-xs text-[#6e634c]">לא נמצאו דירוגים</p>
                ) : (
                  <div className="bg-white rounded-2xl border border-[#eadaaf] divide-y divide-[#f0e8d0]">
                    {ratings.map((rating) => (
                      <div key={rating.id} className="p-4">
                        <div className="flex justify-between gap-2 flex-wrap">
                          <p className="text-xs font-bold text-[#8b6508]">{rating.dress_name}</p>
                          <span className="text-[10px] text-[#9a7b4f]">
                            {new Date(rating.created_at).toLocaleDateString('he-IL')}
                          </span>
                        </div>
                        {rating.review_text ? (
                          <p className="text-xs italic my-2">&quot;{rating.review_text}&quot;</p>
                        ) : (
                          <p className="text-xs text-[#9a7b4f] my-2">(ללא טקסט)</p>
                        )}
                        <p className="text-xs font-bold">
                          {rating.customer_name} · {'⭐'.repeat(rating.stars)} ·{' '}
                          {rating.status === 'approved' ? 'מפורסם' : 'ממתין'}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {rating.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleAction('dress_rating', rating.id, 'approve')}
                              className="px-3 py-1.5 bg-[#b8860b] text-white text-xs rounded-lg font-bold"
                            >
                              אשרי ופרסמי
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleAction('dress_rating', rating.id, 'delete')}
                            className="px-3 py-1.5 border border-red-300 text-red-600 text-xs rounded-lg font-bold"
                          >
                            מחקי
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="p-4">
                      <AdminPagination
                        page={ratingsPage}
                        totalPages={ratingsTotalPages}
                        total={ratingsTotal}
                        limit={20}
                        onPageChange={setRatingsPage}
                      />
                    </div>
                  </div>
                )}
              </section>
            )}

            {tab === 'bookings' && (
              <section className="space-y-4">
                <h2 className="font-bold text-lg">הזמנות מאושרות ({bookingsTotal})</h2>
                <p className="text-xs text-[#6e634c]">רק הזמנות שאושרו ושולמו — לא כולל ממתינות לתשלום</p>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setBookingsPage(1);
                    setBookingsSearch(bookingsSearchInput.trim());
                  }}
                >
                  <input
                    value={bookingsSearchInput}
                    onChange={(e) => setBookingsSearchInput(e.target.value)}
                    placeholder="חיפוש לפי שם, טלפון או אימייל..."
                    className="flex-1 p-2.5 border border-[#decfa8] rounded-xl text-sm bg-white"
                  />
                  <button type="submit" className="px-4 py-2 bg-[#2c261a] text-white rounded-xl text-sm font-bold">
                    חפשי
                  </button>
                </form>

                {loadingBookings ? (
                  <p className="text-sm">טוען הזמנות...</p>
                ) : bookings.length === 0 ? (
                  <p className="text-xs text-[#6e634c]">לא נמצאו הזמנות</p>
                ) : (
                  <div className="bg-white rounded-2xl border border-[#eadaaf] overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-[#fffdf8] border-b border-[#eadaaf] text-[#6e634c]">
                        <tr>
                          <th className="p-3 text-right">#</th>
                          <th className="p-3 text-right">שם</th>
                          <th className="p-3 text-right">שמלה</th>
                          <th className="p-3 text-right">טלפון</th>
                          <th className="p-3 text-right">אימייל</th>
                          <th className="p-3 text-right">תאריך אירוע</th>
                          <th className="p-3 text-right">סטטוס</th>
                          <th className="p-3 text-right">נוצר</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((b) => (
                          <tr key={b.id} className="border-b border-[#f0e8d0]">
                            <td className="p-3">{b.id}</td>
                            <td className="p-3 font-bold">{b.customer_name}</td>
                            <td className="p-3">{b.dress_name || `#${b.dress_id}`}</td>
                            <td className="p-3" dir="ltr">
                              {b.customer_phone}
                            </td>
                            <td className="p-3" dir="ltr">
                              {b.customer_email}
                            </td>
                            <td className="p-3">{b.event_date}</td>
                            <td className="p-3">{BOOKING_STATUS_LABELS[b.status] || b.status}</td>
                            <td className="p-3 text-[#9a7b4f]">
                              {new Date(b.created_at).toLocaleDateString('he-IL')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="p-4">
                      <AdminPagination
                        page={bookingsPage}
                        totalPages={bookingsTotalPages}
                        total={bookingsTotal}
                        limit={20}
                        onPageChange={setBookingsPage}
                      />
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
