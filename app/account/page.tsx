'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import SavedDressList from '@/components/SavedDressList';
import { useLuxeStorage } from '@/components/LuxeStorageProvider';
import DressCalendar from '@/components/DressCalendar';
import OwnerPlatformNotice from '@/components/OwnerPlatformNotice';
import { BOOKING_UPDATED_EVENT } from '@/lib/booking-events';
import { getStoredSiteUser } from '@/lib/session-user';

type Section = 'hub' | 'reservations' | 'rentals' | 'cart' | 'favorites' | 'add';

type RentalDress = {
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

type BookingRow = {
  id: number;
  dress_id: number;
  dress_name: string;
  customer_name?: string;
  customer_phone?: string;
  event_date: string;
  status: string;
};

const STATUS: Record<string, string> = {
  approved: 'מפורסמת ✓',
  pending: 'ממתינה לאישור',
  removed: 'הוסרה',
  confirmed: 'שריון מאושר ✓',
  pending_payment: 'ממתין לתשלום',
};

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, favorites, cartCount, favCount, removeFromCart, removeFromFavorites } = useLuxeStorage();
  const [section, setSection] = useState<Section>('hub');
  const [user, setUser] = useState<{ displayName: string; username: string } | null>(() => {
    const stored = getStoredSiteUser();
    if (!stored) return null;
    return {
      displayName: stored.displayName || stored.display_name || '',
      username: stored.username || '',
    };
  });
  const [dresses, setDresses] = useState<RentalDress[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<BookingRow[]>([]);
  const [reservations, setReservations] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [addFiles, setAddFiles] = useState<File[]>([]);
  const [addImagePreviews, setAddImagePreviews] = useState<string[]>([]);
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const [addForm, setAddForm] = useState({
    name: '', price: '', size: '', city: 'ירושלים', color: '', event_type: '',
    deposit: '', pickup_method: 'pickup', includes_dry_cleaning: 'no', condition: 'new', description: '',
  });

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const token = sessionStorage.getItem('site_token');
    if (!token) return;
    if (!opts?.silent) setLoading(true);
    const stored = sessionStorage.getItem('site_user');
    if (stored) setUser(JSON.parse(stored));

    const res = await fetch('/api/user/dashboard', {
      headers: { 'x-user-token': token },
      cache: 'no-store',
    });
    const data = await res.json();
    if (res.ok) {
      setDresses(data.rentals?.dresses || []);
      setOwnerBookings(data.rentals?.bookings || []);
      setReservations(data.reservations || []);
      if (data.user) {
        setUser({ displayName: data.user.displayName, username: data.user.username });
      }
      setDataReady(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const onBookingUpdate = () => load({ silent: true });
    const onFocus = () => load({ silent: true });
    window.addEventListener(BOOKING_UPDATED_EVENT, onBookingUpdate);
    window.addEventListener('focus', onFocus);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') load({ silent: true });
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener(BOOKING_UPDATED_EVENT, onBookingUpdate);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [load]);

  useEffect(() => {
    if (section === 'reservations' || section === 'rentals') {
      load({ silent: true });
    }
  }, [section, load]);

  useEffect(() => {
    const tab = searchParams.get('section');
    if (tab === 'cart' || tab === 'favorites' || tab === 'reservations' || tab === 'rentals' || tab === 'add') {
      setSection(tab);
    }
  }, [searchParams]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    sessionStorage.clear();
    router.replace('/login');
  }

  async function submitDress(e: React.FormEvent) {
    e.preventDefault();
    if (addFiles.length === 0) {
      alert('יש להעלות לפחות תמונה אחת של השמלה');
      return;
    }
    const token = sessionStorage.getItem('site_token');
    const formData = new FormData();
    Object.entries(addForm).forEach(([k, v]) => formData.append(k, v));
    addFiles.forEach((f) => formData.append('images', f));

    const res = await fetch('/api/owner/dresses', {
      method: 'POST',
      headers: { 'x-user-token': token || '' },
      body: formData,
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      setAddFiles([]);
      addImagePreviews.forEach((url) => URL.revokeObjectURL(url));
      setAddImagePreviews([]);
      if (addFileInputRef.current) addFileInputRef.current.value = '';
      setSection('rentals');
      load();
    } else alert(data.error || 'שגיאה');
  }

  function handleAddImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setAddFiles((prev) => [...prev, ...files]);
    setAddImagePreviews((prev) => [...prev, ...previews]);
  }

  function removeAddImage(index: number) {
    URL.revokeObjectURL(addImagePreviews[index]);
    setAddFiles((prev) => prev.filter((_, i) => i !== index));
    setAddImagePreviews((prev) => prev.filter((_, i) => i !== index));
    if (addFileInputRef.current) addFileInputRef.current.value = '';
  }

  const reservationDates = reservations
    .filter((r) => r.status === 'confirmed')
    .map((r) => r.event_date);

  const pendingReservations = reservations.filter((r) => r.status === 'pending_payment').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf8f0] to-[#e8dcbd] text-[#332c1e]" dir="rtl">
      <SiteHeader />

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 w-full min-w-0">
        <div className="flex flex-wrap justify-between items-start gap-3 mb-8">
          <div>
            <p className="text-[10px] tracking-widest text-[#9a7b4f] font-bold">✦ האזור האישי ✦</p>
            <h1 className="font-[family-name:var(--font-luxury)] text-2xl sm:text-3xl text-[#3d2f24]">
              שלום, {user?.displayName || (loading ? '...' : 'אורחת')}
            </h1>
          </div>
          <button onClick={logout} className="text-xs text-red-600 font-bold hover:underline">
            התנתקות
          </button>
        </div>

        {section === 'hub' && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={() => setSection('reservations')}
                className="text-right p-6 rounded-2xl border-2 border-[#decfa8] bg-white hover:border-[#d4af37] hover:shadow-lg transition-all group"
              >
                <span className="text-3xl">📅</span>
                <h2 className="font-black text-lg mt-3 text-[#3d2f24] group-hover:text-[#b8860b]">השריונות שלי</h2>
                <p className="text-xs text-[#6e634c] mt-1 leading-relaxed">
                  שמלות ששריינת — לוח שנה ופרטי האירועים שלך
                </p>
                <p className="text-[10px] text-[#b8860b] font-bold mt-3">
                  {!dataReady ? (
                    <span className="text-[#9a7b4f] animate-pulse">טוען...</span>
                  ) : (
                    <>
                      {reservations.length} שריונות
                      {pendingReservations > 0 && ` · ${pendingReservations} ממתינים`}
                    </>
                  )}
                </p>
              </button>

              <button
                onClick={() => setSection('rentals')}
                className="text-right p-6 rounded-2xl border-2 border-[#decfa8] bg-white hover:border-[#d4af37] hover:shadow-lg transition-all group"
              >
                <span className="text-3xl">👗</span>
                <h2 className="font-black text-lg mt-3 text-[#3d2f24] group-hover:text-[#b8860b]">ההשכרות שלי</h2>
                <p className="text-xs text-[#6e634c] mt-1 leading-relaxed">
                  השמלות שפרסמת — עריכה, לוח שריונות והוספת שמלה
                </p>
                <p className="text-[10px] text-[#b8860b] font-bold mt-3">
                  {!dataReady ? (
                    <span className="text-[#9a7b4f] animate-pulse">טוען...</span>
                  ) : (
                    <>
                      {dresses.length} שמלות
                      {ownerBookings.length > 0 && ` · ${ownerBookings.length} שריונות נכנסו`}
                    </>
                  )}
                </p>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'cart' as Section, icon: '🛍️', label: 'סל קניות', count: cartCount },
                { id: 'favorites' as Section, icon: '❤️', label: 'מועדפים', count: favCount },
                { id: 'add' as Section, icon: '➕', label: 'הוספת שמלה', count: null },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className="p-4 rounded-xl border border-[#eadaaf] bg-white/90 hover:bg-[#fffdf8] text-center"
                >
                  <span className="text-xl">{item.icon}</span>
                  <p className="text-[11px] font-bold mt-1 text-[#8b6508]">{item.label}</p>
                  {item.count !== null && (
                    <p className="text-[10px] text-[#9a7b4f]">{item.count}</p>
                  )}
                </button>
              ))}
              <Link
                href="/"
                className="p-4 rounded-xl border border-[#eadaaf] bg-gradient-to-b from-[#fffdf8] to-[#f4ebd4] hover:shadow text-center flex flex-col items-center justify-center"
              >
                <span className="text-xl">🏠</span>
                <p className="text-[11px] font-bold mt-1 text-[#8b6508]">לקטלוג</p>
              </Link>
            </div>
          </div>
        )}

        {section !== 'hub' && (
          <button
            onClick={() => setSection('hub')}
            className="mb-4 text-xs text-[#8b6508] font-bold hover:underline"
          >
            ← חזרה לאזור האישי
          </button>
        )}

        {section === 'reservations' && (
          <div className="space-y-6">
            <h2 className="font-black text-xl">📅 השריונות שלי</h2>
            {loading ? (
              <p className="text-sm">טוען...</p>
            ) : reservations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#eadaaf] p-8 text-center">
                <p className="text-sm text-[#6e634c]">עדיין אין שריונות. מצאי שמלה בקטלוג!</p>
                <Link href="/" className="inline-block mt-4 px-4 py-2 bg-[#b8860b] text-white rounded-xl text-xs font-bold">
                  לקטלוג →
                </Link>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl border border-[#eadaaf] p-5">
                  <h3 className="text-xs font-black text-[#8b6508] mb-3">לוח התאריכים שלך</h3>
                  <DressCalendar bookedDates={reservationDates} />
                </div>
                <ul className="space-y-3">
                  {reservations.map((r) => (
                    <li key={r.id} className="bg-white rounded-xl border border-[#eadaaf] p-4">
                      <div className="flex justify-between gap-2 flex-wrap">
                        <strong>{r.dress_name}</strong>
                        <span className="text-[10px] bg-[#f4ebd4] px-2 py-0.5 rounded-full">{STATUS[r.status] || r.status}</span>
                      </div>
                      <p className="text-sm text-[#8b6508] font-bold mt-1">📅 {r.event_date}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {section === 'rentals' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h2 className="font-black text-xl">👗 ההשכרות שלי</h2>
              <button onClick={() => setSection('add')} className="px-4 py-2 bg-[#b8860b] text-white rounded-xl text-xs font-bold">
                ➕ הוספת שמלה
              </button>
            </div>
            {dresses.length === 0 ? (
              <p className="text-sm text-[#6e634c]">אין שמלות. הוסיפי שמלה חדשה!</p>
            ) : (
              dresses.map((dress) => {
                const dressBookings = ownerBookings.filter(
                  (b) => String(b.dress_id) === String(dress.id)
                );
                const confirmedBookings = dressBookings.filter((b) => b.status === 'confirmed');
                return (
                  <div key={dress.id} className="bg-white rounded-2xl border border-[#eadaaf] p-4 sm:p-5 space-y-4">
                    <div className="flex gap-4">
                      {dress.images?.[0] ? (
                        <img src={dress.images[0]} alt="" className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-xl border border-[#f0e2c3] shrink-0" />
                      ) : (
                        <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl border border-dashed border-[#decfa8] bg-[#faf8f3] flex items-center justify-center text-2xl shrink-0">👗</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="font-bold text-base">{dress.name}</h3>
                          {dressBookings.length > 0 && (
                            <span className="text-[10px] font-black bg-[#2c261a] text-[#f4ebd4] px-2.5 py-1 rounded-full shrink-0">
                              {dressBookings.length} שריונות
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6e634c] mt-1">₪{dress.price} · מידה {dress.size} · {dress.city}</p>
                        <span className="inline-block mt-2 text-[10px] bg-[#f4ebd4] px-2 py-0.5 rounded-full">{STATUS[dress.status]}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-[#8b6508] mb-2">לוח שריונות</h4>
                      <DressCalendar bookedDates={confirmedBookings.map((b) => b.event_date)} />
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-[#8b6508] mb-3">מי שריינה את השמלה</h4>
                      {dressBookings.length === 0 ? (
                        <p className="text-xs text-[#9a7b4f] bg-[#faf8f3] rounded-xl border border-dashed border-[#decfa8] px-4 py-3 text-center">
                          עדיין אין שריונות על השמלה הזו
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {dressBookings.map((b) => (
                            <li
                              key={b.id}
                              className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-l from-[#fffdf8] to-[#f4ebd4] border border-[#decfa8] rounded-xl px-4 py-3"
                            >
                              <div>
                                <p className="text-sm font-bold text-[#3d2f24]">
                                  {b.customer_name || 'שוכרת'}
                                </p>
                                <p className="text-xs text-[#8b6508] font-bold mt-0.5">📅 {b.event_date}</p>
                                {b.customer_phone && (
                                  <a href={`tel:${b.customer_phone}`} className="text-[11px] text-[#6e634c] mt-1 inline-block hover:underline">
                                    📞 {b.customer_phone}
                                  </a>
                                )}
                              </div>
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 ${
                                b.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {STATUS[b.status] || b.status}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {section === 'cart' && (
          <div>
            <h2 className="font-black text-xl mb-4">🛍️ הסל שלי</h2>
            <SavedDressList
              items={cart}
              emptyMessage="הסל ריק — הוסיפי שמלות מהקטלוג"
              onRemove={removeFromCart}
              showTotal
            />
          </div>
        )}

        {section === 'favorites' && (
          <div>
            <h2 className="font-black text-xl mb-4">❤️ מועדפים</h2>
            <SavedDressList
              items={favorites}
              emptyMessage="אין מועדפים עדיין — לחצי ❤️ על שמלה בקטלוג"
              onRemove={removeFromFavorites}
            />
          </div>
        )}

        {section === 'add' && (
          <form onSubmit={submitDress} className="bg-white rounded-2xl border border-[#eadaaf] p-4 sm:p-6 space-y-4">
            <h2 className="font-black text-xl">➕ הוספת שמלה</h2>
            <OwnerPlatformNotice />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required placeholder="שם השמלה *" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className="p-2.5 border border-[#decfa8] rounded-xl text-xs col-span-1 sm:col-span-2" />
              <input required type="number" placeholder="מחיר *" value={addForm.price} onChange={(e) => setAddForm({ ...addForm, price: e.target.value })} className="p-2.5 border border-[#decfa8] rounded-xl text-xs" />
              <select required value={addForm.size} onChange={(e) => setAddForm({ ...addForm, size: e.target.value })} className="p-2.5 border border-[#decfa8] rounded-xl text-xs">
                <option value="">מידה *</option>
                {['XS', 'S', 'M', 'L', 'XL'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input required placeholder="עיר *" value={addForm.city} onChange={(e) => setAddForm({ ...addForm, city: e.target.value })} className="p-2.5 border border-[#decfa8] rounded-xl text-xs" />
              <input placeholder="צבע" value={addForm.color} onChange={(e) => setAddForm({ ...addForm, color: e.target.value })} className="p-2.5 border border-[#decfa8] rounded-xl text-xs" />
              <textarea
                placeholder="תיאור השמלה (אופציונלי)"
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                rows={3}
                className="p-2.5 border border-[#decfa8] rounded-xl text-xs col-span-1 sm:col-span-2 resize-none"
              />
            </div>

            <div className="bg-[#fffdf9] border border-[#eadaaf] rounded-xl p-3 text-[10px] text-[#6e634c] leading-relaxed">
              <strong className="text-[#8b6508]">טיפ לצילום:</strong> צלמי מהקדימה, מהצד ומהגב — על קולב או תלויה. תאורה טבעית עובדת הכי טוב!
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8b6508] mb-2">העלאת תמונות של השמלה *</label>
              <button
                type="button"
                onClick={() => addFileInputRef.current?.click()}
                className="w-full p-6 border-2 border-dashed border-[#d4af37] rounded-2xl bg-[#fffdf8] hover:bg-[#f4ebd4] transition-colors text-center"
              >
                <span className="text-3xl block mb-2">📷</span>
                <span className="text-xs font-bold text-[#8b6508] block">לחצי כאן לצירוף תמונות</span>
                <span className="text-[10px] text-[#9a7b4f] mt-1 block">ניתן להעלות מספר תמונות (JPG, PNG)</span>
              </button>
              <input
                ref={addFileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleAddImageUpload}
                className="hidden"
              />
              {addImagePreviews.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-3 bg-neutral-50 p-3 rounded-xl border border-[#eadaaf]">
                  {addImagePreviews.map((img, index) => (
                    <div key={`${img}-${index}`} className="relative">
                      <img src={img} alt={`תצוגה ${index + 1}`} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border-2 border-[#decfa8]" />
                      <button
                        type="button"
                        onClick={() => removeAddImage(index)}
                        className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[#2c261a] text-white text-[10px] font-bold flex items-center justify-center shadow-md hover:bg-red-700"
                        aria-label="מחקי תמונה"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <p className="w-full text-[10px] text-[#9a7b4f] mt-1">{addImagePreviews.length} תמונות נבחרו</p>
                </div>
              )}
            </div>

            <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white rounded-xl text-xs font-black shadow-md">
              שלחי לאישור
            </button>
          </form>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
