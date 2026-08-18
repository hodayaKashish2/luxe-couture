export const PAYMENT_DEADLINE_DAYS = 7;

export const BOOKING_CANCEL_SLOT_TAKEN =
  'השמלה שוריינה על ידי שוכרת אחרת לאותו תאריך — הבקשה שלך בוטלה.';

export const BOOKING_CANCEL_PAYMENT_EXPIRED =
  'הבקשה בוטלה כי לא הושלם התשלום בזמן. התאריך שוחרר לשוכרות אחרות.';

export const BOOKING_SLOT_BLOCKED_USER_MESSAGE =
  'לצערנו, השמלה כבר שוריינה על ידי שוכרת אחרת לתאריך שבחרת. נסי תאריך אחר או שמלה אחרת.';

export function paymentDeadlineIso(from: string | Date): string {
  const base = new Date(from);
  base.setDate(base.getDate() + PAYMENT_DEADLINE_DAYS);
  return base.toISOString();
}

export function paymentDeadlineExpired(deadline: string | null | undefined, now = Date.now()): boolean {
  if (!deadline) return false;
  return new Date(deadline).getTime() <= now;
}

export function resolvePaymentDeadline(
  paymentDeadline: string | null | undefined,
  ownerRespondedAt: string | null | undefined
): string | null {
  if (paymentDeadline) return paymentDeadline;
  if (ownerRespondedAt) return paymentDeadlineIso(ownerRespondedAt);
  return null;
}

export function formatPaymentDeadlineHebrew(deadlineIso: string): string {
  try {
    return new Date(deadlineIso).toLocaleString('he-IL', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return deadlineIso;
  }
}
