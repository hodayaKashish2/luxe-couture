'use client';

import { useMemo, useState } from 'react';
import DressCalendar from '@/components/DressCalendar';

export type OwnerRentalDress = {
  id: string;
  name: string;
  price: number;
  size: string;
  city: string;
  status: string;
  images: string[];
  rental_count: number;
  booked_dates: string[];
};

export type OwnerBookingRow = {
  id: number;
  dress_id: number;
  dress_name: string;
  customer_name?: string;
  customer_phone?: string;
  event_date: string;
  status: string;
};

const DRESS_STATUS: Record<string, string> = {
  approved: 'מפורסמת ✓',
  pending: 'ממתינה לאישור',
  removed: 'הוסרה',
};

const BOOKING_STATUS: Record<string, string> = {
  confirmed: 'הזמנה מאושרת ✓',
  pending_payment: 'ממתין לתשלום',
};

type DressFilter = 'all' | 'available' | 'booked' | 'pending';
type DressSort = 'recent' | 'name' | 'bookings' | 'rentals';

const PAGE_SIZE = 15;

function getDressBookings(dressId: string, bookings: OwnerBookingRow[]) {
  return bookings.filter((b) => String(b.dress_id) === String(dressId));
}

function getDressRentalSummary(bookings: OwnerBookingRow[]) {
  const confirmed = bookings.filter((b) => b.status === 'confirmed');
  const pending = bookings.filter((b) => b.status === 'pending_payment');
  if (confirmed.length === 0 && pending.length === 0) {
    return { badge: '🟢 פנויה', detail: '', hasBookings: false };
  }
  if (confirmed.length > 0) {
    const sorted = [...confirmed].sort((a, b) => a.event_date.localeCompare(b.event_date));
    const next = sorted.find((b) => b.event_date >= new Date().toISOString().slice(0, 10)) || sorted[0];
    return {
      badge: `📅 ${confirmed.length} הזמנ${confirmed.length === 1 ? 'ה' : 'ות'}`,
      detail: next ? `הבאה: ${next.event_date}` : '',
      hasBookings: true,
    };
  }
  return {
    badge: `⏳ ${pending.length} ממתינות`,
    detail: 'ממתין לתשלום',
    hasBookings: true,
  };
}

function formatHebrewDate(date: string) {
  try {
    return new Date(`${date}T00:00:00`).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return date;
  }
}

type Props = {
  dresses: OwnerRentalDress[];
  ownerBookings: OwnerBookingRow[];
  loading: boolean;
  selectedDressId: string | null;
  onSelectDress: (dressId: string | null) => void;
  onAddDress: () => void;
  onEditDress: (dress: OwnerRentalDress) => void;
};

