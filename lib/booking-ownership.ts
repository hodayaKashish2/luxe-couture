import { phonesMatch } from '@/lib/owner-auth';
import type { SiteUser } from '@/lib/user-auth';

function emailsMatch(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export type BookingOwnershipFields = {
  site_user_id?: string | number | null;
  customer_email?: string | null;
  customer_phone?: string | null;
};

export function userOwnsBooking(
  booking: BookingOwnershipFields,
  user: Pick<SiteUser, 'userId' | 'phone' | 'email'>
): boolean {
  if (user.userId && booking.site_user_id && String(booking.site_user_id) === String(user.userId)) {
    return true;
  }

  const bookingEmail = String(booking.customer_email || '').trim();
  const bookingPhone = String(booking.customer_phone || '').trim();

  if (user.email?.trim() && bookingEmail && emailsMatch(bookingEmail, user.email)) {
    return true;
  }

  if (user.phone?.trim() && bookingPhone && phonesMatch(bookingPhone, user.phone)) {
    return true;
  }

  return false;
}
