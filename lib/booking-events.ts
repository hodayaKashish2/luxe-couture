export const BOOKING_UPDATED_EVENT = 'booking-updated';

export function notifyBookingUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BOOKING_UPDATED_EVENT));
  }
}
