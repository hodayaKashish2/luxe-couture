'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DressDetailsModal from '@/components/DressDetailsModal';
import DressRateModal from '@/components/DressRateModal';
import SiteToast, { type SiteToastVariant } from '@/components/SiteToast';
import { useLuxeStorage } from '@/components/LuxeStorageProvider';
import { getReserveButtonCopy } from '@/lib/booking-reserve-button';
import { fetchDressById } from '@/lib/dress-api';
import { shareDressLink } from '@/lib/share-dress';
import { getSiteToken } from '@/lib/site-session';
import type { Dress } from '@/lib/types';

type ActiveBooking = {
  canPay: boolean;
  awaitingOwner: boolean;
  awaitingAdmin: boolean;
};

function DressShareSkeleton() {
  return (
    <div
      className="fixed inset-0 bg-neutral-900/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      dir="rtl"
      aria-busy="true"
      aria-label="טוענת שמלה"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-4xl w-full max-h-[92vh] border-2 border-[#d4af37] overflow-hidden animate-pulse flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 min-h-[280px] md:min-h-[420px] bg-[#f4ebd4]" />
        <div className="w-full md:w-1/2 p-4 sm:p-6 space-y-3">
          <div className="h-6 bg-[#f4ebd4] rounded w-2/3" />
          <div className="h-4 bg-[#f4ebd4] rounded w-1/2" />
          <div className="h-4 bg-[#f4ebd4] rounded w-3/4" />
          <div className="h-10 bg-[#f4ebd4] rounded-xl w-full mt-6" />
          <div className="h-10 bg-[#f4ebd4] rounded-xl w-full" />
        </div>
      </div>
    </div>
  );
}

export default function DressSharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toggleCart, toggleFavorite, isDressInCart, isDressFavorite } = useLuxeStorage();
  const [dress, setDress] = useState<Dress | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null);
  const [rateDress, setRateDress] = useState<Dress | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: SiteToastVariant } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const loaded = await fetchDressById(id);
        if (cancelled) return;
        if (!loaded) {
          setNotFound(true);
          setDress(null);
          return;
        }
        setDress(loaded);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!dress) {
      setActiveBooking(null);
      return;
    }

    let cancelled = false;

    async function loadBooking() {
      try {
        const token = getSiteToken();
        const response = await fetch(`/api/bookings?dressId=${encodeURIComponent(dress!.id)}`, {
          headers: token ? { 'x-user-token': token } : {},
        });
        const data = await response.json();
        if (cancelled) return;

        if (response.ok && data.success && data.booking) {
          setActiveBooking({
            canPay: Boolean(data.booking.canPay),
            awaitingOwner: Boolean(data.booking.awaitingOwner),
            awaitingAdmin: Boolean(data.booking.awaitingAdmin),
          });
        } else {
          setActiveBooking(null);
        }
      } catch {
        if (!cancelled) setActiveBooking(null);
      }
    }

    void loadBooking();
    return () => {
      cancelled = true;
    };
  }, [dress]);

  const reserveButton = getReserveButtonCopy(activeBooking);

  const goHome = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleReserve = useCallback(() => {
    if (!dress) return;
    router.push(`/?reserve=${encodeURIComponent(dress.id)}`);
  }, [dress, router]);

  const handleCoordinate = useCallback(() => {
    if (!dress) return;
    router.push(`/?coordinate=${encodeURIComponent(dress.id)}`);
  }, [dress, router]);

  const shareDress = useCallback(async () => {
    if (!dress) return;
    await shareDressLink(
      dress,
      (message) => setToast({ message, variant: 'success' }),
      (message) => setToast({ message, variant: 'error' })
    );
  }, [dress]);

  if (loading) {
    return <DressShareSkeleton />;
  }

  if (notFound || !dress) {
    return (
      <main className="min-h-screen bg-[#fbf8f0] flex items-center justify-center p-4" dir="rtl">
        <div className="text-center bg-white rounded-2xl border border-[#eadaaf] p-8 max-w-md w-full shadow-sm">
          <p className="text-lg font-bold text-[#3d2f24] mb-2">השמלה לא נמצאה</p>
          <p className="text-sm text-[#6e634c] mb-6">ייתכן שהשמלה הוסרה מהאתר או שהקישור אינו תקין.</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white rounded-xl text-sm font-bold"
          >
            לקטלוג השמלות
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <DressDetailsModal
        dress={dress}
        onClose={goHome}
        isInCart={isDressInCart(dress.id)}
        isFavorite={isDressFavorite(dress.id)}
        reserveButtonLabel={reserveButton.label}
        reserveButtonHint={reserveButton.hint}
        onReserve={handleReserve}
        onCoordinate={handleCoordinate}
        onToggleCart={() => toggleCart(dress)}
        onToggleFavorite={() => toggleFavorite(dress)}
        onRate={() => setRateDress(dress)}
        onShare={() => void shareDress()}
      />

      {rateDress && (
        <DressRateModal
          dress={rateDress}
          onClose={() => setRateDress(null)}
          onRated={(dressId, ratingAvg, ratingCount) => {
            setDress((prev) =>
              prev?.id === dressId ? { ...prev, rating_avg: ratingAvg, rating_count: ratingCount } : prev
            );
            setRateDress((prev) =>
              prev?.id === dressId ? { ...prev, rating_avg: ratingAvg, rating_count: ratingCount } : prev
            );
          }}
          showBackToDetails
        />
      )}

      {toast && <SiteToast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}
    </>
  );
}
