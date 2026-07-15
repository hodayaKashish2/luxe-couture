'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import SavedDressList from '@/components/SavedDressList';
import DressDetailsModal from '@/components/DressDetailsModal';
import { useLuxeStorage } from '@/components/LuxeStorageProvider';
import DressCalendar from '@/components/DressCalendar';
import OwnerPlatformNotice from '@/components/OwnerPlatformNotice';
import FormError from '@/components/FormError';
import SiteToast, { type SiteToastVariant } from '@/components/SiteToast';
import OwnerDressesPanel from '@/components/OwnerDressesPanel';
import DressSizeInput from '@/components/DressSizeInput';
import { validateAddDressForm, validateDressImageFiles, validateUpdateProfileForm } from '@/lib/form-validation';
import { BOOKING_UPDATED_EVENT, notifyBookingUpdated } from '@/lib/booking-events';
import { getStoredSiteUser } from '@/lib/session-user';
import { clearAllLuxeStorage } from '@/lib/luxe-storage';
import { notifySiteAuthChange } from '@/lib/site-auth-events';
import { accountSectionUrl, parseAccountSection } from '@/lib/account-section-url';
import { navigateAccountHub } from '@/lib/account-hub-nav';
import { ownerWhatsAppLink } from '@/lib/site-config';
import { fetchDressById, findDressInList, preloadDressesCatalog } from '@/lib/dress-api';
import { useScrollToError } from '@/hooks/use-scroll-to-error';
import type { Dress } from '@/lib/types';
import type { SavedDress } from '@/lib/luxe-storage';

type Section = 'hub' | 'reservations' | 'rentals' | 'cart' | 'favorites' | 'add' | 'edit' | 'profile';

type AccountUser = {
  displayName: string;
  username: string;
  phone?: string;
  email?: string;
};

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
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  event_date: string;
  status: string;
};

