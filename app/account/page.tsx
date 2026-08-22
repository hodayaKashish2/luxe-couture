'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import SavedDressList from '@/components/SavedDressList';
import DressDetailsModal from '@/components/DressDetailsModal';
import DressRateModal from '@/components/DressRateModal';
import FittingConfirmationModal from '@/components/FittingConfirmationModal';
import DressBookingModal, { type DressBookingResume } from '@/components/DressBookingModal';
import { useLuxeStorage } from '@/components/LuxeStorageProvider';
import DressCalendar from '@/components/DressCalendar';
import OwnerPlatformNotice from '@/components/OwnerPlatformNotice';
import OwnDressNoticeModal from '@/components/OwnDressNoticeModal';
import CancelReservationConfirmModal from '@/components/CancelReservationConfirmModal';
import FormError from '@/components/FormError';
import SiteToast, { type SiteToastVariant } from '@/components/SiteToast';
import DressImageFill from '@/components/DressImageFill';
import OwnerDressesPanel from '@/components/OwnerDressesPanel';
import DressSizeInput from '@/components/DressSizeInput';
import { validateAddDressForm, validateDressImageFiles, validateUpdateProfileForm } from '@/lib/form-validation';
import { BOOKING_UPDATED_EVENT, notifyBookingUpdated } from '@/lib/booking-events';
import { getStoredSiteUser } from '@/lib/session-user';
import { dressBelongsToCustomer } from '@/lib/self-dress-guard';
import { consumeDetailsReturnDressId, setDetailsReturnDressId } from '@/lib/details-return';
import { SITE_AUTH_EVENT, notifySiteAuthChange } from '@/lib/site-auth-events';
import {
  clearSiteSession,
  getSiteToken,
  persistSiteSession,
  restoreSiteSession,
} from '@/lib/site-session';
import { accountSectionUrl, parseAccountSection } from '@/lib/account-section-url';
import { dressFromBookingPayload } from '@/lib/booking-dress';
import { navigateAccountHub } from '@/lib/account-hub-nav';
import { ownerWhatsAppLink } from '@/lib/site-config';
import {
  formatPaymentDeadlineHebrew,
  PAYMENT_DEADLINE_DAYS,
  resolvePaymentDeadline,
} from '@/lib/booking-payment-deadlines';
import { shareDressLink } from '@/lib/share-dress';
import { buildEditFormFromDress, normalizeDressImages } from '@/lib/dress-pending-update';
import { formatAccountPhone } from '@/lib/dress-ownership';
import { countUpcomingConfirmed, splitBookingsByEventDate } from '@/lib/booking-dates';
import {
  BOOKINGS_CANCELLED_RETENTION_NOTE,
  BOOKINGS_CANCELLED_SECTION_TITLE,
  BOOKINGS_PAST_RETENTION_NOTE,
  BOOKINGS_PAST_SECTION_TITLE,
} from '@/lib/retention';
import { fetchDressById, findDressInList, invalidateDressesCatalog, preloadDressesCatalog } from '@/lib/dress-api';
import { resetModalStack } from '@/lib/modal-history';
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
  color?: string;
  description?: string;
  status: string;
  images: string[];
  rental_count: number;
  booked_dates: string[];
  has_pending_update?: boolean;
  form?: {
    name: string;
    price: string;
    size: string;
    city: string;
    color: string;
    description: string;
  };
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
  dress_status?: string;
  owner_reject_reason?: string;
  payment_deadline?: string | null;
  owner_responded_at?: string | null;
  created_at?: string | null;
};

