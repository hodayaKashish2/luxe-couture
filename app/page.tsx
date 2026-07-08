'use client';

import React, { useState, useEffect, useRef } from 'react';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';
import OwnerPlatformNotice from '@/components/OwnerPlatformNotice';
import DressCardSummary from '@/components/DressCardSummary';
import DressDetailsModal from '@/components/DressDetailsModal';
import DressRateModal from '@/components/DressRateModal';
import { useLuxeStorage } from '@/components/LuxeStorageProvider';
import SavedDressList from '@/components/SavedDressList';
import { FAQS } from '@/lib/constants';
import { notifyBookingUpdated } from '@/lib/booking-events';
import { compareDresses } from '@/lib/dress-sort';
import { dressShareUrl, ownerWhatsAppLink, WHATSAPP_LINK } from '@/lib/site-config';
import { Dress, Review, SortOption, EVENT_TYPES, PICKUP_METHODS } from '@/lib/types';

export default function Home() {
  const [dressesList, setDressesList] = useState<Dress[]>([]);
  const [isLoadingDresses, setIsLoadingDresses] = useState(true);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isAddReviewOpen, setIsAddReviewOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', role: '', text: '', stars: 5 });

  // פילטרים
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState(1000);
  const [selectedSize, setSelectedSize] = useState('All');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const { cart, toggleCart, toggleFavorite, removeFromCart, isDressInCart, isDressFavorite } =
    useLuxeStorage();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // מודאל הוספת שמלה חדשה
  const [isAddDressOpen, setIsAddDressOpen] = useState(false);
  const [isSubmittingDress, setIsSubmittingDress] = useState(false);
  const [newDressFiles, setNewDressFiles] = useState<File[]>([]);
  const newDressFileInputRef = useRef<HTMLInputElement>(null);
  const [newDressData, setNewDressData] = useState({
    name: '',
    price: '',
    size: '',
    color: '',
    city: '',
    event_type: '',
    owner_name: '',
    owner_phone: '',
    owner_email: '',
    deposit: '',
    pickup_method: 'pickup',
    includes_dry_cleaning: 'no',
    condition: 'new',
    description: '',
    images: [] as string[]
  });

  // מודאלים ושריון
  const [selectedDress, setSelectedDress] = useState<Dress | null>(null);
  const [orderName, setOrderName] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderEmail, setOrderEmail] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [isOrdered, setIsOrdered] = useState(false);
  const [dateError, setDateError] = useState('');
  const [coordinateDress, setCoordinateDress] = useState<Dress | null>(null);
  const [coordinateDate, setCoordinateDate] = useState('');
  const [coordinateChecked, setCoordinateChecked] = useState(false);
  const [detailsDress, setDetailsDress] = useState<Dress | null>(null);

  // אינדקס גלריה לכל כרטיס
  const [currentImageIndexes, setCurrentImageIndexes] = useState<{ [key: string]: number }>({});
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // אקורדיון FAQ פעיל
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const [rateDress, setRateDress] = useState<Dress | null>(null);
  const [paymentStep, setPaymentStep] = useState<{
    bookingId: number;
    amount: number;
    platformFee: number;
    ownerPayout: number;
    paymentUrl: string | null;
    mockMode: boolean;
  } | null>(null);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  // טעינת שמלות ותגובות
  useEffect(() => {
    async function loadDresses() {
      try {
        const response = await fetch('/api/dresses');
        if (!response.ok) {
          setDressesList([]);
          return;
        }

        const data: Dress[] = await response.json();
        setDressesList(
          Array.isArray(data)
            ? data.map((dress) => ({
                ...dress,
                id: String(dress.id),
                price: Number(dress.price),
                images: Array.isArray(dress.images) ? dress.images : [],
                city: dress.city || '',
                color: dress.color || '',
                event_type: dress.event_type || '',
                owner_name: dress.owner_name || '',
                owner_phone: dress.owner_phone || '',
                deposit: Number(dress.deposit || 0),
                pickup_method: dress.pickup_method || 'pickup',
                includes_dry_cleaning: Boolean(dress.includes_dry_cleaning),
                booked_dates: Array.isArray(dress.booked_dates) ? dress.booked_dates : [],
                rental_count: Number(dress.rental_count || 0),
                rating_avg: Number(dress.rating_avg || 0),
                rating_count: Number(dress.rating_count || 0),
                created_at: dress.created_at,
              }))
            : []
        );
      } catch (error) {
        console.error('Failed to load dresses:', error);
        setDressesList([]);
      } finally {
        setIsLoadingDresses(false);
      }
    }

    loadDresses();
  }, []);

  useEffect(() => {
    async function loadReviews() {
      try {
        const response = await fetch('/api/reviews');
        if (!response.ok) {
          setReviewsList([]);
          return;
        }

        const data: Review[] = await response.json();
        setReviewsList(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load reviews:', error);
        setReviewsList([]);
      } finally {
        setIsLoadingReviews(false);
      }
    }

    loadReviews();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success') {
      alert('התשלום אושר! השריון שלך מאושר. ניצור קשר בהקדם.');
      window.history.replaceState({}, '', '/');
    } else if (payment === 'fail') {
      alert('התשלום לא הושלם. נסי שוב או צרי קשר.');
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.name.trim() || !newReview.text.trim()) {
      alert('אנא מלאי שם ותוכן תגובה');
      return;
    }

    setIsSubmittingReview(true);

    try {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newReview.name.trim(),
          role: newReview.role.trim() || 'לקוחה',
          text: newReview.text.trim(),
          stars: newReview.stars,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'לא הצלחנו לשלוח את התגובה');
        return;
      }

      setIsAddReviewOpen(false);
      setNewReview({ name: '', role: '', text: '', stars: 5 });
      alert(data.message || 'תודה! התגובה נשלחה.');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('תקלה בשליחת התגובה. נסי שוב.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleToggleFavorite = (dress: Dress, e: React.MouseEvent) => {
    toggleFavorite(dress, e);
  };

  const handleToggleCart = (dress: Dress, e: React.MouseEvent) => {
    toggleCart(dress, e);
  };

  const nextImage = (dressId: string, maxImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndexes(prev => ({ ...prev, [dressId]: (prev[dressId] + 1) % maxImages }));
  };

  const prevImage = (dressId: string, maxImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndexes(prev => ({ ...prev, [dressId]: (prev[dressId] - 1 + maxImages) % maxImages }));
  };

  const checkDateAvailability = (date: string, dress: Dress) => {
    return !dress.booked_dates?.includes(date);
  };

  const handleDateChange = (date: string) => {
    setOrderDate(date);
    if (selectedDress && !checkDateAvailability(date, selectedDress)) {
      setDateError('השמלה תפוסה בתאריך הזה. בחרי תאריך אחר.');
    } else {
      setDateError('');
    }
  };

  const finishSuccessfulBooking = () => {
    if (!selectedDress) return;
    setDressesList((prev) =>
      prev.map((d) =>
        d.id === selectedDress.id
          ? {
              ...d,
              booked_dates: [...(d.booked_dates || []), orderDate],
              rental_count: (d.rental_count || 0) + 1,
            }
          : d
      )
    );
    setIsOrdered(true);
    setPaymentStep(null);
    notifyBookingUpdated();
    setTimeout(() => {
      setIsOrdered(false);
      setSelectedDress(null);
      setOrderName('');
      setOrderPhone('');
      setOrderEmail('');
      setOrderDate('');
    }, 4000);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderName || !orderPhone || !orderEmail || !orderDate || !selectedDress) return;
    if (!checkDateAvailability(orderDate, selectedDress)) return;

    try {
      const token = sessionStorage.getItem('site_token');
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-user-token': token } : {}),
        },
        body: JSON.stringify({
          dressId: selectedDress.id,
          name: orderName,
          phone: orderPhone,
          email: orderEmail,
          date: orderDate,
          dressName: selectedDress.name,
          dressPrice: selectedDress.price,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.error || 'הייתה בעיה ברישום ההזמנה');
        return;
      }

      if (data.confirmedImmediately) {
        finishSuccessfulBooking();
        return;
      }

      notifyBookingUpdated();

      setPaymentStep({
        bookingId: data.bookingId,
        amount: data.amount,
        platformFee: data.platformFee,
        ownerPayout: data.ownerPayout,
        paymentUrl: data.paymentUrl,
        mockMode: data.mockMode,
      });
    } catch (error) {
      console.error('Error:', error);
      alert('תקלה בתקשורת עם השרת');
    }
  };

  const handleConfirmMockPayment = async () => {
    if (!paymentStep || !selectedDress) return;
    setIsConfirmingPayment(true);
    try {
      if (!paymentStep.bookingId) {
        finishSuccessfulBooking();
        return;
      }

      const response = await fetch('/api/payments/create', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: paymentStep.bookingId }),
      });
      const data = await response.json();
      if (data.success) {
        finishSuccessfulBooking();
      } else {
        alert(data.error || 'שגיאה באישור תשלום');
      }
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const handleDressRated = (dressId: string, ratingAvg: number, ratingCount: number) => {
    setDressesList((prev) =>
      prev.map((d) => (d.id === dressId ? { ...d, rating_avg: ratingAvg, rating_count: ratingCount } : d))
    );
  };

  const setDressImageIndex = (dressId: string, index: number, maxImages: number) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [dressId]: (index + maxImages) % maxImages,
    }));
  };

  const resetAddDressForm = () => {
    newDressData.images.forEach((url) => URL.revokeObjectURL(url));
    setNewDressData({
      name: '', price: '', size: '', color: '', city: '', event_type: '',
      owner_name: '', owner_phone: '', owner_email: '', deposit: '', pickup_method: 'pickup',
      includes_dry_cleaning: 'no',
      condition: 'new', description: '', images: [],
    });
    setNewDressFiles([]);
    if (newDressFileInputRef.current) newDressFileInputRef.current.value = '';
  };

  const removeNewDressImage = (index: number) => {
    URL.revokeObjectURL(newDressData.images[index]);
    setNewDressFiles((prev) => prev.filter((_, i) => i !== index));
    setNewDressData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    if (newDressFileInputRef.current) newDressFileInputRef.current.value = '';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const urlsArray = filesArray.map(file => URL.createObjectURL(file));
      setNewDressFiles(prev => [...prev, ...filesArray]);
      setNewDressData(prev => ({
        ...prev,
        images: [...prev.images, ...urlsArray]
      }));
    }
  };

  const handleAddDressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDressData.name || !newDressData.price || !newDressData.size) {
      alert('אנא מלאי שדות חובה (שם, מחיר ומידה)');
      return;
    }

    if (newDressFiles.length === 0) {
      alert('יש להעלות לפחות תמונה אחת של השמלה');
      return;
    }

    setIsSubmittingDress(true);

    try {
      const formData = new FormData();
      formData.append('name', newDressData.name);
      formData.append('price', newDressData.price);
      formData.append('size', newDressData.size);
      formData.append('condition', newDressData.condition);
      formData.append('color', newDressData.color);
      formData.append('city', newDressData.city);
      formData.append('event_type', newDressData.event_type);
      formData.append('owner_name', newDressData.owner_name);
      formData.append('owner_phone', newDressData.owner_phone);
      formData.append('owner_email', newDressData.owner_email);
      formData.append('deposit', newDressData.deposit || '0');
      formData.append('pickup_method', newDressData.pickup_method);
      formData.append('includes_dry_cleaning', newDressData.includes_dry_cleaning);
      formData.append('description', newDressData.description);
      newDressFiles.forEach((file) => formData.append('images', file));

      const response = await fetch('/api/dresses/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'לא הצלחנו לשלוח את השמלה לאישור');
        return;
      }

      setIsAddDressOpen(false);
      resetAddDressForm();
      alert(data.message || 'השמלה נשלחה לאישור! היא תופיע באתר לאחר אישור בדף הניהול.');
    } catch (error) {
      console.error('Error submitting dress:', error);
      alert('תקלה בשליחת השמלה. נסי שוב.');
    } finally {
      setIsSubmittingDress(false);
    }
  };

  const filteredDresses = dressesList
    .filter((dress) => {
      const matchesSearch = dress.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCity = !selectedCity || dress.city === selectedCity;
      const matchesPrice = dress.price <= maxPrice;
      const matchesSize = selectedSize === 'All' || dress.size === selectedSize;
      const matchesColor = !selectedColor || dress.color.toLowerCase().includes(selectedColor.toLowerCase());
      const matchesEvent = !selectedEventType || dress.event_type === selectedEventType;
      const matchesFav = !showOnlyFavorites || isDressFavorite(dress.id);
      return matchesSearch && matchesCity && matchesPrice && matchesSize && matchesColor && matchesEvent && matchesFav;
    })
    .sort((a, b) => compareDresses(a, b, sortBy));

  const uniqueColors = [...new Set(dressesList.map((d) => d.color).filter(Boolean))];
  const uniqueCities = [...new Set(dressesList.map((d) => d.city).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'he')
  );

  const coordinateAvailable =
    coordinateDress && coordinateDate
      ? checkDateAvailability(coordinateDate, coordinateDress)
      : false;

  const openCoordinate = (dress: Dress) => {
    setCoordinateDress(dress);
    setCoordinateDate('');
    setCoordinateChecked(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fbf8f0] via-[#f3ebd6] to-[#e8dcbd] text-[#332c1e] pb-24 relative overflow-x-clip w-full max-w-[100vw]" dir="rtl">
      
      {/* 🌟 מפל נצנצים וחלקיקי זהב זוהרים */}
      <div 
        className="absolute inset-0 opacity-[0.25] pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle, #d4af37 1px, transparent 1px),
            radial-gradient(circle, #f3e5ab 1.5px, transparent 1.5px),
            radial-gradient(circle, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px, 45px 45px, 20px 20px',
          backgroundPosition: '0 0, 15px 20px, 5px 5px'
        }}
      ></div>

      {/* הילות אור נוצצות */}
      <div className="absolute top-[-10%] right-[5%] w-[min(800px,120vw)] h-[min(500px,70vh)] bg-gradient-to-br from-[#ffd700]/20 to-[#fff8dc]/40 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-[40%] left-[-10%] w-[min(600px,100vw)] h-[min(600px,80vh)] bg-[#fdf5e6]/50 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 🛍️ סרגל עליון */}
      <SiteHeader />

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pt-10 pb-6 text-center">
        <p className="mb-3 text-[11px] tracking-[0.28em] text-[#9a7b4f] font-[family-name:var(--font-luxury)]">
          ✦ תיווך השכרת שמלות בין בנות ✦
        </p>
        <h1 className="font-[family-name:var(--font-luxury)] text-3xl sm:text-4xl md:text-5xl text-[#3d2f24] leading-tight px-2">
          <span className="font-light">שמלה</span>{' '}
          <span className="bg-gradient-to-l from-[#c9a227] via-[#e8c547] to-[#a67c00] bg-clip-text text-transparent">בקליק</span>
        </h1>
        <p className="mt-4 text-sm text-[#554a33] max-w-xl mx-auto leading-relaxed">
          יש לך שמלה בארון? פרסמי אותה — ככל שיותר בנות שוכרות דרכך, השמלה שלך תופיע ראשונה ותקבל יותר חשיפה.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <button onClick={() => setIsAddDressOpen(true)} className="px-6 py-3 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white rounded-xl text-sm font-bold shadow-lg">
            👗 יש לי שמלה — פרסמי
          </button>
          <a href="#catalog" className="px-6 py-3 bg-white/90 border border-[#decfa8] text-[#8b6508] rounded-xl text-sm font-bold">
            🔍 מחפשת שמלה — לקטלוג
          </a>
        </div>
      </section>

      {/* 🔍 סינונים */}
      <section id="catalog" className="max-w-6xl mx-auto px-4 mb-14 relative z-10">
        <div className="bg-white/90 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border-2 border-[#e6c687] shadow-[0_20px_50px_rgba(212,175,55,0.18)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
          <div className="flex flex-col">
            <label className="block text-xs font-black text-[#8b6508] mb-2">חיפוש</label>
            <input type="text" placeholder="שם שמלה..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-3 bg-neutral-50/50 border border-[#dfc48c] rounded-xl text-xs focus:outline-none focus:border-[#d4af37]" />
          </div>
          <div className="flex flex-col">
            <label className="block text-xs font-black text-[#8b6508] mb-2">עיר</label>
            <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full p-3 bg-neutral-50 border border-[#dfc48c] rounded-xl text-xs">
              <option value="">כל הערים</option>
              {uniqueCities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="block text-xs font-black text-[#8b6508] mb-2">מידה</label>
            <div className="flex gap-1 bg-[#f5ebd2] p-1 rounded-xl border border-[#dec085] min-h-[42px] items-center">
              {['All', 'S', 'M', 'L'].map((size) => (
                <button key={size} onClick={() => setSelectedSize(size)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${selectedSize === size ? 'bg-[#d4af37] text-white' : 'text-[#6d5b3a]'}`}>
                  {size === 'All' ? 'הכל' : size}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="block text-xs font-black text-[#8b6508] mb-2">סוג אירוע</label>
            <select value={selectedEventType} onChange={(e) => setSelectedEventType(e.target.value)} className="w-full p-3 bg-neutral-50 border border-[#dfc48c] rounded-xl text-xs">
              <option value="">הכל</option>
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="block text-xs font-black text-[#8b6508] mb-2">מיון</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="w-full p-3 bg-neutral-50 border border-[#dfc48c] rounded-xl text-xs">
              <option value="newest">חדש ביותר</option>
              <option value="price-asc">מחיר: נמוך לגבוה</option>
              <option value="price-desc">מחיר: גבוה לנמוך</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="block text-xs font-black text-[#8b6508] mb-2">צבע</label>
            <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className="w-full p-3 bg-neutral-50 border border-[#dfc48c] rounded-xl text-xs">
              <option value="">הכל</option>
              {uniqueColors.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 flex flex-col">
            <div className="flex justify-between text-xs font-black text-[#8b6508] mb-2">
              <span>מחיר מקסימלי</span>
              <span>₪{maxPrice}</span>
            </div>
            <input type="range" min="100" max="2000" step="50" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[#d4af37] mt-2" />
          </div>
        </div>
        <p className="text-[9px] text-[#9a7b4f] mt-2 text-center sm:text-right">תמיד מוצג קודם לפי הכי מושכרות</p>
      </section>

      {/* 👗 גלריית השמלות */}
      <section className="max-w-6xl mx-auto px-4 relative z-10">
        {isLoadingDresses ? (
          <div className="text-center py-16 text-[#8b6508] text-sm font-medium">טוענת קולקציה...</div>
        ) : filteredDresses.length === 0 ? (
          <div className="text-center py-16 bg-white/70 rounded-2xl border border-[#eadaaf] shadow-sm">
            <p className="text-lg font-[family-name:var(--font-luxury)] text-[#3d2f24] mb-2">הקולקציה ריקה כרגע</p>
            <p className="text-sm text-[#6e634c] max-w-md mx-auto leading-relaxed">
              שמלות יופיעו כאן רק אחרי שמשתמשות יוסיפו אותן ותאשרי אותן במייל.
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {filteredDresses.map((dress, index) => {
            const currentImgIndex = currentImageIndexes[dress.id] || 0;
            const isFav = isDressFavorite(dress.id);
            const inCart = isDressInCart(dress.id);
            const isTop = index < 3 && dress.rental_count > 0;
            return (
              <div 
                key={dress.id} 
                className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border-2 border-[#ebd3a4]/60 shadow-[0_10px_30px_rgba(212,175,55,0.06)] hover:shadow-[0_25px_60px_rgba(212,175,55,0.22)] hover:border-[#d4af37] transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* 📸 גלריית התמונות */}
                <div className="h-[240px] sm:h-[360px] lg:h-[430px] w-full relative overflow-hidden bg-[#faf8f3] p-2 sm:p-2.5">
                  <div className="w-full h-full rounded-xl overflow-hidden relative border border-[#f0e2c3]">
                    
                    <button 
                      onClick={(e) => handleToggleFavorite(dress, e)}
                      className="absolute top-3 left-3 z-10 bg-white/90 hover:bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-md border border-[#eadaaf] text-sm transition transform active:scale-90"
                    >
                      {isFav ? '❤️' : '🤍'}
                    </button>

                    <span className="absolute top-3 right-3 z-10 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white text-[10px] font-black px-3 py-1 rounded shadow-md">
                      מידה {dress.size}
                    </span>
                    {isTop && (
                      <span className="absolute top-12 right-3 z-10 bg-[#2c261a] text-[#f4ebd4] text-[9px] font-black px-2 py-0.5 rounded shadow-md">
                        🏆 TOP {index + 1}
                      </span>
                    )}

                    {/* חצים */}
                    {dress.images.length > 1 && (
                      <>
                        <button 
                          onClick={(e) => prevImage(dress.id, dress.images.length, e)}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 bg-white/95 text-[#b8860b] w-9 h-9 rounded-full flex items-center justify-center shadow-lg border border-[#e8cc92] font-black text-lg hover:bg-gradient-to-r hover:from-[#d4af37] hover:to-[#b8860b] hover:text-white transition-all"
                          aria-label="תמונה קודמת"
                        >
                          ‹
                        </button>
                        <button 
                          onClick={(e) => nextImage(dress.id, dress.images.length, e)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 bg-white/95 text-[#b8860b] w-9 h-9 rounded-full flex items-center justify-center shadow-lg border border-[#e8cc92] font-black text-lg hover:bg-gradient-to-r hover:from-[#d4af37] hover:to-[#b8860b] hover:text-white transition-all"
                          aria-label="תמונה הבאה"
                        >
                          ›
                        </button>
                      </>
                    )}

                    <img src={dress.images[currentImgIndex]} alt={dress.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />

                    {dress.images.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-white/95 px-2.5 py-1 rounded-full shadow-md border border-[#e0cba0]">
                        {dress.images.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDressImageIndex(dress.id, idx, dress.images.length);
                            }}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImgIndex ? 'bg-[#d4af37] w-3.5' : 'bg-[#e5d9bd] w-1.5 hover:bg-[#d4af37]/60'}`}
                            aria-label={`תמונה ${idx + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* פרטי השמלה והמחיר */}
                <div className="p-4 sm:p-5 flex flex-col flex-grow bg-gradient-to-b from-white to-[#fdfbf7]">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-lg font-bold text-neutral-900 tracking-wide group-hover:text-[#b8860b] transition-colors">{dress.name}</h3>
                    <button 
                      onClick={(e) => handleToggleCart(dress, e)}
                      className={`text-xs p-1.5 rounded-lg border transition ${
                        inCart ? 'bg-[#f4ebd4] border-[#d4af37] text-[#b8860b]' : 'border-neutral-200 hover:bg-neutral-50'
                      }`}
                      title={inCart ? "הסר מהסל" : "הוסף לסל שריונות מרוכז"}
                    >
                      {inCart ? '🛒 בסל' : '➕ לסל'}
                    </button>
                  </div>
                  <div className="mt-3">
                    <DressCardSummary dress={dress} onShowDetails={() => setDetailsDress(dress)} />
                  </div>
                  <div className="flex flex-col gap-3 mt-auto pt-4 border-t-2 border-dotted border-[#f0e6cc]">
                    <div>
                      <span className="text-[9px] text-[#b8860b] font-black">מחיר השכרה</span>
                      <p className="text-neutral-900 font-black text-xl">₪{dress.price}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openCoordinate(dress)}
                        className="w-full px-3 py-2.5 border-2 border-[#decfa8] bg-white text-[#8b6508] text-[11px] font-bold rounded-xl"
                      >
                        📅 תיאום עם המשכירה
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDress(dress);
                          setModalImageIndex(currentImgIndex);
                        }}
                        className="w-full bg-gradient-to-r from-[#2c261a] to-[#4a3f2b] hover:from-[#d4af37] hover:to-[#b8860b] text-white text-[11px] font-bold py-2.5 rounded-xl shadow-md"
                      >
                        שרייני עכשיו
                      </button>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setRateDress(dress); }}
                        className="px-3 py-2 border border-[#decfa8] rounded-xl text-xs text-[#8b6508]"
                      >
                        ⭐ דרגי
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const url = dressShareUrl(dress.name, dress.id);
                          if (navigator.share) navigator.share({ title: dress.name, url }).catch(() => {});
                          else navigator.clipboard.writeText(url);
                          alert('קישור לשמלה הועתק!');
                        }}
                        className="px-3 py-2 border border-[#decfa8] rounded-xl text-xs text-[#8b6508]"
                      >
                        📤 שתפי
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </section>

      {/* ✨ ממודאל חדש: שאלון הוספת שמלה לאתר ✨ */}
      {isAddDressOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border-2 border-[#d4af37] max-h-[90vh] overflow-y-auto" style={{ direction: 'rtl' }}>
            <button 
              onClick={() => {
                resetAddDressForm();
                setIsAddDressOpen(false);
              }} 
              className="absolute top-4 left-4 bg-neutral-100 hover:bg-[#d4af37] text-[#b8860b] hover:text-white w-8 h-8 rounded-full flex items-center justify-center border shadow-sm font-bold transition-all"
            >
              ✕
            </button>

            <div className="text-center mb-5">
              <span className="text-[10px] tracking-[0.2em] text-[#b8860b] font-black block mb-1">✦ פרסום שמלה ✦</span>
              <h3 className="text-xl font-black text-neutral-950">הוספת שמלה חדשה</h3>
              <div className="w-12 h-[1px] bg-[#d4af37] mx-auto mt-2"></div>
            </div>

            <form onSubmit={handleAddDressSubmit} className="flex flex-col gap-4">
              <OwnerPlatformNotice />
              {/* שם השמלה */}
              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">שם הדגם / השמלה *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="למשל: שמלת משי פנינה"
                  value={newDressData.name} 
                  onChange={(e) => setNewDressData({...newDressData, name: e.target.value})} 
                  className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* מחיר השכרה */}
                <div>
                  <label className="block text-xs font-bold text-[#8b6508] mb-1">מחיר השכרה (₪) *</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="350"
                    value={newDressData.price} 
                    onChange={(e) => setNewDressData({...newDressData, price: e.target.value})} 
                    className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]" 
                  />
                </div>

                {/* מידה */}
                <div>
                  <label className="block text-xs font-bold text-[#8b6508] mb-1">מידה *</label>
                  <select 
                    required
                    value={newDressData.size}
                    onChange={(e) => setNewDressData({...newDressData, size: e.target.value})}
                    className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="">בחרי...</option>
                    <option value="XS">XS (34)</option>
                    <option value="S">S (36)</option>
                    <option value="M">M (38)</option>
                    <option value="L">L (40)</option>
                    <option value="XL">XL (42)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-2">האם המחיר כולל ניקוי יבש? *</label>
                <div className="flex gap-3 bg-neutral-50 p-2.5 rounded-xl border border-[#decfa8]">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer flex-1 justify-center">
                    <input
                      type="radio"
                      name="includes_dry_cleaning"
                      value="yes"
                      checked={newDressData.includes_dry_cleaning === 'yes'}
                      onChange={(e) => setNewDressData({ ...newDressData, includes_dry_cleaning: e.target.value })}
                      className="accent-[#d4af37]"
                      required
                    />
                    כן, כלול במחיר
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer flex-1 justify-center">
                    <input
                      type="radio"
                      name="includes_dry_cleaning"
                      value="no"
                      checked={newDressData.includes_dry_cleaning === 'no'}
                      onChange={(e) => setNewDressData({ ...newDressData, includes_dry_cleaning: e.target.value })}
                      className="accent-[#d4af37]"
                    />
                    לא, לא כלול
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">צבע השמלה</label>
                <input type="text" placeholder="למשל: לבן שמנת, ורוד עתיק" value={newDressData.color} onChange={(e) => setNewDressData({...newDressData, color: e.target.value})} className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#8b6508] mb-1">עיר *</label>
                  <input type="text" required placeholder="ירושלים" value={newDressData.city} onChange={(e) => setNewDressData({...newDressData, city: e.target.value})} className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8b6508] mb-1">סוג אירוע</label>
                  <select value={newDressData.event_type} onChange={(e) => setNewDressData({...newDressData, event_type: e.target.value})} className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs">
                    <option value="">בחרי...</option>
                    {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#8b6508] mb-1">שם המשכירה *</label>
                  <input type="text" required value={newDressData.owner_name} onChange={(e) => setNewDressData({...newDressData, owner_name: e.target.value})} className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8b6508] mb-1">טלפון</label>
                  <input type="tel" placeholder="050-0000000" value={newDressData.owner_phone} onChange={(e) => setNewDressData({...newDressData, owner_phone: e.target.value})} className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs" dir="ltr" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">אימייל (אופציונלי)</label>
                <input type="email" placeholder="your@email.com" value={newDressData.owner_email} onChange={(e) => setNewDressData({...newDressData, owner_email: e.target.value})} className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs" dir="ltr" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#8b6508] mb-1">פיקדון (₪)</label>
                  <input type="number" min="0" placeholder="0" value={newDressData.deposit} onChange={(e) => setNewDressData({...newDressData, deposit: e.target.value})} className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8b6508] mb-1">קבלת השמלה</label>
                  <select value={newDressData.pickup_method} onChange={(e) => setNewDressData({...newDressData, pickup_method: e.target.value})} className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs">
                    {PICKUP_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>

              {/* מצב השמלה */}
              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-2">מצב השמלה</label>
                <div className="flex gap-4 bg-neutral-50 p-2.5 rounded-xl border border-[#decfa8] justify-around">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input 
                      type="radio" 
                      name="condition" 
                      value="new"
                      checked={newDressData.condition === 'new'}
                      onChange={(e) => setNewDressData({...newDressData, condition: e.target.value})}
                      className="accent-[#d4af37]"
                    />
                    חדש עם תווית
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input 
                      type="radio" 
                      name="condition" 
                      value="like-new"
                      checked={newDressData.condition === 'like-new'}
                      onChange={(e) => setNewDressData({...newDressData, condition: e.target.value})}
                      className="accent-[#d4af37]"
                    />
                    כמו חדש
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input 
                      type="radio" 
                      name="condition" 
                      value="used"
                      checked={newDressData.condition === 'used'}
                      onChange={(e) => setNewDressData({...newDressData, condition: e.target.value})}
                      className="accent-[#d4af37]"
                    />
                    יד שנייה
                  </label>
                </div>
              </div>

              {/* תיאור קצר */}
              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">תיאור השמלה וסוג הבד</label>
                <textarea 
                  rows={3}
                  placeholder="ספרי על השמלה, סוג הבד, התאמה לאירועים..."
                  value={newDressData.description} 
                  onChange={(e) => setNewDressData({...newDressData, description: e.target.value})} 
                  className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37] resize-none" 
                />
              </div>

              {/* העלאת תמונות */}
              <div className="bg-[#fffdf9] border border-[#eadaaf] rounded-xl p-3 text-[10px] text-[#6e634c] leading-relaxed">
                <strong className="text-[#8b6508]">טיפ לצילום:</strong> צלמי מהקדימה, מהצד ומהגב — על קולב או תלויה. תאורה טבעית עובדת הכי טוב!
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">העלאת תמונות של השמלה</label>
                <input 
                  ref={newDressFileInputRef}
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full p-2 bg-neutral-50 border border-dashed border-[#decfa8] rounded-xl text-xs file:ml-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#f4ebd4] file:text-[#8b6508] hover:file:bg-[#eadaaf] cursor-pointer"
                />
                {newDressData.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2 bg-neutral-50 p-2 rounded-xl border border-neutral-100">
                    {newDressData.images.map((img, index) => (
                      <div key={`${img}-${index}`} className="relative">
                        <img src={img} alt={`תצוגה ${index + 1}`} className="w-16 h-16 object-cover rounded-lg border border-[#decfa8]" />
                        <button
                          type="button"
                          onClick={() => removeNewDressImage(index)}
                          className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[#2c261a] text-white text-[10px] font-bold flex items-center justify-center shadow-md hover:bg-red-700 transition-colors"
                          aria-label="מחקי תמונה"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* כפתור אישור */}
              <button 
                type="submit"
                disabled={isSubmittingDress}
                className="w-full bg-gradient-to-r from-[#d4af37] via-[#b8860b] to-[#d4af37] hover:from-[#b8860b] hover:to-[#8b6508] disabled:opacity-60 text-white text-xs font-black py-3.5 rounded-xl shadow-lg mt-2 transition-transform active:scale-98"
              >
                {isSubmittingDress ? 'שולחת לאישור...' : 'שלחי לאישור ✨'}
              </button>
              <p className="text-[10px] text-[#8b6508] text-center leading-relaxed">
                השמלה תישלח אלייך למייל לאישור לפני פרסום.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* 💬 סקשן חוות דעת לקוחות */}
      <section className="max-w-6xl mx-auto px-4 mt-24 relative z-10">
        <div className="text-center mb-10">
          <span className="text-xs font-black text-[#b8860b] tracking-wide">חוויות אמיתיות</span>
          <h2 className="text-3xl font-serif italic text-neutral-900 mt-1">מה המשתמשות מספרות</h2>
          <div className="w-12 h-[1.5px] bg-[#d4af37] mx-auto mt-3"></div>
          <button
            onClick={() => setIsAddReviewOpen(true)}
            className="mt-5 px-5 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#b8860b] hover:from-[#b8860b] hover:to-[#8b6508] text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            ✍️ הוסיפי תגובה
          </button>
        </div>

        {isLoadingReviews ? (
          <div className="text-center py-10 text-[#8b6508] text-sm">טוענת תגובות...</div>
        ) : reviewsList.length === 0 ? (
          <div className="text-center py-10 bg-white/70 rounded-2xl border border-[#eadaaf]">
            <p className="text-sm text-[#6e634c]">עדיין אין תגובות. תהיי הראשונה לשתף!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviewsList.map((rev) => (
              <div key={rev.id} className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-[#eadaaf] shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex text-[#d4af37] gap-0.5 mb-3">
                    {Array.from({ length: rev.stars }).map((_, i) => <span key={i}>⭐</span>)}
                  </div>
                  <p className="text-xs text-[#554a33] italic leading-relaxed">&quot;{rev.text}&quot;</p>
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-900">{rev.name}</span>
                  <span className="text-[10px] bg-[#f4ebd4] text-[#8b6508] px-2 py-0.5 rounded-full font-bold">{rev.role}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ✍️ מודאל הוספת תגובה */}
      {isAddReviewOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border-2 border-[#d4af37] max-h-[90vh] overflow-y-auto" style={{ direction: 'rtl' }}>
            <button
              onClick={() => setIsAddReviewOpen(false)}
              className="absolute top-4 left-4 bg-neutral-100 hover:bg-[#d4af37] text-[#b8860b] hover:text-white w-8 h-8 rounded-full flex items-center justify-center border shadow-sm font-bold transition-all"
            >
              ✕
            </button>

            <div className="text-center mb-5">
              <span className="text-[10px] tracking-[0.2em] text-[#b8860b] font-black block mb-1">✦ שתפי חוויה ✦</span>
              <h3 className="text-xl font-black text-neutral-950">הוספת תגובה</h3>
              <div className="w-12 h-[1px] bg-[#d4af37] mx-auto mt-2"></div>
            </div>

            <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">שם מלא *</label>
                <input
                  type="text"
                  required
                  placeholder="למשל: מיכל אהרוני"
                  value={newReview.name}
                  onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                  className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">סוג אירוע / תפקיד</label>
                <input
                  type="text"
                  placeholder="למשל: כלה, מלווה, אירוע חברה"
                  value={newReview.role}
                  onChange={(e) => setNewReview({ ...newReview, role: e.target.value })}
                  className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-2">דירוג</label>
                <div className="flex gap-1 bg-neutral-50 p-2.5 rounded-xl border border-[#decfa8]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, stars: star })}
                      className={`text-xl transition-transform ${star <= newReview.stars ? 'scale-110' : 'opacity-40 grayscale'}`}
                      aria-label={`${star} כוכבים`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8b6508] mb-1">התגובה שלך *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="ספרי על החוויה שלך..."
                  value={newReview.text}
                  onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                  className="w-full p-2.5 bg-neutral-50 border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full bg-gradient-to-r from-[#d4af37] via-[#b8860b] to-[#d4af37] hover:from-[#b8860b] hover:to-[#8b6508] disabled:opacity-60 text-white text-xs font-black py-3.5 rounded-xl shadow-lg transition-transform active:scale-98"
              >
                {isSubmittingReview ? 'שולחת...' : 'שלחי תגובה ✨'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 👑 אזור שאלות נפוצות */}
      <section className="max-w-3xl mx-auto px-4 mt-24 relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif italic text-neutral-900">שאלות ותשובות נפוצות</h2>
          <div className="w-12 h-[1.5px] bg-[#d4af37] mx-auto mt-3"></div>
        </div>
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="bg-white border border-[#ebd4a8] rounded-xl overflow-hidden shadow-sm transition-all">
                <button 
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-right flex justify-between items-center font-bold text-xs text-neutral-900 hover:bg-neutral-50 transition"
                >
                  <span>{faq.q}</span>
                  <span className="text-[#b8860b] text-base">{isOpen ? '−' : '＋'}</span>
                </button>
                {isOpen && (
                  <div className="p-4 bg-[#fffdf9] border-t border-[#f7eed8] text-xs text-[#5c5037] leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 🛒 מודאל מגירה צידית - סל השריונות */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-50 flex justify-end p-0 sm:p-2">
          <div className="bg-white w-full max-w-md h-full sm:h-auto sm:max-h-[92vh] sm:rounded-l-2xl p-4 sm:p-6 shadow-2xl flex flex-col border-r-2 border-[#d4af37] overflow-hidden">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-200 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-neutral-900">סל השריונות שלך 🛒</h3>
              <button onClick={() => setIsCartOpen(false)} className="text-neutral-400 hover:text-black font-bold text-lg p-2">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 min-h-0">
              <SavedDressList
                items={cart}
                emptyMessage="הסל שלך עדיין ריק. הוסיפי שמלות כדי לבצע הזמנה מרוכזת."
                onRemove={removeFromCart}
                showTotal={cart.length > 0}
              />
            </div>

            {cart.length > 0 && (
              <div className="border-t border-neutral-200 pt-4 shrink-0">
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    const fullDress = dressesList.find((d) => d.id === cart[0].id) || null;
                    if (fullDress) setSelectedDress(fullDress);
                  }}
                  className="w-full bg-[#2c261a] hover:bg-[#b8860b] text-white text-xs font-bold py-3 rounded-xl transition shadow-md"
                >
                  המשכי לשריון
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔒 מודאל שריון קריסטלי חכם */}
      {selectedDress && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] sm:max-h-[85vh] overflow-hidden shadow-2xl relative flex flex-col md:flex-row border-2 border-[#d4af37]">
            <button 
              onClick={() => {
                setSelectedDress(null);
                setDateError('');
                setPaymentStep(null);
              }} 
              className="absolute top-4 left-4 z-30 bg-white hover:bg-[#d4af37] text-[#b8860b] hover:text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#ebd4a8] shadow-md font-bold transition-all"
            >
              ✕
            </button>

            {/* גלריה מודאל */}
            <div className="w-full md:w-1/2 h-48 md:h-auto relative bg-neutral-50 border-l border-[#f2e6cc]">
              {selectedDress.images.length > 1 && (
                <>
                  <button 
                    onClick={() => setModalImageIndex((prev) => (prev - 1 + selectedDress.images.length) % selectedDress.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/95 text-[#b8860b] w-8 h-8 rounded-full flex items-center justify-center shadow-md font-black"
                    aria-label="תמונה קודמת"
                  >
                    ‹
                  </button>
                  <button 
                    onClick={() => setModalImageIndex((prev) => (prev + 1) % selectedDress.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white/95 text-[#b8860b] w-8 h-8 rounded-full flex items-center justify-center shadow-md font-black"
                    aria-label="תמונה הבאה"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-white/95 px-2.5 py-1 rounded-full shadow-md border border-[#e0cba0]">
                    {selectedDress.images.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setModalImageIndex(idx)}
                        className={`h-1.5 rounded-full transition-all ${idx === modalImageIndex ? 'bg-[#d4af37] w-3.5' : 'bg-[#e5d9bd] w-1.5'}`}
                        aria-label={`תמונה ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
              <img src={selectedDress.images[modalImageIndex]} alt={selectedDress.name} className="w-full h-full object-cover" />
            </div>

            {/* טופס שריון בקליק */}
            <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto bg-gradient-to-b from-[#fffdf9] to-[#faf6eb]">
              {isOrdered ? (
                <div className="text-center my-auto py-10">
                  <span className="text-3xl block mb-2">✨ ✨ ✨</span>
                  <h3 className="text-xl font-black text-neutral-900">השריון והתשלום אושרו!</h3>
                  <p className="mt-2 text-[#5c5037] text-xs font-medium leading-relaxed">
                    אישור נשלח ל-<strong>{orderEmail}</strong>. ניצור קשר בהקדם לתיאום עם המשכירה.
                  </p>
                </div>
              ) : paymentStep ? (
                <div className="flex flex-col gap-4 my-auto">
                  <h3 className="text-lg font-black text-neutral-900">💳 תשלום מאובטח</h3>
                  <p className="text-xs text-[#5c5037]">השריון נשמר. השלימי תשלום דרך Tranzila כדי לאשר.</p>
                  <div className="bg-white border border-[#decfa8] rounded-xl p-4 text-xs">
                    <div className="flex justify-between font-black text-neutral-900">
                      <span>סה״כ לתשלום</span>
                      <span>₪{paymentStep.amount}</span>
                    </div>
                  </div>
                  {paymentStep.paymentUrl ? (
                    <>
                      <a
                        href={paymentStep.paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center py-3.5 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white text-xs font-black rounded-xl shadow-lg"
                      >
                        עברי לתשלום ב-Tranzila →
                      </a>
                      <p className="text-[10px] text-center text-[#9a7b4f]">אחרי התשלום תוחזרי לאתר עם אישור</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] bg-amber-50 border border-amber-200 rounded-lg p-2 text-amber-800">
                        מצב בדיקה — Tranzila לא מוגדר. לחצי לאישור תשלום מדומה.
                      </p>
                      <button
                        type="button"
                        onClick={handleConfirmMockPayment}
                        disabled={isConfirmingPayment}
                        className="w-full py-3.5 bg-[#2c261a] text-white text-xs font-black rounded-xl disabled:opacity-60"
                      >
                        {isConfirmingPayment ? 'מאשרת...' : '✓ אישור תשלום (בדיקה)'}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setPaymentStep(null)}
                    className="text-xs text-[#8b6508] hover:underline"
                  >
                    ← חזרה לפרטים
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePlaceOrder} className="flex flex-col gap-3">
                  <div>
                    <span className="text-[9px] tracking-widest bg-gradient-to-r from-[#b8860b] to-[#d4af37] bg-clip-text text-transparent font-black block mb-1">
                      ✦ שריון שמלה ✦
                    </span>
                    <h3 className="text-xl font-bold text-neutral-950 tracking-wide">{selectedDress.name}</h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                      <span className="bg-[#f4ebd4] text-[#8b6508] px-2 py-0.5 rounded-full font-bold">מידה {selectedDress.size}</span>
                      {selectedDress.city && <span className="bg-neutral-100 px-2 py-0.5 rounded-full">📍 {selectedDress.city}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetailsDress(selectedDress)}
                      className="mt-2 text-[11px] font-bold text-[#b8860b] underline"
                    >
                      ℹ️ פרטים מלאים
                    </button>
                    <div className="mt-3 bg-gradient-to-r from-[#fdfcf7] to-[#f4ebd4] p-3 rounded-xl border border-[#decfa8] shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#5c5037] font-bold">סה״כ לתשלום:</span>
                        <span className="text-base font-black text-neutral-950">₪{selectedDress.price}</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-[1px] bg-[#ebdcb6] my-0.5"></div>

                  <h4 className="text-xs font-black text-[#8b6508] tracking-wide">פרטי קשר לשריון מידי</h4>
                  
                  <input type="text" placeholder="שם מלא" required value={orderName} onChange={(e) => setOrderName(e.target.value)} className="p-3 bg-white border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]" />
                  <input type="tel" placeholder="מספר טלפון זמין" required value={orderPhone} onChange={(e) => setOrderPhone(e.target.value)} className="p-3 bg-white border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]" />
                  <input type="email" placeholder="כתובת אימייל לאישור קליל" required value={orderEmail} onChange={(e) => setOrderEmail(e.target.value)} className="p-3 bg-white border border-[#decfa8] rounded-xl text-xs font-medium text-left focus:outline-none focus:border-[#d4af37]" dir="ltr" />
                  
                  <div className="flex flex-col">
                    <label className="text-[10px] text-[#8b6508] font-black mb-1">תאריך האירוע החגיגי שלך</label>
                    <input 
                      type="date" 
                      required 
                      value={orderDate} 
                      onChange={(e) => handleDateChange(e.target.value)} 
                      className="p-3 bg-white border border-[#decfa8] rounded-xl text-xs text-right font-medium focus:outline-none focus:border-[#d4af37]" 
                    />
                    {dateError && (
                      <p className="text-[11px] text-red-600 font-bold mt-1 bg-red-50 p-2 rounded-lg border border-red-200">
                        {dateError}
                      </p>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={!!dateError}
                    className={`w-full text-white text-xs font-black py-3.5 rounded-xl mt-1 transition-all duration-300 shadow-lg transform active:scale-98 ${
                      dateError 
                        ? 'bg-neutral-300 cursor-not-allowed shadow-none' 
                        : 'bg-gradient-to-r from-[#d4af37] via-[#b8860b] to-[#d4af37] hover:from-[#b8860b] hover:to-[#8b6508]'
                    }`}
                  >
                    המשכי לתשלום מאובטח
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {detailsDress && (
        <DressDetailsModal dress={detailsDress} onClose={() => setDetailsDress(null)} />
      )}

      {rateDress && (
        <DressRateModal
          dress={rateDress}
          onClose={() => setRateDress(null)}
          onRated={handleDressRated}
        />
      )}

      {coordinateDress && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-[#d4af37] relative">
            <button
              onClick={() => {
                setCoordinateDress(null);
                setCoordinateDate('');
                setCoordinateChecked(false);
              }}
              className="absolute top-4 left-4 bg-neutral-100 hover:bg-[#d4af37] text-[#b8860b] w-8 h-8 rounded-full flex items-center justify-center border font-bold"
            >
              ✕
            </button>
            <h3 className="text-lg font-black text-neutral-900 mb-1">תיאום עם המשכירה</h3>
            <p className="text-xs text-[#6e634c] mb-4">{coordinateDress.name}</p>

            <label className="text-[10px] text-[#8b6508] font-black mb-1 block">בחרי תאריך אירוע</label>
            <input
              type="date"
              value={coordinateDate}
              onChange={(e) => {
                setCoordinateDate(e.target.value);
                setCoordinateChecked(false);
              }}
              className="w-full p-3 border border-[#decfa8] rounded-xl text-xs mb-3"
            />

            <button
              type="button"
              disabled={!coordinateDate}
              onClick={() => setCoordinateChecked(true)}
              className="w-full py-2.5 bg-[#2c261a] text-white text-xs font-bold rounded-xl disabled:opacity-50 mb-4"
            >
              בדקי זמינות
            </button>

            {coordinateChecked && coordinateDate && !coordinateAvailable && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-bold">
                השמלה תפוסה בתאריך הזה. בחרי תאריך אחר.
              </div>
            )}

            {coordinateChecked && coordinateDate && coordinateAvailable && (
              <div className="bg-[#f4ebd4] border border-[#decfa8] rounded-xl p-4 space-y-2">
                <p className="text-xs font-black text-[#3d2f24]">✓ השמלה פנויה! פרטי המשכירה:</p>
                <p className="text-sm font-bold">{coordinateDress.owner_name || 'משכירה'}</p>
                {coordinateDress.owner_phone ? (
                  <p className="text-xs" dir="ltr">{coordinateDress.owner_phone}</p>
                ) : (
                  <p className="text-xs text-[#6e634c]">טלפון לא זמין — פני דרך האתר</p>
                )}
                {coordinateDress.owner_phone && (
                  <a
                    href={ownerWhatsAppLink(coordinateDress.owner_phone, coordinateDress.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-2.5 bg-[#25D366] text-white text-xs font-bold rounded-xl mt-2"
                  >
                    שלחי הודעה בוואטסאפ →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <SiteFooter />

      <a 
        href={WHATSAPP_LINK}
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 bg-[#25D366] text-white p-3 sm:p-3.5 rounded-full shadow-[0_8px_30px_rgba(37,211,102,0.4)] hover:bg-[#20ba5a] transition-all hover:scale-105 flex items-center justify-center font-bold text-base sm:text-lg"
        title="WhatsApp"
      >
        💬
      </a>

    </main>
  );
}
