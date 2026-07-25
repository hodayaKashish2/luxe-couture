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
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState<AdminDressSort>('newest');
  const [city, setCity] = useState('');
  const [featured, setFeatured] = useState<'all' | 'yes' | 'no'>(initialFeatured);
  const [busyId, setBusyId] = useState<number | null>(null);

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
            placeholder="חיפוש לפי שם, משכירה, עיר או מספר..."
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
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#fffdf8] border-b border-[#eadaaf] text-xs text-[#6e634c]">
                  <tr>
                    <th className="p-3 text-right font-bold w-14">#</th>
                    <th className="p-3 text-right font-bold w-16">תמונה</th>
                    <th className="p-3 text-right font-bold">שם</th>
                    <th className="p-3 text-right font-bold">מחיר</th>
                    <th className="p-3 text-right font-bold">מידה</th>
                    <th className="p-3 text-right font-bold">עיר</th>
                    <th className="p-3 text-right font-bold">משכירה</th>
                    <th className="p-3 text-right font-bold">חשיפה</th>
                    <th className="p-3 text-right font-bold min-w-[220px]">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((dress) => {
                    const isFeatured = (dress.featured_boost || 0) > 0;
                    const disabled = busyId === dress.id;
                    return (
                      <tr key={dress.id} className="border-b border-[#f0e8d0] hover:bg-[#fffdf8]">
                        <td className="p-3 text-xs text-[#9a7b4f]">{dress.id}</td>
                        <td className="p-3">
                          {dress.images?.[0] ? (
                            <DressImageFill
                              src={dress.images[0]}
                              alt=""
                              className="w-12 h-16 rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-16 rounded-lg bg-[#f5efe0]" />
                          )}
                        </td>
                        <td className="p-3 font-bold text-[#3d2f24] max-w-[180px]">
                          <span className="line-clamp-2">{dress.name}</span>
                        </td>
                        <td className="p-3 whitespace-nowrap">₪{dress.price}</td>
                        <td className="p-3">{dress.size || '—'}</td>
                        <td className="p-3">{dress.city || '—'}</td>
                        <td className="p-3 max-w-[120px]">
                          <span className="line-clamp-1">{dress.owner_name || '—'}</span>
                        </td>
                        <td className="p-3">
                          {isFeatured ? (
                            <span className="text-[10px] font-bold text-[#8b6508] bg-[#fff8e8] px-2 py-1 rounded-full">
                              מועדפת
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#9a7b4f]">רגילה</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => runAction(dress.id, 'toggle_featured')}
                              className="px-2 py-1 text-[10px] rounded-lg border border-[#decfa8] font-bold disabled:opacity-50"
                            >
                              {isFeatured ? 'בטל חשיפה' : 'חשיפה'}
                            </button>
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => runAction(dress.id, 'extend_featured')}
                              className="px-2 py-1 text-[10px] rounded-lg border border-[#decfa8] disabled:opacity-50"
                            >
                              +30 יום
                            </button>
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => runAction(dress.id, 'delete')}
                              className="px-2 py-1 text-[10px] rounded-lg bg-red-600 text-white font-bold disabled:opacity-50"
                            >
                              הסר
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-[#f0e8d0]">
              {items.map((dress) => {
                const isFeatured = (dress.featured_boost || 0) > 0;
                const disabled = busyId === dress.id;
                return (
                  <div key={dress.id} className="p-4 flex gap-3">
                    {dress.images?.[0] && (
                      <DressImageFill src={dress.images[0]} alt="" className="w-14 h-18 rounded-lg shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm line-clamp-2">{dress.name}</p>
                      <p className="text-[10px] text-[#6e634c] mt-1">
                        #{dress.id} · ₪{dress.price} · {dress.size} · {dress.city}
                      </p>
                      <p className="text-[10px] text-[#6e634c]">{dress.owner_name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => runAction(dress.id, 'toggle_featured')}
                          className="px-2 py-1 text-[10px] rounded-lg border border-[#decfa8] font-bold"
                        >
                          {isFeatured ? 'בטל חשיפה' : 'חשיפה'}
                        </button>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => runAction(dress.id, 'delete')}
                          className="px-2 py-1 text-[10px] rounded-lg bg-red-600 text-white font-bold"
                        >
                          הסר
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4">
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
