import { FINAL_OWNER_APPROVAL_BUTTON_LABEL, FINAL_OWNER_APPROVAL_HINT } from '@/lib/constants';

export type ActiveBookingFlags = {
  canPay: boolean;
  awaitingOwner: boolean;
  awaitingAdmin: boolean;
};

export type ReserveButtonCopy = {
  label: string;
  hint: string;
};

export function bookingFlagsFromStatus(status: string): ActiveBookingFlags {
  return {
    canPay: status === 'pending_payment',
    awaitingOwner: status === 'pending_owner_approval',
    awaitingAdmin: status === 'awaiting_admin_approval',
  };
}

export function getReserveButtonCopy(
  booking: ActiveBookingFlags | null | undefined
): ReserveButtonCopy {
  if (!booking) {
    return {
      label: FINAL_OWNER_APPROVAL_BUTTON_LABEL,
      hint: FINAL_OWNER_APPROVAL_HINT,
    };
  }
  if (booking.canPay) {
    return {
      label: '💳 השלימי תשלום — המשכירה אישרה',
      hint: 'המשכירה אישרה את הבקשה — נשאר רק להשלים את התשלום דרך האתר.',
    };
  }
  if (booking.awaitingAdmin) {
    return {
      label: 'ממתינה לאישור תשלום',
      hint: 'דיווח התשלום התקבל — נעדכן אותך במייל ברגע שהאישור יושלם.',
    };
  }
  if (booking.awaitingOwner) {
    return {
      label: 'בקשה נשלחה — ממתינה לאישור',
      hint: 'פרטי המשכירה מופיעים ב«ההזמנות שלי» באזור האישי, תחת הזמנות ממתינות.',
    };
  }
  return {
    label: FINAL_OWNER_APPROVAL_BUTTON_LABEL,
    hint: FINAL_OWNER_APPROVAL_HINT,
  };
}

export function getSavedDressActionLabel(status: string | undefined): string {
  if (!status) return 'בקשת אישור סופי';
  return getReserveButtonCopy(bookingFlagsFromStatus(status)).label;
}