export default function OwnerDressesPanel({
  dresses,
  ownerBookings,
  loading,
  selectedDressId,
  onSelectDress,
  onAddDress,
  onEditDress,
}: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<DressFilter>('all');
  const [sort, setSort] = useState<DressSort>('recent');
  const [page, setPage] = useState(1);
  const [showUpcoming, setShowUpcoming] = useState(true);

  const dressesWithBookings = useMemo(
    () =>
      dresses.filter((d) =>
        ownerBookings.some((b) => String(b.dress_id) === String(d.id))
      ).length,
    [dresses, ownerBookings]
  );

  const upcomingBookings = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...ownerBookings]
      .filter((b) => b.event_date >= today && b.status !== 'cancelled')
      .sort((a, b) => a.event_date.localeCompare(b.event_date))
      .slice(0, 8);
  }, [ownerBookings]);

  const filteredDresses = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = dresses.filter((d) => {
      if (!query) return true;
      return (
        d.name.toLowerCase().includes(query) ||
        d.city.toLowerCase().includes(query) ||
        d.size.toLowerCase().includes(query)
      );
    });

    list = list.filter((d) => {
      const bookings = getDressBookings(d.id, ownerBookings);
      const hasBookings = bookings.length > 0;
      if (filter === 'available') return !hasBookings && d.status === 'approved';
      if (filter === 'booked') return hasBookings;
      if (filter === 'pending') return d.status === 'pending';
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'he');
      if (sort === 'rentals') return b.rental_count - a.rental_count;
      if (sort === 'bookings') {
        const aCount = getDressBookings(a.id, ownerBookings).length;
        const bCount = getDressBookings(b.id, ownerBookings).length;
        return bCount - aCount;
      }
      return 0;
    });

    return list;
  }, [dresses, ownerBookings, search, filter, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredDresses.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedDresses = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredDresses.slice(start, start + PAGE_SIZE);
  }, [filteredDresses, safePage]);

  const selectedDress = selectedDressId
    ? dresses.find((d) => d.id === selectedDressId) ?? null
    : null;

  const selectedBookings = selectedDress
    ? getDressBookings(selectedDress.id, ownerBookings)
    : [];
  const selectedConfirmedDates = selectedBookings
    .filter((b) => b.status === 'confirmed')
    .map((b) => b.event_date);

  const filterChips: { id: DressFilter; label: string }[] = [
    { id: 'all', label: 'הכל' },
    { id: 'available', label: 'פנויות' },
    { id: 'booked', label: 'עם הזמנות' },
    { id: 'pending', label: 'ממתינות לאישור' },
  ];

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleFilterChange(next: DressFilter) {
    setFilter(next);
    setPage(1);
  }

  function handleSelectDress(dressId: string) {
    onSelectDress(selectedDressId === dressId ? null : dressId);
  }

  if (loading) {
    return <p className="text-sm text-[#6e634c] animate-pulse">טוען שמלות...</p>;
  }

  if (dresses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#eadaaf] p-8 text-center space-y-4">
        <p className="text-sm text-[#6e634c]">אין שמלות. הוסיפי שמלה חדשה!</p>
        <button
          type="button"
          onClick={onAddDress}
          className="px-4 py-2 bg-[#b8860b] text-white rounded-xl text-xs font-bold"
        >
          ➕ הוספת שמלה
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h2 className="font-black text-xl">👗 השמלות שלי</h2>
          <p className="text-xs text-[#6e634c] mt-1 leading-relaxed max-w-lg">
            רשימה מסודרת לניהול הרבה שמלות — בחרי שמלה לראות לוח שנה והזמנות.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddDress}
          className="px-4 py-2 bg-[#b8860b] text-white rounded-xl text-xs font-bold shrink-0"
        >
          ➕ הוספת שמלה
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white rounded-xl border border-[#eadaaf] p-3">
          <p className="text-lg font-black text-[#3d2f24]">{dresses.length}</p>
          <p className="text-[10px] text-[#6e634c]">שמלות</p>
        </div>
        <div className="bg-white rounded-xl border border-[#eadaaf] p-3">
          <p className="text-lg font-black text-green-700">{dresses.length - dressesWithBookings}</p>
          <p className="text-[10px] text-[#6e634c]">פנויות</p>
        </div>
        <div className="bg-white rounded-xl border border-[#eadaaf] p-3">
          <p className="text-lg font-black text-[#b8860b]">{dressesWithBookings}</p>
          <p className="text-[10px] text-[#6e634c]">עם הזמנות</p>
        </div>
      </div>

      {upcomingBookings.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#eadaaf] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowUpcoming((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 text-xs font-black text-[#8b6508] bg-[#fffdf8] hover:bg-[#faf8f3]"
          >
            <span>📌 הזמנות קרובות ({upcomingBookings.length})</span>
            <span>{showUpcoming ? '▲' : '▼'}</span>
          </button>
          {showUpcoming && (
            <ul className="divide-y divide-[#f0e6cc] max-h-48 overflow-y-auto">
              {upcomingBookings.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => onSelectDress(String(b.dress_id))}
                    className="w-full text-right px-4 py-2.5 hover:bg-[#fffdf8] transition-colors flex justify-between gap-2 items-center"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#3d2f24] truncate">{b.dress_name}</p>
                      <p className="text-[10px] text-[#8b6508]">
                        {formatHebrewDate(b.event_date)} · {b.customer_name || 'שוכרת'}
                      </p>
                    </div>
                    <span className="text-[9px] shrink-0 bg-[#f4ebd4] px-2 py-0.5 rounded-full">
                      {BOOKING_STATUS[b.status] || b.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#eadaaf] p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="חיפוש לפי שם, עיר או מידה..."
            className="flex-1 p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs text-[#2c261a] placeholder:text-[#9a7b4f] focus:outline-none focus:border-[#d4af37]"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as DressSort)}
            className="p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs text-[#2c261a] sm:w-40"
            aria-label="מיון שמלות"
          >
            <option value="recent">חדשות ראשון</option>
            <option value="name">לפי שם</option>
            <option value="bookings">לפי הזמנות</option>
            <option value="rentals">לפי השכרות</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleFilterChange(chip.id)}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-colors ${
                filter === chip.id
                  ? 'bg-[#d4af37] text-white border-[#d4af37]'
                  : 'bg-white text-[#8b6508] border-[#decfa8] hover:bg-[#fffdf8]'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <p className="text-[10px] text-[#9a7b4f]">
          {filteredDresses.length} שמלות
          {search || filter !== 'all' ? ' (מסוננות)' : ''}
          {filteredDresses.length > PAGE_SIZE && ` · עמוד ${safePage} מתוך ${totalPages}`}
        </p>
      </div>

      <div className={`lg:grid lg:gap-4 ${selectedDress ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]' : 'lg:grid-cols-1'}`}>
        <div className={`space-y-2 ${selectedDress ? 'hidden lg:block' : ''}`}>
          {paginatedDresses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#eadaaf] p-6 text-center text-sm text-[#6e634c]">
              אין שמלות שתואמות את החיפוש
            </div>
          ) : (
            paginatedDresses.map((dress) => {
              const dressBookings = getDressBookings(dress.id, ownerBookings);
              const summary = getDressRentalSummary(dressBookings);
              const isSelected = selectedDressId === dress.id;
              return (
                <button
                  key={dress.id}
                  type="button"
                  onClick={() => handleSelectDress(dress.id)}
                  className={`w-full text-right bg-white rounded-xl border p-3 flex gap-3 items-center transition-all hover:shadow-sm ${
                    isSelected
                      ? 'border-[#d4af37] ring-2 ring-[#d4af37]/30 bg-[#fffdf8]'
                      : 'border-[#eadaaf] hover:border-[#decfa8]'
                  }`}
                >
                  {dress.images?.[0] ? (
                    <img
                      src={dress.images[0]}
                      alt=""
                      className="w-12 h-14 object-contain rounded-lg border border-[#f0e2c3] bg-[#faf8f3] shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-14 rounded-lg border border-dashed border-[#decfa8] bg-[#faf8f3] flex items-center justify-center text-lg shrink-0">
                      👗
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#3d2f24] truncate">{dress.name}</p>
                    <p className="text-[10px] text-[#6e634c] mt-0.5">
                      ₪{dress.price} · {dress.size} · {dress.city}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span className="text-[9px] bg-[#f4ebd4] px-1.5 py-0.5 rounded-full">
                        {DRESS_STATUS[dress.status] || dress.status}
                      </span>
                      <span className="text-[9px] font-bold text-[#8b6508]">{summary.badge}</span>
                      {summary.detail && (
                        <span className="text-[9px] text-[#9a7b4f]">{summary.detail}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[#b8860b] text-xs shrink-0">‹</span>
                </button>
              );
            })
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-[10px] font-bold border border-[#decfa8] rounded-lg disabled:opacity-40"
              >
                הקודם
              </button>
              <span className="text-[10px] text-[#6e634c]">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-[10px] font-bold border border-[#decfa8] rounded-lg disabled:opacity-40"
              >
                הבא
              </button>
            </div>
          )}
        </div>

        {selectedDress ? (
          <div className="bg-white rounded-2xl border border-[#eadaaf] p-4 sm:p-5 space-y-4 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto">
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => onSelectDress(null)}
                className="lg:hidden text-[10px] font-bold text-[#8b6508] hover:underline shrink-0"
              >
                ← חזרה לרשימה
              </button>
              <button
                type="button"
                onClick={() => onEditDress(selectedDress)}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#decfa8] text-[#8b6508] hover:bg-[#fffdf8] shrink-0"
              >
                ✏️ עדכון
              </button>
            </div>

            <div className="flex gap-4">
              {selectedDress.images?.[0] ? (
                <img
                  src={selectedDress.images[0]}
                  alt=""
                  className="w-24 h-28 object-contain rounded-xl border border-[#f0e2c3] bg-[#faf8f3] shrink-0"
                />
              ) : (
                <div className="w-24 h-28 rounded-xl border border-dashed border-[#decfa8] bg-[#faf8f3] flex items-center justify-center text-3xl shrink-0">
                  👗
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-bold text-lg text-[#3d2f24]">{selectedDress.name}</h3>
                <p className="text-xs text-[#6e634c] mt-1">
                  ₪{selectedDress.price} · מידה {selectedDress.size} · {selectedDress.city}
                </p>
                {selectedDress.rental_count > 0 && (
                  <p className="text-[10px] text-[#9a7b4f] mt-1">
                    {selectedDress.rental_count} השכרות עד כה
                  </p>
                )}
                <span className="inline-block mt-2 text-[10px] bg-[#f4ebd4] px-2 py-0.5 rounded-full">
                  {DRESS_STATUS[selectedDress.status] || selectedDress.status}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-black text-[#8b6508] mb-2">לוח שנה — תאריכים תפוסים</h4>
              <DressCalendar bookedDates={selectedConfirmedDates} compact />
            </div>

            <div>
              <h4 className="text-xs font-black text-[#8b6508] mb-2">
                הזמנות ({selectedBookings.length})
              </h4>
              {selectedBookings.length === 0 ? (
                <p className="text-xs text-[#9a7b4f] bg-[#faf8f3] rounded-xl border border-dashed border-[#decfa8] px-4 py-3 text-center">
                  אין הזמנות — השמלה פנויה להשכרה
                </p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedBookings.map((b) => (
                    <li
                      key={b.id}
                      className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-l from-[#fffdf8] to-[#f4ebd4] border border-[#decfa8] rounded-xl px-3 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-bold text-[#3d2f24]">
                          {b.customer_name || 'שוכרת'}
                        </p>
                        <p className="text-xs text-[#8b6508] font-bold mt-0.5">📅 {b.event_date}</p>
                        {b.customer_phone && (
                          <a
                            href={`tel:${b.customer_phone}`}
                            className="text-[11px] text-[#6e634c] mt-0.5 inline-block hover:underline"
                          >
                            📞 {b.customer_phone}
                          </a>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                          b.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {BOOKING_STATUS[b.status] || b.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex bg-[#faf8f3] rounded-2xl border border-dashed border-[#decfa8] p-8 items-center justify-center text-center min-h-[16rem]">
            <div>
              <p className="text-3xl mb-2">👗</p>
              <p className="text-sm font-bold text-[#3d2f24]">בחרי שמלה מהרשימה</p>
              <p className="text-xs text-[#9a7b4f] mt-1 max-w-xs">
                לוח שנה והזמנות יוצגו כאן — רק לשמלה שנבחרה
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
