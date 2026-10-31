'use client';

import { useState } from 'react';
import AdminBookingGridCard from '@/components/admin/AdminBookingGridCard';
import { ADMIN_DRESS_GRID_CLASS } from '@/components/admin/AdminCollapsibleSection';
import type { AdminBookingRow } from '@/lib/admin-types';
import { BOOKING_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/admin-types';

type AdminBookingsGridProps = {
  bookings: AdminBookingRow[];
  variant: 'pending_payment' | 'confirmed';
  onApprovePayment?: (id: number) => Promise<boolean>;
};

export default function AdminBookingsGrid({
  bookings,
  variant,
  onApprovePayment,
}: AdminBookingsGridProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  if (bookings.length === 0) {
    return (
      <p className="text-xs text-[#6e634c] p-4">
        {variant === 'pending_payment' ? 'אין הזמנות ממתינות לתשלום 🎉' : 'לא נמצאו הזמנות'}
      </p>
    );
  }

  async function approve(id: number) {
    if (!onApprovePayment) return;
    setBusyId(id);
    const ok = await onApprovePayment(id);
    setBusyId(null);
    if (ok) setExpandedId((prev) => (prev === id ? null : prev));
  }

  return (
    <div className={ADMIN_DRESS_GRID_CLASS}>
      {bookings.map((booking) => {
        const isOpen = expandedId === booking.id;
        const disabled = busyId === booking.id;
        const dressLabel = booking.dress_name || `שמלה #${booking.dress_id}`;

        if (variant === 'pending_payment') {
          return (
            <AdminBookingGridCard
              key={booking.id}
              booking={booking}
              isOpen={isOpen}
              disabled={disabled}
              onToggle={() => setExpandedId(isOpen ? null : booking.id)}
              title={dressLabel}
              line2={
                <>
                  <span className="block">העברה מ:</span>
                  <span dir="ltr" className="block font-bold text-[#3d2f24] break-all">
                    {booking.customer_phone}
                  </span>
                </>
              }
              line3={booking.event_date}
              badge={
                <span className="text-[8px] font-bold text-amber-800 bg-amber-50 px-1 py-0.5 rounded-full shrink-0">
                  תשלום
                </span>
              }
            >
              <p className="text-[9px] font-bold text-[#3d2f24] pt-1">{booking.customer_name}</p>
              <p className="text-[9px] text-[#6e634c]" dir="ltr">
                {booking.customer_email}
              </p>
              {booking.amount_total != null && (
                <p className="text-[10px] font-black text-[#8b6508]">₪{booking.amount_total}</p>
              )}
              {booking.payment_method && (
                <p className="text-[9px] text-[#6e634c]">
                  {PAYMENT_METHOD_LABELS[booking.payment_method] || booking.payment_method}
                </p>
              )}
              <p className="text-[9px] text-[#9a7b4f]">
                {new Date(booking.created_at).toLocaleDateString('he-IL')}
              </p>
              <button
                type="button"
                disabled={disabled}
                onClick={() => approve(booking.id)}
                className="w-full mt-1 px-2 py-1.5 bg-[#b8860b] text-white text-[9px] rounded-lg font-black disabled:opacity-50"
              >
                אשרי תשלום
              </button>
            </AdminBookingGridCard>
          );
        }

        return (
          <AdminBookingGridCard
            key={booking.id}
            booking={booking}
            isOpen={isOpen}
            onToggle={() => setExpandedId(isOpen ? null : booking.id)}
            title={booking.customer_name}
            line2={dressLabel}
            line3={booking.event_date}
            badge={
              <span className="text-[8px] font-bold text-green-800 bg-green-50 px-1 py-0.5 rounded-full shrink-0">
                אושר
              </span>
            }
          >
            <p className="text-[9px] text-[#6e634c] pt-1" dir="ltr">
              {booking.customer_phone}
            </p>
            <p className="text-[9px] text-[#6e634c]" dir="ltr">
              {booking.customer_email}
            </p>
            {booking.amount_total != null && (
              <p className="text-[10px] font-black text-[#8b6508]">₪{booking.amount_total}</p>
            )}
            {booking.payment_method && (
              <p className="text-[9px] text-[#6e634c]">
                {PAYMENT_METHOD_LABELS[booking.payment_method] || booking.payment_method}
              </p>
            )}
            <p className="text-[9px] text-[#9a7b4f]">
              {BOOKING_STATUS_LABELS[booking.status] || booking.status}
            </p>
            <p className="text-[9px] text-[#9a7b4f]">
              נוצר: {new Date(booking.created_at).toLocaleDateString('he-IL')}
            </p>
          </AdminBookingGridCard>
        );
      })}
    </div>
  );
}
