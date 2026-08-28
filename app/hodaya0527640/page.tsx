'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminBookingsGrid from '@/components/admin/AdminBookingsGrid';
import AdminRejectReasonModal from '@/components/admin/AdminRejectReasonModal';
import AdminDressCatalog from '@/components/admin/AdminDressCatalog';
import AdminPendingComments from '@/components/admin/AdminPendingComments';
import AdminPendingDressesGrid from '@/components/admin/AdminPendingDressesGrid';
import AdminCollapsibleSection from '@/components/admin/AdminCollapsibleSection';
import AdminPagination from '@/components/admin/AdminPagination';
import AdminStatsBar from '@/components/admin/AdminStatsBar';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import type {
  AdminBookingRow,
  AdminOverview,
  AdminTab,
} from '@/lib/admin-types';
import { BOOKING_STATUS_LABELS } from '@/lib/admin-types';

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'overview', label: 'סקירה' },
  { id: 'catalog', label: 'קטלוג שמלות' },
  { id: 'pending', label: 'שמלות ממתינות' },
  { id: 'pending_payments', label: 'אישור תשלום' },
  { id: 'pending_comments', label: 'תגובות ממתינות' },
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

  const [rejectPrompt, setRejectPrompt] = useState<{
    type: 'dress' | 'review' | 'dress_rating';
    id: number;
    title: string;
    description: string;
    action: 'reject' | 'delete';
  } | null>(null);
  const [rejectBusy, setRejectBusy] = useState(false);
  const [catalogPdfBusy, setCatalogPdfBusy] = useState(false);

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

  const loadBookings = useCallback(async () => {
    if (!savedToken) return;
    setLoadingBookings(true);
    try {
      const params = new URLSearchParams({
        view: 'bookings',
        scope: 'confirmed',
        page: String(bookingsPage),
        limit: '48',
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
        limit: '48',
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
      | 'approve_payment',
    reason?: string
  ): Promise<boolean> {
    if (!savedToken) return false;
    if (action === 'delete' && type === 'dress' && !confirm('להסיר את השמלה מהאתר?')) return false;
    if (action === 'delete' && type === 'dress_rating' && !reason && !confirm('למחוק את הדירוג?')) {
      return false;
    }
    if (action === 'delete' && type === 'review' && !confirm('למחוק את התגובה?')) return false;
    if (action === 'approve_payment' && !confirm('לאשר שהתשלום התקבל?')) return false;

    setActionMsg('');
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': savedToken,
      },
      body: JSON.stringify({
        type,
        id,
        action,
        ...(reason ? { reason } : {}),
      }),
    });
    const data = await response.json();
    if (response.ok) {
      if (data.ownerEmailError) {
        setActionMsg(`✓ עודכן — מייל לא נשלח: ${data.ownerEmailError}`);
      } else if (data.ownerEmailSent) {
        setActionMsg('✓ עודכן ונשלח מייל ללקוחה');
      } else {
        setActionMsg('✓ עודכן בהצלחה');
      }
      bumpRefresh();
      return true;
    }
    setActionMsg(data.error || 'שגיאה');
    return false;
  }

  function openRejectPrompt(
    type: 'dress' | 'review' | 'dress_rating',
    id: number,
    label: string,
    action: 'reject' | 'delete' = 'reject'
  ) {
    const titles = {
      dress: 'דחיית שמלה',
      review: 'דחיית תגובה',
      dress_rating: 'דחיית דירוג',
    };
    const descriptions = {
      dress: `השמלה "${label}" לא תפורסם. הסיבה תישלח במייל למשכירה.`,
      review: `התגובה של "${label}" לא תפורסם. (תגובות לאתר ללא מייל — הסיבה תישמר בדחייה)`,
      dress_rating: `הדירוג "${label}" לא יפורסם. הסיבה תישלח במייל ללקוחה.`,
    };
    setRejectPrompt({
      type,
      id,
      title: titles[type],
      description: descriptions[type],
      action,
    });
  }

  async function confirmReject(reason: string) {
    if (!rejectPrompt) return;
    setRejectBusy(true);
    const ok = await handleAction(
      rejectPrompt.type,
      rejectPrompt.id,
      rejectPrompt.action,
      reason
    );
    setRejectBusy(false);
    if (ok) setRejectPrompt(null);
  }

  const tabBadges = useMemo(() => {
    if (!overview) return {} as Record<AdminTab, number>;
    return {
      overview: 0,
      catalog: overview.stats.published,
      pending: overview.stats.pendingDresses,
      pending_payments: overview.stats.pendingPayments,
      pending_comments: overview.stats.pendingReviews + overview.stats.pendingRatings,
      bookings: 0,
    };
  }, [overview]);

  function navigateTab(next: AdminTab, featured: 'all' | 'yes' | 'no' = 'all') {
    setCatalogFeatured(featured);
    setTab(next);
  }

  async function approvePayment(id: number) {
    return handleAction('booking', id, 'approve_payment');
  }

  async function downloadCatalogPdf() {
    if (!savedToken || catalogPdfBusy) return;
    setCatalogPdfBusy(true);
    setError('');
    setActionMsg('');

    try {
      const response = await fetch('/api/admin/catalog-pdf', {
        headers: { 'x-admin-token': savedToken },
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'יצירת הקטלוג נכשלה');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `catalog-dress-click-${new Date().toISOString().slice(0, 10)}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      setActionMsg(`✓ קטלוג PDF הורד (${overview?.stats.published ?? 'כל'} שמלות)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'יצירת הקטלוג נכשלה');
    } finally {
      setCatalogPdfBusy(false);
    }
  }

  function openCatalogPreview() {
    if (!savedToken) return;
    const url = `/api/admin/catalog-pdf/preview?token=${encodeURIComponent(savedToken)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
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
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={openCatalogPreview}
                  className="text-xs px-3 py-1.5 border border-[#decfa8] rounded-lg bg-white"
                  title="פתיחת הקטלוג בדפדפן לפני הורדת PDF"
                >
                  👁 תצוגה מקדימה
                </button>
                <button
                  type="button"
                  onClick={() => void downloadCatalogPdf()}
                  disabled={catalogPdfBusy}
                  className="text-xs px-3 py-1.5 border border-[#d4af37] rounded-lg bg-[#fff8e8] text-[#8b6508] font-bold disabled:opacity-60"
                  title="ניסיוני — מקומי בלבד עד שתדחפי לפרודקשן"
                >
                  {catalogPdfBusy ? 'מייצר PDF...' : '📥 הורד קטלוג PDF'}
                </button>
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
                      item.id === 'pending_comments');
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
              <div className="space-y-4">
                {(overview.stats.pendingDresses > 0 ||
                  overview.stats.pendingPayments > 0 ||
                  overview.stats.pendingRatings > 0 ||
                  overview.stats.pendingReviews > 0) && (
                  <AdminCollapsibleSection
                    title="דורשות טיפול"
                    count={
                      overview.stats.pendingDresses +
                      overview.stats.pendingPayments +
                      overview.stats.pendingRatings +
                      overview.stats.pendingReviews
                    }
                    defaultOpen={false}
                    tone="alert"
                  >
                    <div className="space-y-4">
                      {overview.stats.pendingDresses > 0 && (
                        <AdminCollapsibleSection
                          title="שמלות ממתינות לאישור"
                          count={overview.stats.pendingDresses}
                          action={
                            <button
                              type="button"
                              onClick={() => navigateTab('pending')}
                              className="text-xs font-bold text-amber-800 underline"
                            >
                              הצג הכל
                            </button>
                          }
                        >
                          <AdminPendingDressesGrid
                            dresses={overview.pendingDresses.slice(0, 16)}
                            token={savedToken}
                            onApprove={(id) => handleAction('dress', id, 'approve')}
                            onRejectRequest={(id, dressName) => openRejectPrompt('dress', id, dressName)}
                            onSaved={bumpRefresh}
                          />
                        </AdminCollapsibleSection>
                      )}

                      {overview.stats.pendingPayments > 0 && (
                        <AdminCollapsibleSection
                          title="ממתינות לאישור תשלום"
                          count={overview.stats.pendingPayments}
                          action={
                            <button
                              type="button"
                              onClick={() => navigateTab('pending_payments')}
                              className="text-xs font-bold text-amber-800 underline"
                            >
                              הצג הכל
                            </button>
                          }
                        >
                          <AdminBookingsGrid
                            bookings={overview.pendingPayments.slice(0, 16)}
                            variant="pending_payment"
                            onApprovePayment={approvePayment}
                          />
                        </AdminCollapsibleSection>
                      )}

                      {(overview.stats.pendingRatings > 0 || overview.stats.pendingReviews > 0) && (
                        <AdminCollapsibleSection
                          title="תגובות ממתינות"
                          count={overview.stats.pendingRatings + overview.stats.pendingReviews}
                          action={
                            <button
                              type="button"
                              onClick={() => navigateTab('pending_comments')}
                              className="text-xs font-bold text-amber-800 underline"
                            >
                              הצג הכל
                            </button>
                          }
                        >
                          <div className="space-y-3 text-xs">
                            {overview.pendingReviews.slice(0, 3).map((review) => (
                              <div key={review.id} className="bg-white rounded-lg p-3 border border-[#eadaaf]">
                                <p className="font-bold">
                                  אתר · {review.name} · {'⭐'.repeat(review.stars)}
                                </p>
                                <p className="italic mt-1 text-[#6e634c]">&quot;{review.text}&quot;</p>
                              </div>
                            ))}
                            {overview.pendingRatings.slice(0, 3).map((rating) => (
                              <div key={rating.id} className="bg-white rounded-lg p-3 border border-[#eadaaf]">
                                <p className="font-bold">
                                  שמלה · {rating.dress_name} · {rating.customer_name} ·{' '}
                                  {'⭐'.repeat(rating.stars)}
                                </p>
                                {rating.review_text && (
                                  <p className="italic mt-1 text-[#6e634c]">&quot;{rating.review_text}&quot;</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </AdminCollapsibleSection>
                      )}
                    </div>
                  </AdminCollapsibleSection>
                )}

                <AdminCollapsibleSection title="הזמנות מאושרות אחרונות">
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
                </AdminCollapsibleSection>

                <AdminCollapsibleSection title="קיצורי דרך">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => navigateTab('catalog')}
                      className="text-right bg-[#fffdf8] border border-[#e6c687] rounded-2xl p-5 hover:shadow-md transition-shadow w-full"
                    >
                      <h3 className="font-black text-[#8b6508] mb-1">קטלוג שמלות</h3>
                      <p className="text-xs text-[#6e634c]">
                        חיפוש, סינון לפי עיר וחשיפה, עימוד — לניהול {overview.stats.published} שמלות
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTab('catalog', 'yes')}
                      className="text-right bg-[#fffdf8] border border-[#e6c687] rounded-2xl p-5 hover:shadow-md transition-shadow w-full"
                    >
                      <h3 className="font-black text-[#8b6508] mb-1">חשיפה מועדפת</h3>
                      <p className="text-xs text-[#6e634c]">
                        {overview.stats.featured} שמלות עם חשיפה מוגברת בקטלוג
                      </p>
                    </button>
                  </div>
                </AdminCollapsibleSection>
              </div>
            )}

            {tab === 'catalog' && savedToken && overview && (
              <AdminDressCatalog
                token={savedToken}
                cities={overview.cities}
                initialFeatured={catalogFeatured}
                refreshKey={refreshKey}
                onAction={(id, action) => handleAction('dress', id, action)}
                onSaved={bumpRefresh}
              />
            )}

            {tab === 'pending' && overview && (
              <section className="space-y-4">
                <h2 className="font-bold text-lg">
                  שמלות ממתינות לאישור ({overview.stats.pendingDresses})
                </h2>
                <AdminPendingDressesGrid
                  dresses={overview.pendingDresses}
                  token={savedToken}
                  onApprove={(id) => handleAction('dress', id, 'approve')}
                  onRejectRequest={(id, dressName) => openRejectPrompt('dress', id, dressName)}
                  onSaved={bumpRefresh}
                />
              </section>
            )}

            {tab === 'pending_payments' && (
              <section className="space-y-4">
                <h2 className="font-bold text-lg">
                  ממתינות לאישור תשלום ({overview?.stats.pendingPayments ?? pendingPaymentsTotal})
                </h2>
                <p className="text-xs text-[#6e634c]">
                  רק הזמנות שהשוכרת דיווחה עליהן תשלום (ביט/העברה) — ממתינות לאישור שלך
                </p>
                {loadingPendingPayments ? (
                  <p className="text-sm">טוען...</p>
                ) : pendingPayments.length === 0 ? (
                  <p className="text-xs text-[#6e634c]">אין הזמנות ממתינות לתשלום 🎉</p>
                ) : (
                  <>
                    <AdminBookingsGrid
                      bookings={pendingPayments}
                      variant="pending_payment"
                      onApprovePayment={approvePayment}
                    />
                    <AdminPagination
                      page={pendingPaymentsPage}
                      totalPages={pendingPaymentsTotalPages}
                      total={pendingPaymentsTotal}
                      limit={48}
                      onPageChange={setPendingPaymentsPage}
                    />
                  </>
                )}
              </section>
            )}

            {tab === 'pending_comments' && savedToken && (
              <AdminPendingComments
                token={savedToken}
                refreshKey={refreshKey}
                onApprove={(type, id) => handleAction(type, id, 'approve')}
                onRejectRequest={(type, id, label, action) => openRejectPrompt(type, id, label, action)}
                onDeleteReview={(id) => handleAction('review', id, 'delete')}
              />
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
                  <>
                    <AdminBookingsGrid bookings={bookings} variant="confirmed" />
                    <AdminPagination
                      page={bookingsPage}
                      totalPages={bookingsTotalPages}
                      total={bookingsTotal}
                      limit={48}
                      onPageChange={setBookingsPage}
                    />
                  </>
                )}
              </section>
            )}
          </div>
        )}
      </main>

      <AdminRejectReasonModal
        open={Boolean(rejectPrompt)}
        title={rejectPrompt?.title || 'דחייה'}
        description={rejectPrompt?.description || ''}
        busy={rejectBusy}
        onCancel={() => {
          if (!rejectBusy) setRejectPrompt(null);
        }}
        onConfirm={confirmReject}
      />

      <SiteFooter />
    </div>
  );
}
