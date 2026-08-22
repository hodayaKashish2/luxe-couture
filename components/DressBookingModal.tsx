'use client';

import { useCallback, useEffect, useState } from 'react';
import DressImageFill from '@/components/DressImageFill';
import BookingPaymentStep from '@/components/BookingPaymentStep';
import BookingOwnerApprovalStep from '@/components/BookingOwnerApprovalStep';
import { FINAL_OWNER_APPROVAL_BUTTON_LABEL, FINAL_OWNER_APPROVAL_HINT } from '@/lib/constants';
import { notifyBookingUpdated } from '@/lib/booking-events';
import { getStoredSiteUser } from '@/lib/session-user';
import { isLoggedIn } from '@/lib/require-login';
import { getSiteToken } from '@/lib/site-session';
import { useAuthModal } from '@/components/AuthModalProvider';
import { isPastDate, todayDateString } from '@/lib/booking-dates';
import type { PaymentMethod } from '@/lib/payment-methods';
import type { Dress } from '@/lib/types';

function formatHebrewDate(date: string) {
  try {
    return new Date(`${date}T00:00:00`).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return date;
  }
}

export type DressBookingResume = {
  eventDate: string;
  payment?: {
    bookingId: number;
    amount: number;
    platformFee: number;
    ownerPayout: number;
    ownerApproved?: boolean;
  };
  ownerApproval?: {
    bookingId: number;
    amount: number;
    eventDate: string;
  };
};

type Props = {
  dress: Dress;
  onClose: () => void;
  resume?: DressBookingResume | null;
  initialImageIndex?: number;
  onComplete?: () => void;
  onViewDetails?: (dress: Dress) => void;
};