const STATUS: Record<string, string> = {
  approved: 'מפורסמת ✓',
  pending: 'ממתינה לאישור',
  removed: 'הוסרה',
  confirmed: 'הזמנה מאושרת ✓',
  pending_owner_approval: 'ממתין לאישור משכירה',
  pending_payment: 'ממתין לתשלום — השלימי עכשיו',
  awaiting_admin_approval: 'ממתין לאישור תשלום',
  cancelled: 'בוטלה',
};
function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { section, dressId, viewDress: viewDressId } = parseAccountSection(searchParams);
  const { cart, favorites, cartCount, favCount, removeFromCart, removeFromFavorites, toggleCart, toggleFavorite, isDressInCart, isDressFavorite } = useLuxeStorage();
  const [detailsDress, setDetailsDress] = useState<Dress | null>(null);
  const [rateDress, setRateDress] = useState<Dress | null>(null);
  const [ratedDressIds, setRatedDressIds] = useState<Set<string>>(() => new Set());
  const [ownDressNotice, setOwnDressNotice] = useState<{
    dressName: string;
    variant: 'booking' | 'coordinate' | 'rating';
  } | null>(null);
  const [fittingConfirm, setFittingConfirm] = useState<Dress | null>(null);
  const [accountBookingDress, setAccountBookingDress] = useState<Dress | null>(null);
  const [accountBookingResume, setAccountBookingResume] = useState<DressBookingResume | null>(null);
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
  const [cancelledOwnerBookings, setCancelledOwnerBookings] = useState<BookingRow[]>([]);
  const [reservations, setReservations] = useState<BookingRow[]>([]);
  const [cancelledReservations, setCancelledReservations] = useState<BookingRow[]>([]);
  const [revealedOwnerIds, setRevealedOwnerIds] = useState<Set<number>>(new Set());
  const [showPastReservations, setShowPastReservations] = useState(false);
  const [showCancelledReservations, setShowCancelledReservations] = useState(false);
  const [showRemovedReservations, setShowRemovedReservations] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState<BookingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [hasSession, setHasSession] = useState(() => {
    if (typeof window === 'undefined') return false;
    restoreSiteSession();
    return Boolean(getSiteToken());
  });
  const [addFiles, setAddFiles] = useState<File[]>([]);
  const [addImagePreviews, setAddImagePreviews] = useState<string[]>([]);
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const pendingViewDressRef = useRef<string | null>(null);
  const loadedViewDressRef = useRef<string | null>(null);
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
  const [editSuccessNotice, setEditSuccessNotice] = useState<{
    dressName: string;
    pendingApproval?: boolean;
    emailWarning?: string;
  } | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editLoadError, setEditLoadError] = useState('');
  const editDressLoadRef = useRef<string | null>(null);
  const editDraftTouchedRef = useRef(false);
  const editLoadedDressIdRef = useRef<string | null>(null);
  const completeBookingHandledRef = useRef<number | null>(null);

  function touchEditDraft() {
    editDraftTouchedRef.current = true;
  }

  useEffect(() => {
    async function loadRatedDressIds() {
      const token = getSiteToken();
      if (!token) {
        setRatedDressIds(new Set());
        return;
      }

      try {
        const response = await fetch('/api/user/rated-dresses', {
          headers: { 'x-user-token': token },
        });
        if (!response.ok) return;
        const data = (await response.json()) as { dressIds?: string[] };
        setRatedDressIds(new Set(data.dressIds ?? []));
      } catch {
        // server validates on submit
      }
    }

    void loadRatedDressIds();
  }, [user]);

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
    setRateDress(null);
    pendingViewDressRef.current = null;
    loadedViewDressRef.current = null;
    const { section: currentSection } = parseAccountSection(searchParams);
    if (searchParams.get('viewDress')) {
      navigateToSection(currentSection, { replace: true });
    }
  }, [searchParams, navigateToSection]);

  const shareDress = useCallback(async (dress: Dress) => {
    await shareDressLink(
      dress,
      (message) => setToast({ message, variant: 'success' }),
      (message) => setToast({ message, variant: 'error' })
    );
  }, []);

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
    const token = getSiteToken();
    setHasSession(Boolean(token));
    if (!token) {
      setLoading(false);
      setDataReady(false);
      setUser(null);
      return;
    }
    if (!opts?.silent) {
      setLoading(true);
      setDataReady(false);
    }
    const stored =
      sessionStorage.getItem('site_user') || localStorage.getItem('site_user');
    if (stored) setUser(JSON.parse(stored));

    try {
      const res = await fetch('/api/user/dashboard', {
        headers: { 'x-user-token': token },
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.status === 401) {
        clearSiteSession();
        setHasSession(false);
        setUser(null);
        setDataReady(false);
        router.replace('/', { scroll: false });
        return;
      }
      if (res.ok) {
        setDresses(data.rentals?.dresses || []);
        setOwnerBookings(data.rentals?.bookings || []);
        setCancelledOwnerBookings(data.rentals?.cancelledBookings || []);
        setReservations(data.reservations || []);
        setCancelledReservations(data.cancelledReservations || []);
        if (data.user) {
          setUser({
            displayName: data.user.displayName,
            username: data.user.username,
            phone: data.user.phone || '',
            email: data.user.email || '',
          });
          persistSiteSession(token, data.user);
        }
      }
    } finally {
      setDataReady(true);
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    resetModalStack();
  }, []);

  useEffect(() => {
    preloadDressesCatalog();
  }, []);

  useEffect(() => {
    if (section === 'profile' && user) {
      setProfileForm({
        display_name: user.displayName || '',
        phone: formatAccountPhone(user.phone || ''),
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

  const prevSectionRef = useRef(section);

  useEffect(() => {
    void load();
    const onBookingUpdate = () => load({ silent: true });
    const onAuth = () => {
      setHasSession(Boolean(getSiteToken()));
      void load();
    };
    const onFocus = () => load({ silent: true });
    window.addEventListener(BOOKING_UPDATED_EVENT, onBookingUpdate);
    window.addEventListener(SITE_AUTH_EVENT, onAuth);
    window.addEventListener('focus', onFocus);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') load({ silent: true });
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener(BOOKING_UPDATED_EVENT, onBookingUpdate);
      window.removeEventListener(SITE_AUTH_EVENT, onAuth);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [load]);

  useEffect(() => {
    if (prevSectionRef.current === section) return;
    prevSectionRef.current = section;
    if (section === 'reservations' || section === 'rentals') {
      void load({ silent: true });
    }
  }, [section, load]);

  const loadEditDress = useCallback(async (id: string, seed?: RentalDress) => {
    editDressLoadRef.current = id;
    setEditLoadError('');

    if (seed && !editDraftTouchedRef.current) {
      const form = seed.form ?? buildEditFormFromDress(seed);
      setEditingDress(seed);
      setEditForm(form);
      setEditImages(normalizeDressImages(seed.images));
    }

    setEditLoading(true);

    const token = getSiteToken();
    try {
      const res = await fetch(`/api/user/dresses/${id}`, {
        headers: { 'x-user-token': token || '' },
        cache: 'no-store',
      });
      const dress = (await res.json()) as RentalDress & { error?: string };
      if (editDressLoadRef.current !== id) return;

      if (!res.ok) {
        if (!seed) {
          setEditLoadError(dress.error || 'לא הצלחנו לטעון את השמלה לעריכה');
        }
        return;
      }

      if (!editDraftTouchedRef.current) {
        setEditingDress(dress);
        setEditForm(dress.form ?? buildEditFormFromDress(dress));
        setEditImages(normalizeDressImages(dress.images));
      } else {
        setEditingDress(dress);
      }
    } catch {
      if (editDressLoadRef.current === id && !seed) {
        setEditLoadError('שגיאת רשת בטעינת השמלה');
      }
    } finally {
      if (editDressLoadRef.current === id) {
        setEditLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!searchParams.get('rentalDress')) return;
    navigateAccountHub();
  }, [searchParams]);

  useEffect(() => {
    if (section === 'edit' && dressId) {
      if (editLoadedDressIdRef.current !== dressId) {
        editLoadedDressIdRef.current = dressId;
        editDraftTouchedRef.current = false;
        const seed = dresses.find((d) => d.id === dressId);
        void loadEditDress(dressId, seed);
      }
    } else if (section !== 'edit') {
      editLoadedDressIdRef.current = null;
      editDraftTouchedRef.current = false;
      editDressLoadRef.current = null;
      setEditingDress(null);
      setEditLoading(false);
      setEditLoadError('');
    }

    if (viewDressId && (section === 'cart' || section === 'favorites' || section === 'rentals')) {
      if (loadedViewDressRef.current === viewDressId && detailsDress?.id === viewDressId) {
        return;
      }
      loadedViewDressRef.current = viewDressId;
      pendingViewDressRef.current = null;
      const openFromCatalog = () =>
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

      if (section === 'rentals') {
        const owned = dresses.find((d) => d.id === viewDressId);
        if (owned) {
          setDetailsDress(owned as unknown as Dress);
        } else {
          void openFromCatalog();
        }
      } else {
        void openFromCatalog();
      }
    } else if (section !== 'cart' && section !== 'favorites' && section !== 'rentals') {
      setDetailsDress(null);
      pendingViewDressRef.current = null;
      loadedViewDressRef.current = null;
    } else if (!viewDressId && !pendingViewDressRef.current && section !== 'rentals') {
      setDetailsDress(null);
      loadedViewDressRef.current = null;
    }
  }, [section, dressId, viewDressId, detailsDress?.id, loadEditDress, dresses]);

  async function confirmCancelReservation() {
    if (!cancelConfirm) return;

    const bookingId = cancelConfirm.id;
    const token = getSiteToken();
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
    setCancelConfirm(null);

    if (res.ok) {
      notifyBookingUpdated();
      load({ silent: true });
      if (Array.isArray(data.emailWarnings) && data.emailWarnings.length > 0) {
        setToast({
          message: 'ההזמנה בוטלה. לא הצלחנו לשלוח מייל אישור — נבדוק את זה.',
          variant: 'error',
        });
      } else {
        setToast({ message: 'ההזמנה בוטלה — נשלח אלייך ולמשכירה מייל אישור.', variant: 'success' });
      }
    } else {
      setToast({ message: data.error || 'לא הצלחנו לבטל את ההזמנה', variant: 'error' });
    }
  }

  function cancelledReservationDetail(reservation: BookingRow) {
    if (reservation.owner_reject_reason?.trim()) {
      return reservation.owner_reject_reason.trim();
    }
    return 'בוטלה על ידך';
  }

  async function cancelReservation(bookingId: number) {
    const reservation = reservations.find((r) => r.id === bookingId);
    if (!reservation) return;
    setCancelConfirm(reservation);
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

    const token = getSiteToken();
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
      const nextToken = data.token || getSiteToken();
      if (nextToken && data.user) {
        persistSiteSession(nextToken, data.user);
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
    clearSiteSession();
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
        color: addForm.color,
        owner_phone: addForm.owner_phone,
        owner_email: user?.email || profileForm.email,
        requireEmail: true,
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

    const token = getSiteToken();
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
    editDraftTouchedRef.current = false;
    editLoadedDressIdRef.current = dress.id;
    setEditNewFiles([]);
    editNewPreviews.forEach((url) => URL.revokeObjectURL(url));
    setEditNewPreviews([]);
    if (editFileInputRef.current) editFileInputRef.current.value = '';

    const form = dress.form ?? buildEditFormFromDress(dress);
    setEditingDress(dress);
    setEditForm(form);
    setEditImages(normalizeDressImages(dress.images));
    setEditLoadError('');
    setEditLoading(false);

    navigateToSection('edit', { dressId: dress.id });
  }

  function handleEditImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    touchEditDraft();
    const files = Array.from(e.target.files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setEditNewFiles((prev) => [...prev, ...files]);
    setEditNewPreviews((prev) => [...prev, ...previews]);
  }

  function removeEditExistingImage(url: string) {
    touchEditDraft();
    setEditImages((prev) => prev.filter((img) => img !== url));
  }

  function removeEditNewImage(index: number) {
    touchEditDraft();
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

    const token = getSiteToken();
    const formData = new FormData();
    formData.append('name', editForm.name);
    formData.append('price', editForm.price);
    formData.append('size', editForm.size);
    formData.append('city', editForm.city);
    formData.append('color', editForm.color);
    formData.append('description', editForm.description);
    formData.append('kept_images', JSON.stringify(editImages));
    editNewFiles.forEach((file) => formData.append('images', file));

    setEditSaving(true);
    try {
      const res = await fetch(`/api/user/dresses/${editingDress.id}`, {
        method: 'PATCH',
        headers: { 'x-user-token': token || '' },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        invalidateDressesCatalog();
        editNewPreviews.forEach((url) => URL.revokeObjectURL(url));
        setEditNewFiles([]);
        setEditNewPreviews([]);
        setEditingDress(null);
        navigateToSection('rentals', { replace: true });
        void load();

        setEditSuccessNotice({
          dressName: editForm.name.trim() || editingDress.name,
          pendingApproval: Boolean(data.pendingApproval),
          emailWarning: (() => {
            const status = data.emailStatus;
            if (!status) return undefined;
            const parts: string[] = [];
            if (!status.adminOk) parts.push('מייל להנהלה לא נשלח');
            if (!status.ownerOk) {
              parts.push(
                status.ownerError?.includes('אין כתובת')
                  ? 'חסר מייל בפרופיל — עדכני באזור האישי'
                  : 'מייל אליך (משכירה) לא נשלח — בדקי ספאם'
              );
            }
            return parts.length ? `${parts.join('. ')}. השמירה הצליחה.` : undefined;
          })(),
        });
      } else {
        setToast({ message: data.error || 'שגיאה בעדכון', variant: 'error' });
      }
    } finally {
      setEditSaving(false);
    }
  }

  const activeDresses = dresses.filter((d) => d.status !== 'removed');
  const sortedCancelledReservations = useMemo(
    () =>
      [...cancelledReservations].sort((a, b) => {
        const aRef = a.owner_responded_at || a.created_at || a.event_date;
        const bRef = b.owner_responded_at || b.created_at || b.event_date;
        return String(bRef).localeCompare(String(aRef));
      }),
    [cancelledReservations]
  );

  const activeReservations = reservations.filter((r) => r.dress_status !== 'removed' && r.status !== 'cancelled');
  const removedReservations = reservations.filter((r) => r.dress_status === 'removed');
  const { upcoming: upcomingReservations, past: pastReservations } = useMemo(
    () => splitBookingsByEventDate(activeReservations),
    [activeReservations]
  );
  const reservationDates = upcomingReservations
    .filter((r) => r.status === 'confirmed')
    .map((r) => r.event_date);
  const renterPendingStatuses = new Set([
    'pending_owner_approval',
    'pending_payment',
    'awaiting_admin_approval',
  ]);
  const pendingReservationsCount = activeReservations.filter((r) =>
    renterPendingStatuses.has(r.status)
  ).length;
  const confirmedReservationsCount = countUpcomingConfirmed(activeReservations);
  const pendingOwnerRequestsCount = ownerBookings.filter(
    (b) => b.status === 'pending_owner_approval'
  ).length;
  const confirmedOwnerBookingsCount = countUpcomingConfirmed(ownerBookings);
  const ownerPipelineCount = ownerBookings.filter((b) =>
    ['pending_payment', 'awaiting_admin_approval'].includes(b.status)
  ).length;

  const reservationHubSummary = (() => {
    const parts: string[] = [];
    if (pendingReservationsCount > 0) {
      parts.push(
        `${pendingReservationsCount} הזמנ${pendingReservationsCount === 1 ? 'ה ממתינה' : 'ות ממתינות'}`
      );
    }
    if (confirmedReservationsCount > 0) {
      parts.push(
        `${confirmedReservationsCount} הזמנ${confirmedReservationsCount === 1 ? 'ה מאושרת' : 'ות מאושרות'}`
      );
    }
    if (!parts.length) return 'עדיין אין הזמנות';
    return parts.join(' · ');
  })();

  const rentalsHubSummary = (() => {
    const parts: string[] = [`${activeDresses.length} שמלות`];
    if (pendingOwnerRequestsCount > 0) {
      parts.push(
        `${pendingOwnerRequestsCount} בקש${pendingOwnerRequestsCount === 1 ? 'ה' : 'ות'} ממתינ${pendingOwnerRequestsCount === 1 ? 'ה' : 'ות'}`
      );
    }
    if (ownerPipelineCount > 0) {
      parts.push(`${ownerPipelineCount} בתהליך תשלום`);
    }
    if (confirmedOwnerBookingsCount > 0) {
      parts.push(
        `${confirmedOwnerBookingsCount} הזמנ${confirmedOwnerBookingsCount === 1 ? 'ה מאושרת' : 'ות מאושרות'}`
      );
    }
    return parts.join(' · ');
  })();

  function isOwnDressForUser(dress: Dress) {
    if (dresses.some((d) => String(d.id) === String(dress.id))) return true;
    return dressBelongsToCustomer(dress, {
      phone: user?.phone || profileForm.phone,
      email: user?.email || profileForm.email,
    });
  }

  function tryRateDress(dress: Dress) {
    if (isOwnDressForUser(dress)) {
      setOwnDressNotice({ dressName: dress.name, variant: 'rating' });
      return;
    }
    if (ratedDressIds.has(dress.id)) {
      setToast({ message: 'כבר דירגת את השמלה הזו — תודה על המשוב!', variant: 'error' });
      return;
    }
    setRateDress(dress);
  }

  const openPaymentForBookingId = useCallback(async (bookingId: number) => {
    const token = getSiteToken();
    if (!token) return false;

    try {
      const response = await fetch(`/api/bookings?bookingId=${bookingId}`, {
        headers: { 'x-user-token': token },
      });
      const data = await response.json();
      if (data.cancelled || response.status === 410) {
        setToast({
          message: data.error || data.reason || 'הבקשה בוטלה — התאריך כבר לא זמין.',
          variant: 'error',
        });
        return true;
      }
      if (!response.ok || !data.success || !data.booking?.canPay) {
        if (data.booking?.awaitingOwner) {
          setToast({
            message: 'הבקשה עדיין ממתינה לאישור המשכירה — נשלח אלייך מייל כשתוכלי לשלם.',
            variant: 'error',
          });
        } else {
          setToast({ message: data.error || 'לא ניתן להשלים תשלום כרגע', variant: 'error' });
        }
        return true;
      }

      setDetailsDress(null);
      setAccountBookingDress(dressFromBookingPayload(data.booking));
      setAccountBookingResume({
        eventDate: data.booking.eventDate,
        payment: {
          bookingId: data.booking.id,
          amount: data.booking.amount,
          platformFee: data.booking.platformFee,
          ownerPayout: data.booking.ownerPayout,
          ownerApproved: true,
        },
      });
      return true;
    } catch {
      setToast({ message: 'תקלה בטעינת ההזמנה', variant: 'error' });
      return true;
    }
  }, []);

  useEffect(() => {
    const param = searchParams.get('completeBooking');
    if (!param || section !== 'reservations') return;

    const bookingId = Number(param);
    if (!Number.isFinite(bookingId) || bookingId <= 0) return;
    if (completeBookingHandledRef.current === bookingId) return;
    if (!getSiteToken()) return;

    completeBookingHandledRef.current = bookingId;
    void openPaymentForBookingId(bookingId).then(() => {
      router.replace(accountSectionUrl('reservations'), { scroll: false });
    });
  }, [searchParams, section, openPaymentForBookingId, router, dataReady]);

  const fetchActiveBookingForDress = useCallback(async (dressId: string) => {
    try {
      const token = getSiteToken();
      const response = await fetch(`/api/bookings?dressId=${encodeURIComponent(dressId)}`, {
        headers: token ? { 'x-user-token': token } : {},
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.booking) return null;
      return data.booking as {
        id: number;
        eventDate: string;
        amount: number;
        platformFee: number;
        ownerPayout: number;
        canPay: boolean;
        awaitingOwner: boolean;
        awaitingAdmin: boolean;
      };
    } catch {
      return null;
    }
  }, []);

  const openAccountBookingWithResume = useCallback(
    (dress: Dress, booking: NonNullable<Awaited<ReturnType<typeof fetchActiveBookingForDress>>>) => {
      setFittingConfirm(null);
      setDetailsDress(null);
      const resume: DressBookingResume = { eventDate: booking.eventDate };
      if (booking.canPay) {
        resume.payment = {
          bookingId: booking.id,
          amount: booking.amount,
          platformFee: booking.platformFee,
          ownerPayout: booking.ownerPayout,
          ownerApproved: true,
        };
      } else if (booking.awaitingOwner || booking.awaitingAdmin) {
        resume.ownerApproval = {
          bookingId: booking.id,
          amount: booking.amount,
          eventDate: booking.eventDate,
        };
      }
      setAccountBookingResume(resume);
      setAccountBookingDress(dress);
    },
    []
  );

  const beginAccountFinalApproval = useCallback(
    (dress: Dress) => {
      if (isOwnDressForUser(dress)) {
        setOwnDressNotice({ dressName: dress.name, variant: 'booking' });
        return;
      }
      closeDetailsDress();
      setFittingConfirm(dress);
      void fetchActiveBookingForDress(dress.id).then((booking) => {
        if (!booking) return;
        if (booking.canPay || booking.awaitingOwner || booking.awaitingAdmin) {
          openAccountBookingWithResume(dress, booking);
        }
      });
    },
    [closeDetailsDress, fetchActiveBookingForDress, openAccountBookingWithResume]
  );

  const confirmAccountFitting = useCallback(() => {
    if (!fittingConfirm) return;
    setAccountBookingDress(fittingConfirm);
    setAccountBookingResume(null);
    setFittingConfirm(null);
  }, [fittingConfirm]);

  const closeAccountBooking = useCallback(() => {
    setAccountBookingDress(null);
    setAccountBookingResume(null);
    resetModalStack();
    void load({ silent: true });
  }, [load]);

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
                    reservationHubSummary
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
                    rentalsHubSummary
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
            {!hasSession ? (
              <p className="text-sm text-[#6e634c] animate-pulse">מתחברת...</p>
            ) : !dataReady ? (
              <p className="text-sm text-[#6e634c] animate-pulse">טוען הזמנות...</p>
            ) : upcomingReservations.length === 0 &&
              pastReservations.length === 0 &&
              removedReservations.length === 0 &&
              sortedCancelledReservations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#eadaaf] p-8 text-center">
                <p className="text-sm text-[#6e634c]">עדיין אין הזמנות. מצאי שמלה בקטלוג ושלחי בקשת שריון!</p>
                <Link href="/" className="inline-block mt-4 px-4 py-2 bg-[#b8860b] text-white rounded-xl text-xs font-bold">
                  לקטלוג →
                </Link>
              </div>
            ) : (
              <>
                {upcomingReservations.length > 0 && (
                  <>
                    <div className="bg-white rounded-2xl border border-[#eadaaf] p-5">
                      <h3 className="text-xs font-black text-[#8b6508] mb-3">לוח התאריכים שלך</h3>
                      <DressCalendar bookedDates={reservationDates} />
                    </div>
                    <ul className="space-y-3">
                      {upcomingReservations.map((r) => (
                    <li key={r.id} className="bg-white rounded-xl border border-[#eadaaf] p-4">
                      <div className="flex justify-between gap-2 flex-wrap">
                        <strong>{r.dress_name}</strong>
                        <span className="text-[10px] bg-[#f4ebd4] px-2 py-0.5 rounded-full">{STATUS[r.status] || r.status}</span>
                      </div>
                      <p className="text-sm text-[#8b6508] font-bold mt-1">📅 {r.event_date}</p>
                      {r.status === 'pending_owner_approval' && (
                        <p className="text-xs text-[#6e634c] mt-2 leading-relaxed">
                          הבקשה אצל המשכירה. תקבלי מייל עם תשובה האם השריון אושר עד 72 שעות.
                        </p>
                      )}
                      {r.status === 'pending_payment' && (
                        <>
                          {(() => {
                            const deadline = resolvePaymentDeadline(
                              r.payment_deadline,
                              r.owner_responded_at
                            );
                            return deadline ? (
                              <p className="text-xs text-[#6e634c] mt-2 leading-relaxed">
                                יש להשלים תשלום עד{' '}
                                <strong>{formatPaymentDeadlineHebrew(deadline)}</strong> ({PAYMENT_DEADLINE_DAYS}{' '}
                                ימים מרגע אישור המשכירה).
                              </p>
                            ) : null;
                          })()}
                          <button
                            type="button"
                            onClick={() => void openPaymentForBookingId(r.id)}
                            className="inline-block mt-3 px-4 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white text-xs font-black rounded-xl shadow-md"
                          >
                            💳 השלימי תשלום עכשיו
                          </button>
                        </>
                      )}
                      {(r.owner_name || r.owner_phone) && r.status !== 'cancelled' && (
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
                        {r.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => cancelReservation(r.id)}
                          disabled={cancellingId === r.id}
                          className="text-[10px] font-bold text-red-600 hover:underline disabled:opacity-50"
                        >
                          {cancellingId === r.id ? 'מבטלת...' : '✕ ביטול הזמנה'}
                        </button>
                        )}
                      </div>
                    </li>
                  ))}
                    </ul>
                  </>
                )}

                {upcomingReservations.length === 0 && pastReservations.length > 0 && (
                  <div className="bg-[#fffdf8] rounded-2xl border border-[#eadaaf] p-5 text-center">
                    <p className="text-sm text-[#6e634c]">אין הזמנות קרובות כרגע.</p>
                  </div>
                )}

                {pastReservations.length > 0 && (
                  <div className="bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden mt-8">
                    <button
                      type="button"
                      onClick={() => setShowPastReservations((v) => !v)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-3 text-xs font-black text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 transition-colors"
                    >
                      <span>🗓️ {BOOKINGS_PAST_SECTION_TITLE} ({pastReservations.length})</span>
                      <span>{showPastReservations ? '▲' : '▼'}</span>
                    </button>
                    <p className="px-4 py-3 text-[11px] text-[#6e634c] leading-relaxed border-t border-neutral-200 bg-white/60">
                      {BOOKINGS_PAST_RETENTION_NOTE}
                    </p>
                    {showPastReservations && (
                      <ul className="divide-y divide-neutral-200 max-h-72 overflow-y-auto">
                        {pastReservations.map((r) => (
                          <li key={r.id} className="px-4 py-3">
                            <div className="flex justify-between gap-2 flex-wrap">
                              <strong className="text-neutral-700">{r.dress_name}</strong>
                              <span className="text-[10px] bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full">
                                {r.status === 'confirmed' ? 'הושלמה ✓' : STATUS[r.status] || r.status}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-500 font-bold mt-1">📅 {r.event_date}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {sortedCancelledReservations.length > 0 && (
                  <div className="bg-red-50/60 rounded-2xl border border-red-200 overflow-hidden mt-8">
                    <button
                      type="button"
                      onClick={() => setShowCancelledReservations((v) => !v)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-3 text-xs font-black text-red-900 bg-red-50 hover:bg-red-100/80 transition-colors"
                    >
                      <span>✕ {BOOKINGS_CANCELLED_SECTION_TITLE} ({sortedCancelledReservations.length})</span>
                      <span>{showCancelledReservations ? '▲' : '▼'}</span>
                    </button>
                    <p className="px-4 py-3 text-[11px] text-[#6e634c] leading-relaxed border-t border-red-100 bg-white/70">
                      {BOOKINGS_CANCELLED_RETENTION_NOTE}
                    </p>
                    {showCancelledReservations && (
                      <ul className="divide-y divide-red-100 max-h-72 overflow-y-auto">
                        {sortedCancelledReservations.map((r) => (
                          <li key={r.id} className="px-4 py-3">
                            <div className="flex justify-between gap-2 flex-wrap">
                              <strong className="text-[#3d2f24]">{r.dress_name}</strong>
                              <span className="text-[10px] bg-red-100 text-red-900 px-2 py-0.5 rounded-full font-bold">
                                בוטלה
                              </span>
                            </div>
                            <p className="text-sm text-[#8b6508] font-bold mt-1">📅 {r.event_date}</p>
                            <p className="text-xs text-red-800/90 mt-2 leading-relaxed bg-red-50/80 border border-red-100 rounded-lg px-3 py-2">
                              {cancelledReservationDetail(r)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {removedReservations.length > 0 && (
                  <div className="bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden mt-8">
                    <button
                      type="button"
                      onClick={() => setShowRemovedReservations((v) => !v)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-3 text-xs font-black text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 transition-colors"
                    >
                      <span>🗂️ שמלות שהוסרו מהאתר ({removedReservations.length})</span>
                      <span>{showRemovedReservations ? '▲' : '▼'}</span>
                    </button>
                    {showRemovedReservations && (
                      <ul className="divide-y divide-neutral-200 max-h-72 overflow-y-auto">
                        {removedReservations.map((r) => (
                          <li key={r.id} className="px-4 py-3">
                            <div className="flex justify-between gap-2 flex-wrap">
                              <strong className="text-neutral-700">{r.dress_name}</strong>
                              <span className="text-[10px] bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full">
                                הוסרה מהאתר
                              </span>
                            </div>
                            <p className="text-sm text-neutral-500 font-bold mt-1">📅 {r.event_date}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {section === 'rentals' && (
          <OwnerDressesPanel
            dresses={dresses}
            ownerBookings={ownerBookings}
            cancelledOwnerBookings={cancelledOwnerBookings}
            loading={!hasSession || !dataReady}
            onAddDress={() => navigateToSection('add')}
            onEditDress={startEditDress}
            onRefresh={() => load({ silent: true })}
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
              actionLabel="בקשת אישור סופי"
              onAction={async (item) => {
                let dress = await fetchDressById(item.id);
                if (!dress) {
                  const list = await preloadDressesCatalog();
                  dress = findDressInList(list, item.id);
                }
                if (!dress) {
                  setToast({ message: 'לא מצאנו את השמלה — אולי הוסרה', variant: 'error' });
                  return;
                }
                beginAccountFinalApproval(dress);
              }}
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

        {section === 'edit' && editLoading && (
          <div className="bg-white rounded-2xl border border-[#eadaaf] p-8 text-center">
            <p className="text-sm text-[#6e634c] animate-pulse">טוען פרטי שמלה לעריכה...</p>
          </div>
        )}

        {section === 'edit' && !editLoading && editLoadError && (
          <div className="bg-white rounded-2xl border border-red-200 p-6 text-center space-y-3">
            <p className="text-sm text-red-700 font-bold">{editLoadError}</p>
            <button
              type="button"
              onClick={() => {
                if (!dressId) return;
                editDraftTouchedRef.current = false;
                void loadEditDress(dressId);
              }}
              className="px-4 py-2 bg-[#b8860b] text-white rounded-xl text-xs font-bold"
            >
              נסי שוב
            </button>
          </div>
        )}

        {section === 'edit' && editingDress && !editLoading && (
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
              <input required placeholder="שם השמלה *" value={editForm.name} onChange={(e) => { touchEditDraft(); setEditForm({ ...editForm, name: e.target.value }); }} className="p-2.5 border border-[#decfa8] rounded-xl text-xs col-span-1 sm:col-span-2" />
              <input required type="number" placeholder="מחיר *" value={editForm.price} onChange={(e) => { touchEditDraft(); setEditForm({ ...editForm, price: e.target.value }); }} className="p-2.5 border border-[#decfa8] rounded-xl text-xs" />
              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">מידה *</label>
                <DressSizeInput
                  required
                  value={editForm.size}
                  onChange={(size) => { touchEditDraft(); setEditForm({ ...editForm, size }); }}
                  className="p-2.5 border border-[#decfa8] rounded-xl text-xs w-full"
                />
              </div>
              <input required placeholder="עיר *" value={editForm.city} onChange={(e) => { touchEditDraft(); setEditForm({ ...editForm, city: e.target.value }); }} className="p-2.5 border border-[#decfa8] rounded-xl text-xs" />
              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">צבע</label>
                <input
                  placeholder="למשל: לבן, שמפניה, כחול כהה"
                  value={editForm.color}
                  onChange={(e) => { touchEditDraft(); setEditForm({ ...editForm, color: e.target.value }); }}
                  className="p-2.5 border border-[#decfa8] rounded-xl text-xs w-full"
                />
              </div>
              <textarea
                placeholder="תיאור השמלה (אופציונלי)"
                value={editForm.description}
                onChange={(e) => { touchEditDraft(); setEditForm({ ...editForm, description: e.target.value }); }}
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
                      <DressImageFill src={img} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-[#decfa8]" />
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
                      <DressImageFill src={img} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-[#d4af37]" />
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

            <button
              type="submit"
              disabled={editSaving}
              className={`w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white rounded-xl text-xs font-black shadow-md transition-all disabled:opacity-60 disabled:cursor-wait ${
                editSaving ? 'scale-[0.98] shadow-inner' : 'hover:brightness-105 active:scale-[0.98]'
              }`}
            >
              {editSaving ? 'שומרת...' : 'שמרי שינויים'}
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
                placeholder="טלפון (0501234567) *"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full p-2.5 border border-[#decfa8] rounded-xl text-xs text-[#2c261a] bg-white"
                dir="ltr"
              />
              <p className="text-[10px] text-[#9a7b4f] -mt-1">10 ספרות, מתחיל ב-0 — למשל 0501234567</p>
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
              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">מידה *</label>
                <DressSizeInput
                  required
                  value={addForm.size}
                  onChange={(size) => setAddForm({ ...addForm, size })}
                  className="p-2.5 border border-[#decfa8] rounded-xl text-xs text-[#2c261a] bg-white w-full"
                />
              </div>
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
              <input placeholder="צבע *" required value={addForm.color} onChange={(e) => setAddForm({ ...addForm, color: e.target.value })} className="p-2.5 border border-[#decfa8] rounded-xl text-xs text-[#2c261a] placeholder:text-[#9a7b4f] bg-white" />
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
                      <DressImageFill
                        src={img}
                        alt={`תצוגה ${index + 1}`}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-[#decfa8]"
                      />
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
          onReserve={() => beginAccountFinalApproval(detailsDress)}
          onCoordinate={() => {
            const dressId = detailsDress.id;
            if (isOwnDressForUser(detailsDress)) {
              setOwnDressNotice({ dressName: detailsDress.name, variant: 'coordinate' });
              return;
            }
            setDetailsReturnDressId(dressId, 'account', section);
            closeDetailsDress();
            router.push(`/?coordinate=${encodeURIComponent(dressId)}`);
          }}
          onRate={() => tryRateDress(detailsDress)}
          onShare={() => {
            void shareDress(detailsDress);
          }}
        />
      )}

      {rateDress && (
        <DressRateModal
          dress={rateDress}
          onClose={() => setRateDress(null)}
          onRated={(dressId, ratingAvg, ratingCount) => {
            const patch = { rating_avg: ratingAvg, rating_count: ratingCount };
            setRatedDressIds((prev) => new Set([...prev, dressId]));
            setDetailsDress((prev) => (prev?.id === dressId ? { ...prev, ...patch } : prev));
            setRateDress((prev) => (prev?.id === dressId ? { ...prev, ...patch } : prev));
          }}
          showBackToDetails={!!detailsDress}
        />
      )}

      {fittingConfirm && (
        <FittingConfirmationModal
          dressName={fittingConfirm.name}
          onConfirm={confirmAccountFitting}
          onCancel={() => setFittingConfirm(null)}
        />
      )}

      {accountBookingDress && (
        <DressBookingModal
          dress={accountBookingDress}
          resume={accountBookingResume}
          onClose={closeAccountBooking}
          onComplete={() => void load({ silent: true })}
          onViewDetails={(dress) => {
            setAccountBookingDress(null);
            setAccountBookingResume(null);
            setDetailsDress(dress);
          }}
        />
      )}

      {cancelConfirm && (
        <CancelReservationConfirmModal
          dressName={cancelConfirm.dress_name}
          eventDate={cancelConfirm.event_date}
          loading={cancellingId === cancelConfirm.id}
          onConfirm={() => void confirmCancelReservation()}
          onClose={() => {
            if (cancellingId !== cancelConfirm.id) setCancelConfirm(null);
          }}
        />
      )}

      {ownDressNotice && (
        <OwnDressNoticeModal
          dressName={ownDressNotice.dressName}
          variant={ownDressNotice.variant}
          onClose={() => setOwnDressNotice(null)}
        />
      )}

      {editSuccessNotice && section === 'rentals' && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-[85] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-[#d4af37] relative text-center"
            dir="rtl"
          >
            <span className="text-4xl block mb-3">✨</span>
            <h3 className="text-xl font-black text-[#3d2f24] mb-2">
              {editSuccessNotice.pendingApproval !== false ? 'העדכון נשלח לאישור!' : 'השמלה עודכנה!'}
            </h3>
            <p className="text-sm text-[#6e634c] font-bold mb-1">{editSuccessNotice.dressName}</p>
            <p className="text-sm text-[#5c5037] leading-relaxed mb-4">
              {editSuccessNotice.pendingApproval !== false
                ? 'העדכון נשלח לאישור ההנהלה. עד לאישור — בקטלוג תמשיך להופיע הגרסה הנוכחית. נעדכן אותך במייל כשיאושר.'
                : 'השינויים נשמרו בהצלחה.'}
            </p>
            {editSuccessNotice.emailWarning && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                {editSuccessNotice.emailWarning}
              </p>
            )}
            <button
              type="button"
              onClick={() => setEditSuccessNotice(null)}
              className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white text-sm font-black rounded-xl shadow-md"
            >
              חזרה לשמלות שלי
            </button>
          </div>
        </div>
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
