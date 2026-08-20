export const BOOKING_RETURN_ACCOUNT_KEY = 'booking_return_account';

export function setBookingReturnAccount(section: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(BOOKING_RETURN_ACCOUNT_KEY, section);
}

export function peekBookingReturnAccount(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(BOOKING_RETURN_ACCOUNT_KEY);
}

export function consumeBookingReturnAccount(): string | null {
  if (typeof window === 'undefined') return null;
  const section = sessionStorage.getItem(BOOKING_RETURN_ACCOUNT_KEY);
  sessionStorage.removeItem(BOOKING_RETURN_ACCOUNT_KEY);
  return section;
}