export default function DressBookingModal({
  dress,
  onClose,
  resume,
  initialImageIndex = 0,
  onComplete,
  onViewDetails,
}: Props) {
  const { openAuthModal } = useAuthModal();
  const [modalImageIndex, setModalImageIndex] = useState(initialImageIndex);
  const [orderName, setOrderName] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderEmail, setOrderEmail] = useState('');
  const [orderDate, setOrderDate] = useState(resume?.eventDate || '');
  const [dateError, setDateError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [isOrdered, setIsOrdered] = useState(false);
  const [orderOutcome, setOrderOutcome] = useState<'confirmed' | 'payment_reported' | null>(null);
  const [paymentStep, setPaymentStep] = useState<{
    bookingId: number;
    amount: number;
    platformFee: number;
    ownerPayout: number;
    ownerApproved?: boolean;
  } | null>(resume?.payment ?? null);
  const [ownerApprovalStep, setOwnerApprovalStep] = useState<{
    bookingId: number;
    amount: number;
    dressName: string;
    eventDate: string;
  } | null>(
    resume?.ownerApproval
      ? {
          bookingId: resume.ownerApproval.bookingId,
          amount: resume.ownerApproval.amount,
          dressName: dress.name,
          eventDate: formatHebrewDate(resume.ownerApproval.eventDate),
        }
      : null
  );

  useEffect(() => {
    const u = getStoredSiteUser();
    if (!u) return;
    setOrderName((prev) => prev || u.displayName || u.display_name || '');
    setOrderPhone((prev) => prev || u.phone || '');
    setOrderEmail((prev) => prev || u.email || '');
  }, []);

  const getDateValidationError = useCallback((date: string) => {
    if (!date) return '';
    if (isPastDate(date)) return 'לא ניתן לבחור תאריך שכבר עבר.';
    if (dress.booked_dates?.includes(date)) {
      return 'השמלה תפוסה בתאריך הזה. בחרי תאריך אחר.';
    }
    return '';
  }, [dress]);

  const handleDateChange = (date: string) => {
    setOrderDate(date);
    setDateError(getDateValidationError(date));
    setBookingError('');
  };

  const finishSuccessfulBooking = () => {
    setIsOrdered(true);
    setPaymentStep(null);
    setOrderOutcome('confirmed');
    notifyBookingUpdated();
    onComplete?.();
    setTimeout(() => {
      setIsOrdered(false);
      setOrderOutcome(null);
      onClose();
    }, 4000);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    if (!orderName || !orderPhone || !orderEmail || !orderDate) {
      setBookingError('יש למלא את כל השדות כולל אימייל');
      return;
    }
    const dateValidationError = getDateValidationError(orderDate);
    if (dateValidationError) {
      setDateError(dateValidationError);
      setBookingError(dateValidationError);
      return;
    }

    if (!isLoggedIn()) {
      openAuthModal({
        reason: 'booking',
        next: `/?reserve=${encodeURIComponent(dress.id)}`,
      });
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const token = getSiteToken();
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-user-token': token } : {}),
        },
        body: JSON.stringify({
          dressId: dress.id,
          name: orderName,
          phone: orderPhone,
          email: orderEmail,
          date: orderDate,
          dressName: dress.name,
          dressPrice: dress.price,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setBookingError(data.error || 'הייתה בעיה ברישום ההזמנה');
        return;
      }

      if (data.confirmedImmediately) {
        finishSuccessfulBooking();
        return;
      }

      notifyBookingUpdated();
      onComplete?.();

      if (data.awaitingOwnerApproval) {
        setOwnerApprovalStep({
          bookingId: data.bookingId,
          amount: data.amount,
          dressName: dress.name,
          eventDate: formatHebrewDate(orderDate),
        });
        return;
      }

      setOwnerApprovalStep(null);
      setPaymentStep({
        bookingId: data.bookingId,
        amount: data.amount,
        platformFee: data.platformFee,
        ownerPayout: data.ownerPayout,
        ownerApproved: Boolean(data.resumed),
      });
    } catch {
      setBookingError('תקלה בתקשורת עם השרת. נסי שוב.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleConfirmPayment = async (
    paymentMethod: PaymentMethod,
    sender: { name: string; phone: string }
  ) => {
    if (!paymentStep) return;
    setIsConfirmingPayment(true);
    try {
      if (!paymentStep.bookingId) {
        finishSuccessfulBooking();
        return;
      }

      const response = await fetch('/api/payments/create', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: paymentStep.bookingId,
          paymentMethod,
          paymentSenderName: sender.name,
          paymentSenderPhone: sender.phone,
        }),
      });
      const data = await response.json();
      if (data.success && data.awaitingAdminApproval) {
        setPaymentStep(null);
        setOrderOutcome('payment_reported');
        setIsOrdered(true);
        notifyBookingUpdated();
        onComplete?.();
        setTimeout(() => {
          setIsOrdered(false);
          setOrderOutcome(null);
          onClose();
        }, 6000);
        return;
      }
      if (data.success) {
        finishSuccessfulBooking();
      } else {
        alert(data.error || 'שגיאה באישור תשלום');
      }
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] sm:max-h-[85vh] overflow-hidden shadow-2xl relative flex flex-col md:flex-row border-2 border-[#d4af37]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 z-30 bg-white hover:bg-[#d4af37] text-[#b8860b] hover:text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#ebd4a8] shadow-md font-bold transition-all"
        >
          ✕
        </button>

        <div className="w-full md:w-1/2 h-48 md:h-auto relative bg-neutral-50 border-l border-[#f2e6cc] min-h-[280px] md:min-h-[420px]">
          {dress.images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setModalImageIndex((prev) => (prev - 1 + dress.images.length) % dress.images.length)
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/95 text-[#b8860b] w-8 h-8 rounded-full flex items-center justify-center shadow-md font-black"
                aria-label="תמונה קודמת"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setModalImageIndex((prev) => (prev + 1) % dress.images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white/95 text-[#b8860b] w-8 h-8 rounded-full flex items-center justify-center shadow-md font-black"
                aria-label="תמונה הבאה"
              >
                ›
              </button>
            </>
          )}
          <DressImageFill
            src={dress.images[modalImageIndex] || dress.images[0] || ''}
            alt={dress.name}
            className="absolute inset-0 h-full w-full"
          />
          {!dress.images.length && (
            <div className="absolute inset-0 flex items-center justify-center text-5xl text-[#decfa8]">👗</div>
          )}
        </div>

        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto bg-gradient-to-b from-[#fffdf9] to-[#faf6eb]">
          {isOrdered ? (
            <div className="text-center my-auto py-10">
              <span className="text-3xl block mb-2">{orderOutcome === 'payment_reported' ? '✅' : '✨ ✨ ✨'}</span>
              <h3 className="text-xl font-black text-neutral-900">
                {orderOutcome === 'payment_reported'
                  ? 'דיווח התשלום התקבל בהצלחה!'
                  : 'ההזמנה והתשלום אושרו!'}
              </h3>
              <p className="mt-2 text-[#5c5037] text-xs font-medium leading-relaxed">
                {orderOutcome === 'payment_reported' ? (
                  <>תודה! קיבלנו את דיווח התשלום — בקרוב תישלח אלייך הודעת אישור ל-<strong>{orderEmail}</strong>.</>
                ) : (
                  <>אישור נשלח ל-<strong>{orderEmail}</strong>. ההזמנה מאושרת — פרטי המשכירה ב«ההזמנות שלי».</>
                )}
              </p>
            </div>
          ) : paymentStep ? (
            <BookingPaymentStep
              amount={paymentStep.amount}
              isConfirming={isConfirmingPayment}
              ownerApproved={paymentStep.ownerApproved}
              onConfirmPayment={handleConfirmPayment}
              onBack={onClose}
            />
          ) : ownerApprovalStep ? (
            <BookingOwnerApprovalStep
              dressName={ownerApprovalStep.dressName}
              eventDate={ownerApprovalStep.eventDate}
              amount={ownerApprovalStep.amount}
              customerEmail={orderEmail}
              onBack={onClose}
            />
          ) : (
            <form onSubmit={handlePlaceOrder} className="flex flex-col gap-3">
              <div>
                <span className="text-[9px] tracking-widest bg-gradient-to-r from-[#b8860b] to-[#d4af37] bg-clip-text text-transparent font-black block mb-1">
                  ✦ הזמנת שמלה ✦
                </span>
                <h3 className="text-xl font-bold text-neutral-950 tracking-wide">{dress.name}</h3>
                {onViewDetails && (
                  <button
                    type="button"
                    onClick={() => onViewDetails(dress)}
                    className="mt-2 text-[11px] font-bold text-[#b8860b] underline"
                  >
                    ℹ️ פרטים מלאים
                  </button>
                )}
                <div className="mt-3 bg-gradient-to-r from-[#fdfcf7] to-[#f4ebd4] p-3 rounded-xl border border-[#decfa8] shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#5c5037] font-bold">סה״כ לתשלום:</span>
                    <span className="text-base font-black text-neutral-950">₪{dress.price}</span>
                  </div>
                </div>
              </div>

              <input
                type="text"
                placeholder="שם מלא"
                required
                value={orderName}
                onChange={(e) => setOrderName(e.target.value)}
                className="p-3 bg-white border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]"
              />
              <input
                type="tel"
                placeholder="מספר טלפון"
                required
                value={orderPhone}
                onChange={(e) => setOrderPhone(e.target.value)}
                className="p-3 bg-white border border-[#decfa8] rounded-xl text-xs font-medium focus:outline-none focus:border-[#d4af37]"
              />
              <input
                type="email"
                placeholder="אימייל"
                required
                value={orderEmail}
                onChange={(e) => setOrderEmail(e.target.value)}
                className="p-3 bg-white border border-[#decfa8] rounded-xl text-xs font-medium text-left focus:outline-none focus:border-[#d4af37]"
                dir="ltr"
              />

              <div className="flex flex-col">
                <label className="text-[10px] text-[#8b6508] font-black mb-1">תאריך האירוע</label>
                <input
                  type="date"
                  required
                  min={todayDateString()}
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

              {bookingError && (
                <p className="text-[11px] text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-200">
                  {bookingError}
                </p>
              )}

              <p className="text-[10px] text-[#6e634c] leading-relaxed bg-[#faf6eb] border border-[#ede3c8] rounded-xl p-3">
                {FINAL_OWNER_APPROVAL_HINT}
              </p>

              <button
                type="submit"
                disabled={!!dateError || isSubmittingBooking}
                className={`w-full text-white text-xs font-black py-3.5 rounded-xl mt-1 transition-all duration-300 shadow-lg ${
                  dateError || isSubmittingBooking
                    ? 'bg-neutral-300 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-[#d4af37] via-[#b8860b] to-[#d4af37] hover:from-[#b8860b] hover:to-[#8b6508]'
                }`}
              >
                {isSubmittingBooking ? 'שולחת בקשה...' : FINAL_OWNER_APPROVAL_BUTTON_LABEL}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
