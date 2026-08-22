import { todayDateString } from '@/lib/booking-dates';

export const RETENTION_DAYS = 30;

/** הודעה בקטע «הזמנות שהאירוע שלהן עבר» */
export const BOOKINGS_PAST_RETENTION_NOTE =
  'מוצגות כאן רק הזמנות שהאירוע שלהן כבר עבר, מהחודש האחרון. הזמנות ישנות יותר מוסרות מהתצוגה אוטומטית.';

export const BOOKINGS_PAST_SECTION_TITLE = 'הזמנות שהאירוע שלהן עבר';

/** כותרת וקטע «הזמנות שבוטלו» ב«השמלות שלי» */
export const BOOKINGS_CANCELLED_SECTION_TITLE = 'הזמנות שבוטלו';

export const BOOKINGS_CANCELLED_RETENTION_NOTE =
  'מוצגות כאן הזמנות שבוטלו מהחודש האחרון. הזמנות ישנות יותר יוסרו מהתצוגה אוטומטית.';

export function cancelledBookingReferenceDate(booking: {
  owner_responded_at?: string | null;
  created_at?: string | null;
}): string {
  const reference = booking.owner_responded_at || booking.created_at;
  return reference ? reference.slice(0, 10) : '';
}

export function shouldShowCancelledBooking(
  referenceDate: string,
  today = todayDateString()
): boolean {
  if (!referenceDate) return false;
  return referenceDate >= retentionCutoffDateString(today);
}

export function filterCancelledBookingsWithinRetention<
  T extends { status?: string; owner_responded_at?: string | null; created_at?: string | null },
>(bookings: T[], today = todayDateString()): T[] {
  return bookings.filter(
    (booking) =>
      booking.status === 'cancelled' &&
      shouldShowCancelledBooking(cancelledBookingReferenceDate(booking), today)
  );
}

export function retentionCutoffDateString(today = todayDateString()): string {
  const date = new Date(`${today}T12:00:00`);
  date.setDate(date.getDate() - RETENTION_DAYS);
  return date.toISOString().slice(0, 10);
}

/** הזמנות עתידיות תמיד; היסטוריה רק 30 יום אחרי תאריך האירוע */
export function shouldShowBookingByEventDate(
  eventDate: string,
  status?: string,
  today = todayDateString()
): boolean {
  if (!eventDate) return false;
  if (status === 'pending_payment' || status === 'awaiting_admin_approval' || status === 'pending_owner_approval') {
    return true;
  }
  if (eventDate >= today) return true;
  return eventDate >= retentionCutoffDateString(today);
}

/** שמלה שהוסרה — מוצגת 30 יום ממועד ההסרה */
export function shouldShowRemovedDress(
  removedAt: string | null | undefined,
  createdAt?: string | null,
  today = todayDateString()
): boolean {
  const cutoff = retentionCutoffDateString(today);
  const reference = removedAt || createdAt;
  if (!reference) return false;
  return reference.slice(0, 10) >= cutoff;
}

export function filterBookingsWithinRetention<T extends { event_date: string; status?: string }>(
  bookings: T[],
  today = todayDateString()
): T[] {
  return bookings.filter((booking) =>
    shouldShowBookingByEventDate(booking.event_date, booking.status, today)
  );
}

export function filterRemovedDressesWithinRetention<
  T extends { status?: string; removed_at?: string | null; created_at?: string | null },
>(dresses: T[], today = todayDateString()): T[] {
  return dresses.filter((dress) => {
    if (dress.status !== 'removed') return true;
    return shouldShowRemovedDress(dress.removed_at, dress.created_at, today);
  });
}

export function dressRemovalPayload(now = new Date()): { status: 'removed'; removed_at: string } {
  return { status: 'removed', removed_at: now.toISOString() };
}
