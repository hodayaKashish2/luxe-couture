'use client';

import { useEffect, useState } from 'react';
import DressImageFill from '@/components/DressImageFill';
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
};

export default function AdminDressCatalog({
  token,
  cities,
  initialFeatured = 'all',
  onAction,
  refreshKey = 0,
}: AdminDressCatalogProps) {
  const [items, setItems] = useState<AdminDressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(40);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState<AdminDressSort>('newest');
  const [city, setCity] = useState('');
  const [featured, setFeatured] = useState<'all' | 'yes' | 'no'>(initialFeatured);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
      if (action === 'delete') {
        setExpandedId((prev) => (prev === id ? null : prev));
      }
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
              {items.map((dress) => {
                const isFeatured = (dress.featured_boost || 0) > 0;
                const isOpen = expandedId === dress.id;
                const disabled = busyId === dress.id;

                return (
                  <div
                    key={dress.id}
                    className={`border rounded-xl overflow-hidden transition-shadow ${
                      isOpen ? 'border-[#d4af37] shadow-md' : 'border-[#eadaaf]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : dress.id)}
                      className="w-full p-3 text-right hover:bg-[#fffdf8] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] text-[#9a7b4f] shrink-0 mt-0.5">
                          {isOpen ? '▲' : '▼'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-[#3d2f24] line-clamp-2 leading-snug">
                            {dress.name}
                          </p>
                          <p className="text-xs font-black text-[#8b6508] mt-1">₪{dress.price}</p>
                          <p className="text-[11px] text-[#6e634c] mt-0.5" dir="ltr">
                            {dress.owner_phone || '—'}
                          </p>
                        </div>
                        {isFeatured && (
                          <span className="text-[9px] font-bold text-[#8b6508] bg-[#fff8e8] px-1.5 py-0.5 rounded-full shrink-0">
                            ★
                          </span>
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-3 pb-3 pt-0 border-t border-[#f0e8d0] bg-[#fffdf8] space-y-2">
                        {dress.images?.[0] && (
                          <DressImageFill
                            src={dress.images[0]}
                            alt=""
                            className="w-full h-28 rounded-lg mt-2"
                          />
                        )}
                        <p className="text-[10px] text-[#6e634c]">
                          #{dress.id} · {dress.size || '—'} · {dress.city || '—'}
                        </p>
                        <p className="text-[10px] text-[#6e634c]">משכירה: {dress.owner_name || '—'}</p>
                        <p className="text-[10px] text-[#8b6508]">
                          {isFeatured ? 'חשיפה מועדפת פעילה' : 'ללא חשיפה מועדפת'}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => runAction(dress.id, 'toggle_featured')}
                            className="px-2 py-1.5 text-[10px] rounded-lg border border-[#decfa8] font-bold disabled:opacity-50"
                          >
                            {isFeatured ? 'בטלי חשיפה' : 'הפעילי חשיפה'}
                          </button>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => runAction(dress.id, 'extend_featured')}
                            className="px-2 py-1.5 text-[10px] rounded-lg border border-[#decfa8] disabled:opacity-50"
                          >
                            +30 יום
                          </button>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => runAction(dress.id, 'delete')}
                            className="px-2 py-1.5 text-[10px] rounded-lg bg-red-600 text-white font-bold disabled:opacity-50"
                          >
                            הסרי מהאתר
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

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
