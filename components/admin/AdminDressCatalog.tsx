'use client';

import { useEffect, useState } from 'react';
import AdminCollapsibleSection, { ADMIN_DRESS_GRID_CLASS } from '@/components/admin/AdminCollapsibleSection';
import AdminDressDetailModal from '@/components/admin/AdminDressDetailModal';
import AdminDressEditModal from '@/components/admin/AdminDressEditModal';
import AdminDressGridCard from '@/components/admin/AdminDressGridCard';
import AdminPagination from '@/components/admin/AdminPagination';
import type { AdminDressRow, AdminDressSort } from '@/lib/admin-types';

type AdminDressCatalogProps = {
  token: string;
  cities: string[];
  initialFeatured?: 'all' | 'yes' | 'no';
  onAction: (
    id: number,
    action: 'delete' | 'toggle_featured' | 'extend_featured'
  ) => Promise<boolean>;
  refreshKey?: number;
  onSaved?: () => void;
};

export default function AdminDressCatalog({
  token,
  cities,
  initialFeatured = 'all',
  onAction,
  refreshKey = 0,
  onSaved,
}: AdminDressCatalogProps) {
  const [items, setItems] = useState<AdminDressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(48);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState<AdminDressSort>('newest');
  const [city, setCity] = useState('');
  const [featured, setFeatured] = useState<'all' | 'yes' | 'no'>(initialFeatured);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [detailDress, setDetailDress] = useState<AdminDressRow | null>(null);
  const [editingDress, setEditingDress] = useState<AdminDressRow | null>(null);

  useEffect(() => {
    setFeatured(initialFeatured);
    setPage(1);
  }, [initialFeatured]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          view: 'dresses',
          page: String(page),
          limit: String(limit),
          sort,
        });
        if (search) params.set('search', search);
        if (city) params.set('city', city);
        if (featured !== 'all') params.set('featured', featured);

        const response = await fetch(`/api/admin?${params}`, {
          headers: { 'x-admin-token': token },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'שגיאה');
        if (cancelled) return;
        setItems(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'שגיאה');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token, page, limit, search, sort, city, featured, refreshKey]);

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function runAction(id: number, action: 'delete' | 'toggle_featured' | 'extend_featured') {
    setBusyId(id);
    const ok = await onAction(id, action);
    setBusyId(null);
    if (ok) {
      if (action === 'delete') setDetailDress((prev) => (prev?.id === id ? null : prev));
      setItems((prev) =>
        action === 'delete'
          ? prev.filter((d) => d.id !== id)
          : prev.map((d) => {
              if (d.id !== id) return d;
              if (action === 'toggle_featured') {
                const nextBoost = (d.featured_boost || 0) > 0 ? 0 : 50;
                return { ...d, featured_boost: nextBoost };
              }
              return d;
            })
      );
      setTotal((t) => (action === 'delete' ? Math.max(0, t - 1) : t));
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#eadaaf] p-4 space-y-3">
        <form onSubmit={applySearch} className="flex flex-col sm:flex-row gap-2">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="חיפוש לפי שם, משכירה, עיר, טלפון או מספר..."
            className="flex-1 p-2.5 border border-[#decfa8] rounded-xl text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#2c261a] text-white rounded-xl text-sm font-bold shrink-0"
          >
            חפשי
          </button>
          {(search || city || featured !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setCity('');
                setFeatured('all');
                setPage(1);
              }}
              className="px-4 py-2.5 border border-[#decfa8] rounded-xl text-sm shrink-0"
            >
              נקי
            </button>
          )}
        </form>

        <div className="flex flex-wrap gap-2">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as AdminDressSort);
              setPage(1);
            }}
            className="text-xs border border-[#decfa8] rounded-lg px-2 py-2 bg-[#fffdf8]"
          >
            <option value="newest">חדשות ראשונות</option>
            <option value="oldest">ישנות ראשונות</option>
            <option value="name">לפי שם</option>
            <option value="price_asc">מחיר: נמוך → גבוה</option>
            <option value="price_desc">מחיר: גבוה → נמוך</option>
            <option value="rentals">לפי השכרות</option>
          </select>

          <select
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-[#decfa8] rounded-lg px-2 py-2 bg-[#fffdf8]"
          >
            <option value="">כל הערים</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={featured}
            onChange={(e) => {
              setFeatured(e.target.value as 'all' | 'yes' | 'no');
              setPage(1);
            }}
            className="text-xs border border-[#decfa8] rounded-lg px-2 py-2 bg-[#fffdf8]"
          >
            <option value="all">כל השמלות</option>
            <option value="yes">רק חשיפה מועדפת</option>
            <option value="no">ללא חשיפה מועדפת</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
      )}

      <div className="bg-white rounded-2xl border border-[#eadaaf] overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-[#6e634c]">טוען שמלות...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-[#6e634c]">לא נמצאו שמלות לפי הסינון</p>
        ) : (
          <>
            <div className={ADMIN_DRESS_GRID_CLASS}>
              {items.map((dress) => {
                const isFeatured = (dress.featured_boost || 0) > 0;
                const disabled = busyId === dress.id;

                return (
                  <AdminDressGridCard
                    key={dress.id}
                    dress={dress}
                    disabled={disabled}
                    onSelect={() => setDetailDress(dress)}
                    badge={
                      isFeatured ? (
                        <span className="text-[8px] font-bold text-[#8b6508] bg-[#fff8e8] px-1 py-0.5 rounded-full shrink-0">
                          ★
                        </span>
                      ) : undefined
                    }
                  />
                );
              })}
            </div>

            {detailDress && (
              <AdminDressDetailModal
                dress={detailDress}
                subtitle="קטלוג — שמלה מאושרת"
                onClose={() => setDetailDress(null)}
              >
                <p className="w-full text-xs text-[#8b6508] mb-1">
                  {(detailDress.featured_boost || 0) > 0 ? 'חשיפה מועדפת פעילה' : 'ללא חשיפה מועדפת'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingDress(detailDress);
                    setDetailDress(null);
                  }}
                  className="px-3 py-2 text-sm rounded-xl border border-[#d4af37] text-[#8b6508] font-bold"
                >
                  ✏️ עריכה
                </button>
                <button
                  type="button"
                  disabled={busyId === detailDress.id}
                  onClick={() => runAction(detailDress.id, 'toggle_featured')}
                  className="px-3 py-2 text-sm rounded-xl border border-[#decfa8] font-bold disabled:opacity-50"
                >
                  {(detailDress.featured_boost || 0) > 0 ? 'בטל חשיפה מועדפת' : 'הפעל חשיפה מועדפת'}
                </button>
                <button
                  type="button"
                  disabled={busyId === detailDress.id}
                  onClick={() => runAction(detailDress.id, 'extend_featured')}
                  className="px-3 py-2 text-sm rounded-xl border border-[#decfa8] disabled:opacity-50"
                >
                  הארכת חשיפה +30 יום
                </button>
                <button
                  type="button"
                  disabled={busyId === detailDress.id}
                  onClick={() => runAction(detailDress.id, 'delete')}
                  className="px-3 py-2 text-sm rounded-xl bg-red-600 text-white font-bold disabled:opacity-50"
                >
                  הסר מהאתר
                </button>
              </AdminDressDetailModal>
            )}

            {editingDress && (
              <AdminDressEditModal
                dressId={editingDress.id}
                dressName={editingDress.name}
                token={token}
                onClose={() => setEditingDress(null)}
                onSaved={() => {
                  setEditingDress(null);
                  onSaved?.();
                }}
              />
            )}

            <div className="p-4 border-t border-[#eadaaf]">
              <AdminPagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(next) => {
                  setLimit(next);
                  setPage(1);
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