const STATUS: Record<string, string> = {
  approved: 'מפורסמת ✓',
  pending: 'ממתינה לאישור',
  removed: 'הוסרה',
  confirmed: 'הזמנה מאושרת ✓',
  pending_payment: 'ממתין לתשלום',
  awaiting_admin_approval: 'ממתין לאישור תשלום',
  cancelled: 'בוטלה',
};
function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { section, dressId, viewDress: viewDressId } = parseAccountSection(searchParams);
  const { cart, favorites, cartCount, favCount, removeFromCart, removeFromFavorites, toggleCart, toggleFavorite, isDressInCart, isDressFavorite } = useLuxeStorage();
  const [detailsDress, setDetailsDress] = useState<Dress | null>(null);
  const [user, setUser] = useState<AccountUser | null>(() => {
    const stored = getStoredSiteUser();
    if (!stored) return null;
    return {
      displayName: stored.displayName || stored.display_name || '',
      username: stored.username || '',
      phone: stored.phone || '',
      email: stored.email || '',
    };
  });
  const [dresses, setDresses] = useState<RentalDress[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<BookingRow[]>([]);
  const [reservations, setReservations] = useState<BookingRow[]>([]);
  const [revealedOwnerIds, setRevealedOwnerIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [addFiles, setAddFiles] = useState<File[]>([]);
  const [addImagePreviews, setAddImagePreviews] = useState<string[]>([]);
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const pendingViewDressRef = useRef<string | null>(null);
  const [addForm, setAddForm] = useState({
    name: '', price: '', size: '', city: 'ירושלים', color: '', event_type: '',
    deposit: '', pickup_method: 'pickup', includes_dry_cleaning: 'no', condition: 'new', description: '',
    owner_phone: '',
  });
  const [editingDress, setEditingDress] = useState<RentalDress | null>(null);
  const [editForm, setEditForm] = useState({
    name: '', price: '', size: '', city: '', color: '', description: '',
  });
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editNewFiles, setEditNewFiles] = useState<File[]>([]);
  const [editNewPreviews, setEditNewPreviews] = useState<string[]>([]);
  const [addFormError, setAddFormError] = useState('');
  const addFormErrorRef = useRef<HTMLDivElement>(null);
  useScrollToError(addFormErrorRef, addFormError);
  const [profileForm, setProfileForm] = useState({
    display_name: '',
    phone: '',
    email: '',
    username: '',
  });
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: SiteToastVariant } | null>(null);

  const navigateToSection = useCallback(
    (next: Section, opts?: { dressId?: string; viewDress?: string; replace?: boolean }) => {
      if (next === 'hub') {
        navigateAccountHub();
        return;
      }
      const url = accountSectionUrl(next, {
        dressId: opts?.dressId,
        viewDress: opts?.viewDress,
      });
      if (opts?.replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [router]
  );

  const goToAccountHub = useCallback(() => {
    setDetailsDress(null);
    pendingViewDressRef.current = null;
    navigateAccountHub();
  }, []);

  const closeDetailsDress = useCallback(() => {
    setDetailsDress(null);
    pendingViewDressRef.current = null;
    const { section: currentSection } = parseAccountSection(searchParams);
    if (searchParams.get('viewDress')) {
      navigateToSection(currentSection, { replace: true });
    }
  }, [searchParams, navigateToSection]);

  const openSavedDressDetails = useCallback(async (item: SavedDress) => {
    pendingViewDressRef.current = item.id;
    const list = await preloadDressesCatalog();
    let dress = findDressInList(list, item.id);
    if (!dress) dress = await fetchDressById(item.id);
    if (!dress) {
      pendingViewDressRef.current = null;
      alert('לא מצאנו את השמלה באתר — אולי הוסרה');
      return;
    }
    setDetailsDress(dress);
    navigateToSection(section, { viewDress: item.id, replace: true });
  }, [section, navigateToSection]);

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
        setUser({
          displayName: data.user.displayName,
          username: data.user.username,
          phone: data.user.phone || '',
          email: data.user.email || '',
        });
        sessionStorage.setItem('site_user', JSON.stringify(data.user));
      }
      setDataReady(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    preloadDressesCatalog();
  }, []);

  useEffect(() => {
    if (section === 'profile' && user) {
      setProfileForm({
        display_name: user.displayName || '',
        phone: user.phone || '',
        email: user.email || '',
        username: user.username || '',
      });
    }
  }, [section, user]);

  useEffect(() => {
    if (section === 'add') {
      const stored = getStoredSiteUser();
      if (stored?.phone) {
        setAddForm((prev) => ({
          ...prev,
          owner_phone: prev.owner_phone || stored.phone || '',
        }));
      }
    }
  }, [section]);

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
    if (!searchParams.get('rentalDress')) return;
    navigateAccountHub();
  }, [searchParams]);

  useEffect(() => {
    if (section === 'edit' && dressId) {
      const dress = dresses.find((d) => d.id === dressId);
      if (dress) {
        setEditingDress(dress);
        setEditForm({
          name: dress.name,
          price: String(dress.price),
          size: dress.size,
          city: dress.city,
          color: '',
          description: '',
        });
        setEditImages(Array.isArray(dress.images) ? [...dress.images] : []);
      }
    } else if (section !== 'edit') {
      setEditingDress(null);
    }

    if (viewDressId && (section === 'cart' || section === 'favorites')) {
      pendingViewDressRef.current = null;
      preloadDressesCatalog().then((list) => {
        const cached = findDressInList(list, viewDressId);
        if (cached) {
          setDetailsDress(cached);
          return;
        }
        fetchDressById(viewDressId).then((dress) => {
          if (dress) setDetailsDress(dress);
        });
      });
    } else if (section !== 'cart' && section !== 'favorites') {
      setDetailsDress(null);
      pendingViewDressRef.current = null;
    } else if (!viewDressId && !pendingViewDressRef.current) {
      setDetailsDress(null);
    }
  }, [section, dressId, viewDressId, dresses]);

  async function cancelReservation(bookingId: number) {
    if (!confirm('לבטל את ההזמנה? התאריך ישוחרר לשוכרות אחרות.')) return;

    const token = sessionStorage.getItem('site_token');
    setCancellingId(bookingId);
    const res = await fetch(`/api/user/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-token': token || '',
      },
      body: JSON.stringify({ action: 'cancel' }),
    });
    const data = await res.json();
    setCancellingId(null);

    if (res.ok) {
      notifyBookingUpdated();
      load({ silent: true });
    } else {
      alert(data.error || 'לא הצלחנו לבטל את ההזמנה');
    }
  }

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError('');

    const validationError = validateUpdateProfileForm({
      display_name: profileForm.display_name,
      phone: profileForm.phone,
      email: profileForm.email,
    });
    if (validationError) {
      setProfileError(validationError);
      return;
    }

    const token = sessionStorage.getItem('site_token');
    setProfileSaving(true);
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-token': token || '',
      },
      body: JSON.stringify({
        display_name: profileForm.display_name,
        phone: profileForm.phone,
        email: profileForm.email,
      }),
    });
    const data = await res.json();
    setProfileSaving(false);

    if (res.ok) {
      if (data.token) sessionStorage.setItem('site_token', data.token);
      if (data.user) {
        sessionStorage.setItem('site_user', JSON.stringify(data.user));
        setUser({
          displayName: data.user.displayName,
          username: data.user.username,
          phone: data.user.phone || '',
          email: data.user.email || '',
        });
        notifySiteAuthChange();
      }
      navigateToSection('hub', { replace: true });
    } else {
      setProfileError(data.error || 'שגיאה בעדכון');
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearAllLuxeStorage();
    sessionStorage.clear();
    notifySiteAuthChange();
    router.replace('/');
  }

  async function submitDress(e: React.FormEvent) {
    e.preventDefault();
    setAddFormError('');

    const validationError = validateAddDressForm(
      {
        name: addForm.name,
        price: addForm.price,
        size: addForm.size,
        city: addForm.city,
        owner_phone: addForm.owner_phone,
      },
      addFiles.length
    );
    if (validationError) {
      setAddFormError(validationError);
      return;
    }

    const imageError = validateDressImageFiles(addFiles);
    if (imageError) {
      setAddFormError(imageError);
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
      setAddFiles([]);
      addImagePreviews.forEach((url) => URL.revokeObjectURL(url));
      setAddImagePreviews([]);
      if (addFileInputRef.current) addFileInputRef.current.value = '';
      setToast({ message: 'השמלה נשלחה לאישור! נעדכן אותך כשתופיע בקטלוג.', variant: 'success' });
      navigateToSection('rentals', { replace: true });
      load();
    } else {
      setAddFormError(data.error || 'שגיאה בשליחת השמלה');
    }
  }

  function handleAddImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const imageError = validateDressImageFiles(files);
    if (imageError) {
      setAddFormError(imageError);
      if (addFileInputRef.current) addFileInputRef.current.value = '';
      return;
    }
    setAddFormError('');
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

  function startEditDress(dress: RentalDress) {
    setEditingDress(dress);
    setEditForm({
      name: dress.name,
      price: String(dress.price),
      size: dress.size,
      city: dress.city,
      color: '',
      description: '',
    });
    setEditImages(Array.isArray(dress.images) ? [...dress.images] : []);
    setEditNewFiles([]);
    editNewPreviews.forEach((url) => URL.revokeObjectURL(url));
    setEditNewPreviews([]);
    if (editFileInputRef.current) editFileInputRef.current.value = '';
    navigateToSection('edit', { dressId: dress.id });
  }

  function handleEditImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setEditNewFiles((prev) => [...prev, ...files]);
    setEditNewPreviews((prev) => [...prev, ...previews]);
  }

  function removeEditExistingImage(url: string) {
    setEditImages((prev) => prev.filter((img) => img !== url));
  }

  function removeEditNewImage(index: number) {
    URL.revokeObjectURL(editNewPreviews[index]);
    setEditNewFiles((prev) => prev.filter((_, i) => i !== index));
    setEditNewPreviews((prev) => prev.filter((_, i) => i !== index));
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  }

  async function submitEditDress(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDress) return;

    if (editImages.length + editNewFiles.length === 0) {
      alert('חייבת להישאר לפחות תמונה אחת');
      return;
    }

    const token = sessionStorage.getItem('site_token');
    const formData = new FormData();
    formData.append('name', editForm.name);
    formData.append('price', editForm.price);
    formData.append('size', editForm.size);
    formData.append('city', editForm.city);
    formData.append('color', editForm.color);
    formData.append('description', editForm.description);
    formData.append('kept_images', JSON.stringify(editImages));
    editNewFiles.forEach((file) => formData.append('images', file));

    const res = await fetch(`/api/user/dresses/${editingDress.id}`, {
      method: 'PATCH',
      headers: { 'x-user-token': token || '' },
      body: formData,
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message || 'השמלה עודכנה');
      editNewPreviews.forEach((url) => URL.revokeObjectURL(url));
      setEditNewFiles([]);
      setEditNewPreviews([]);
      setEditingDress(null);
      navigateToSection('rentals', { replace: true });
      load();
    } else {
      alert(data.error || 'שגיאה בעדכון');
    }
  }

  const reservationDates = reservations.map((r) => r.event_date);
  const dressesWithBookings = dresses.filter((d) =>
    ownerBookings.some((b) => String(b.dress_id) === String(d.id))
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbf8f0] to-[#e8dcbd] text-[#332c1e]" dir="rtl">
      <SiteHeader />

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 w-full min-w-0">
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => navigateToSection('reservations')}
                className="text-right p-4 sm:p-6 rounded-2xl border-2 border-[#decfa8] bg-white hover:border-[#d4af37] hover:shadow-lg transition-all group"
              >
                <span className="text-2xl sm:text-3xl">📅</span>
                <h2 className="font-black text-base sm:text-lg mt-2 sm:mt-3 text-[#3d2f24] group-hover:text-[#b8860b]">ההזמנות שלי</h2>
                <p className="text-[10px] sm:text-xs text-[#6e634c] mt-1 leading-relaxed hidden sm:block">
                  שמלות שהזמנת — לוח שנה ופרטי האירועים שלך
                </p>
                <p className="text-[10px] text-[#b8860b] font-bold mt-2 sm:mt-3">
                  {!dataReady ? (
                    <span className="text-[#9a7b4f] animate-pulse">טוען...</span>
                  ) : (
                    <>
                      {reservations.length} הזמנות מאושרות
                    </>
                  )}
                </p>
              </button>

              <button
                type="button"
                onClick={() => navigateToSection('rentals')}
                className="text-right p-4 sm:p-6 rounded-2xl border-2 border-[#decfa8] bg-white hover:border-[#d4af37] hover:shadow-lg transition-all group"
              >
                <span className="text-2xl sm:text-3xl">👗</span>
                <h2 className="font-black text-base sm:text-lg mt-2 sm:mt-3 text-[#3d2f24] group-hover:text-[#b8860b]">השמלות שלי</h2>
                <p className="text-[10px] sm:text-xs text-[#6e634c] mt-1 leading-relaxed hidden sm:block">
                  השמלות שפרסמת — רשימה מסודרת לניהול שמלות
                </p>
                <p className="text-[10px] text-[#b8860b] font-bold mt-2 sm:mt-3">
                  {!dataReady ? (
                    <span className="text-[#9a7b4f] animate-pulse">טוען...</span>
                  ) : (
                    <>
                      {dresses.length} שמלות
                      {dressesWithBookings > 0 && ` · ${dressesWithBookings} עם הזמנות`}
                    </>
                  )}
                </p>
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {[
                { id: 'cart' as Section, icon: '🛍️', label: 'סל קניות', count: cartCount },
                { id: 'favorites' as Section, icon: '❤️', label: 'מועדפים', count: favCount },
                { id: 'add' as Section, icon: '➕', label: 'הוספת שמלה', count: null },
                { id: 'profile' as Section, icon: '👤', label: 'פרטי חשבון', count: null },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateToSection(item.id)}
                  className="p-2.5 sm:p-4 rounded-xl border border-[#eadaaf] bg-white/90 hover:bg-[#fffdf8] hover:border-[#d4af37] text-center transition-colors"
                >
                  <span className="text-lg sm:text-xl block">{item.icon}</span>
                  <p className="text-[9px] sm:text-[11px] font-bold mt-1 text-[#8b6508] leading-tight">{item.label}</p>
                  {item.count !== null && (
                    <p className="text-[9px] text-[#9a7b4f]">{item.count}</p>
                  )}
                </button>
              ))}
              <Link
                href="/"
                className="p-2.5 sm:p-4 rounded-xl border border-[#eadaaf] bg-gradient-to-b from-[#fffdf8] to-[#f4ebd4] hover:shadow text-center flex flex-col items-center justify-center"
              >
                <span className="text-lg sm:text-xl">🏠</span>
                <p className="text-[9px] sm:text-[11px] font-bold mt-1 text-[#8b6508] leading-tight">לקטלוג</p>
              </Link>
            </div>
          </div>
        )}

        {section !== 'hub' && (
          <button
            type="button"
            onClick={() => {
              if (section === 'edit') {
                setEditingDress(null);
                navigateToSection('rentals', { replace: true });
              } else if (section === 'rentals' || section === 'reservations') {
                goToAccountHub();
              } else if (detailsDress || viewDressId) {
                closeDetailsDress();
              } else {
                goToAccountHub();
              }
            }}
            className="mb-4 text-xs text-[#8b6508] font-bold hover:underline"
          >
            ← {section === 'edit' ? 'חזרה לשמלות שלי' : detailsDress || viewDressId ? 'חזרה לרשימה' : 'חזרה לאזור האישי'}
          </button>
        )}

        {section === 'reservations' && (
          <div className="space-y-6">
            <h2 className="font-black text-xl">📅 ההזמנות שלי</h2>
            {loading ? (
              <p className="text-sm text-[#6e634c] animate-pulse">טוען שמלות...</p>
            ) : reservations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#eadaaf] p-8 text-center">
                <p className="text-sm text-[#6e634c]">עדיין אין הזמנות מאושרות. מצאי שמלה בקטלוג והשלימי תשלום!</p>
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
                      {(r.owner_name || r.owner_phone) && (
                        <div className="mt-3">
                          {revealedOwnerIds.has(r.id) ? (
                            <div className="p-3 bg-[#fffdf8] border border-[#decfa8] rounded-xl space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[10px] font-black text-[#8b6508]">פרטי המשכירה</p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRevealedOwnerIds((prev) => {
                                      const next = new Set(prev);
                                      next.delete(r.id);
                                      return next;
                                    })
                                  }
                                  className="text-[10px] font-bold text-[#8b6508] hover:underline"
                                >
                                  הסתרה
                                </button>
                              </div>
                              {r.owner_name && (
                                <p className="text-xs font-bold text-[#3d2f24]">{r.owner_name}</p>
                              )}
                              {r.owner_phone && (
                                <a
                                  href={`tel:${r.owner_phone}`}
                                  className="text-xs text-[#6e634c] hover:underline block"
                                  dir="ltr"
                                >
                                  📞 {r.owner_phone}
                                </a>
                              )}
                              {r.owner_phone && (
                                <a
                                  href={ownerWhatsAppLink(r.owner_phone, r.dress_name)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#25D366] hover:underline"
                                >
                                  💬 WhatsApp למשכירה
                                </a>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedOwnerIds((prev) => {
                                  const next = new Set(prev);
                                  next.add(r.id);
                                  return next;
                                })
                              }
                              className="px-3 py-2 bg-[#f4ebd4] border border-[#decfa8] rounded-xl text-[10px] font-black text-[#8b6508] hover:bg-[#ebdcb6] transition-colors"
                            >
                              הצגת פרטי המשכירה
                            </button>
                          )}
                        </div>
                      )}
                      <div className="mt-4 pt-3 border-t border-[#f0e6cc]">
                        <button
                          type="button"
                          onClick={() => cancelReservation(r.id)}
                          disabled={cancellingId === r.id}
                          className="text-[10px] font-bold text-red-600 hover:underline disabled:opacity-50"
                        >
                          {cancellingId === r.id ? 'מבטלת...' : '✕ ביטול הזמנה'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {section === 'rentals' && (
          <OwnerDressesPanel
            dresses={dresses}
            ownerBookings={ownerBookings}
            loading={loading}
            onAddDress={() => navigateToSection('add')}
            onEditDress={startEditDress}
          />
        )}

        {section === 'cart' && (
          <div>
            <h2 className="font-black text-xl mb-4">🛍️ הסל שלי</h2>
            <SavedDressList
              items={cart}
              emptyMessage="הסל ריק — הוסיפי שמלות מהקטלוג"
              onRemove={removeFromCart}
              onViewDetails={openSavedDressDetails}
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
              onViewDetails={openSavedDressDetails}
            />
          </div>
        )}

        {section === 'edit' && editingDress && (
          <form onSubmit={submitEditDress} className="bg-white rounded-2xl border border-[#eadaaf] p-4 sm:p-6 space-y-4">
            <button
              type="button"
              onClick={() => {
                setEditingDress(null);
                navigateToSection('rentals', { replace: true });
              }}
              className="text-xs text-[#8b6508] font-bold hover:underline"
            >
              ← חזרה לשמלות שלי
            </button>
            <h2 className="font-black text-xl">✏️ עדכון שמלה</h2>
            <p className="text-xs text-[#6e634c]">עורכת: <strong>{editingDress.name}</strong></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required placeholder="שם השמלה *" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="p-2.5 border border-[#decfa8] rounded-xl text-xs col-span-1 sm:col-span-2" />
              <input required type="number" placeholder="מחיר *" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="p-2.5 border border-[#decfa8] rounded-xl text-xs" />
              <DressSizeInput
                required
                value={editForm.size}
                onChange={(size) => setEditForm({ ...editForm, size })}
                className="p-2.5 border border-[#decfa8] rounded-xl text-xs w-full"
              />
              <input required placeholder="עיר *" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} className="p-2.5 border border-[#decfa8] rounded-xl text-xs" />
              <input placeholder="צבע" value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} className="p-2.5 border border-[#decfa8] rounded-xl text-xs" />
              <textarea
                placeholder="תיאור השמלה (אופציונלי)"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="p-2.5 border border-[#decfa8] rounded-xl text-xs col-span-1 sm:col-span-2 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8b6508] mb-2">תמונות השמלה</label>
              <p className="text-[10px] text-[#9a7b4f] mb-2">ניתן למחוק תמונות קיימות או להוסיף חדשות (עד 6 סה״כ)</p>

              {(editImages.length > 0 || editNewPreviews.length > 0) && (
                <div className="flex gap-2 flex-wrap mb-3 bg-neutral-50 p-3 rounded-xl border border-[#eadaaf]">
                  {editImages.map((img) => (
                    <div key={img} className="relative">
                      <img src={img} alt="" className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-xl border-2 border-[#decfa8] bg-[#faf8f3]" />
                      <button
                        type="button"
                        onClick={() => removeEditExistingImage(img)}
                        className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[#2c261a] text-white text-[10px] font-bold flex items-center justify-center shadow-md hover:bg-red-700"
                        aria-label="מחקי תמונה"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {editNewPreviews.map((img, index) => (
                    <div key={`${img}-${index}`} className="relative">
                      <img src={img} alt="" className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-xl border-2 border-[#d4af37] bg-[#faf8f3]" />
                      <span className="absolute bottom-1 right-1 text-[8px] bg-[#d4af37] text-white px-1 rounded">חדש</span>
                      <button
                        type="button"
                        onClick={() => removeEditNewImage(index)}
                        className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[#2c261a] text-white text-[10px] font-bold flex items-center justify-center shadow-md hover:bg-red-700"
                        aria-label="מחקי תמונה חדשה"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => editFileInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-[#d4af37] rounded-xl bg-[#fffdf8] hover:bg-[#f4ebd4] transition-colors text-center"
              >
                <span className="text-xs font-bold text-[#8b6508]">➕ הוספת תמונות</span>
              </button>
              <input
                ref={editFileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleEditImageUpload}
                className="hidden"
              />
            </div>

            <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white rounded-xl text-xs font-black shadow-md">
              שמרי שינויים
            </button>
          </form>
        )}

        {section === 'profile' && (
          <form onSubmit={submitProfile} className="bg-white rounded-2xl border border-[#eadaaf] p-4 sm:p-6 space-y-4">
            <h2 className="font-black text-xl">👤 פרטי חשבון</h2>
            <p className="text-xs text-[#6e634c]">עדכני שם, טלפון ואימייל — הפרטים ישמשו להזמנות ולשמלות שפרסמת.</p>
            {profileError && <FormError message={profileError} />}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">שם משתמש</label>
                <input
                  readOnly
                  value={profileForm.username}
                  className="w-full p-2.5 border border-[#decfa8] rounded-xl text-xs text-[#6e634c] bg-[#faf8f3]"
                  dir="ltr"
                />
                <p className="text-[10px] text-[#9a7b4f] mt-1">לא ניתן לשנות שם משתמש</p>
              </div>
              <input
                required
                placeholder="שם מלא *"
                value={profileForm.display_name}
                onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
                className="w-full p-2.5 border border-[#decfa8] rounded-xl text-xs text-[#2c261a] bg-white"
              />
              <input
                required
                type="tel"
                placeholder="טלפון *"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full p-2.5 border border-[#decfa8] rounded-xl text-xs text-[#2c261a] bg-white"
                dir="ltr"
              />
              <input
                required
                type="email"
                placeholder="אימייל *"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full p-2.5 border border-[#decfa8] rounded-xl text-xs text-[#2c261a] bg-white"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              disabled={profileSaving}
              className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white rounded-xl text-xs font-black shadow-md disabled:opacity-60"
            >
              {profileSaving ? 'שומרת...' : 'שמרי פרטים'}
            </button>
          </form>
        )}

        {section === 'add' && (
          <form onSubmit={submitDress} className="bg-white rounded-2xl border border-[#eadaaf] p-4 sm:p-6 space-y-4">
            <h2 className="font-black text-xl">➕ הוספת שמלה</h2>
            <OwnerPlatformNotice />
            <div ref={addFormErrorRef}>
              {addFormError && <FormError message={addFormError} />}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required placeholder="שם השמלה *" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className="p-2.5 border border-[#decfa8] rounded-xl text-xs text-[#2c261a] placeholder:text-[#9a7b4f] bg-white col-span-1 sm:col-span-2" />
              <input required type="number" placeholder="מחיר *" value={addForm.price} onChange={(e) => setAddForm({ ...addForm, price: e.target.value })} className="p-2.5 border border-[#decfa8] rounded-xl text-xs text-[#2c261a] placeholder:text-[#9a7b4f] bg-white" />
              <DressSizeInput
                required
                value={addForm.size}
                onChange={(size) => setAddForm({ ...addForm, size })}
                className="p-2.5 border border-[#decfa8] rounded-xl text-xs text-[#2c261a] bg-white w-full"
              />
              <input required placeholder="עיר *" value={addForm.city} onChange={(e) => setAddForm({ ...addForm, city: e.target.value })} className="p-2.5 border border-[#decfa8] rounded-xl text-xs text-[#2c261a] placeholder:text-[#9a7b4f] bg-white" />
              <div className="col-span-1 sm:col-span-2">
                <input
                  required
                  readOnly
                  type="tel"
                  placeholder="טלפון ליצירת קשר *"
                  value={addForm.owner_phone}
                  className="p-2.5 border border-[#decfa8] rounded-xl text-xs text-[#2c261a] bg-[#faf8f3] w-full"
                  dir="ltr"
                />
                <p className="text-[10px] text-[#9a7b4f] mt-1">טלפון החשבון שלך — לפיו מוצגות השמלות באזור האישי</p>
              </div>
              <input placeholder="צבע" value={addForm.color} onChange={(e) => setAddForm({ ...addForm, color: e.target.value })} className="p-2.5 border border-[#decfa8] rounded-xl text-xs text-[#2c261a] placeholder:text-[#9a7b4f] bg-white" />
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
                      <img src={img} alt={`תצוגה ${index + 1}`} className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-xl border-2 border-[#decfa8] bg-[#faf8f3]" />
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

      {detailsDress && (
        <DressDetailsModal
          dress={detailsDress}
          onClose={closeDetailsDress}
          isInCart={isDressInCart(detailsDress.id)}
          isFavorite={isDressFavorite(detailsDress.id)}
          onToggleCart={() => toggleCart(detailsDress)}
          onToggleFavorite={() => toggleFavorite(detailsDress)}
          onReserve={() => {
            const dressId = detailsDress.id;
            closeDetailsDress();
            router.push(`/?reserve=${encodeURIComponent(dressId)}`);
          }}
        />
      )}

      <SiteFooter />

      {toast && (
        <SiteToast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <p className="text-[#8b6508] text-sm">טוען...</p>
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  );
}
