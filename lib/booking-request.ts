/** סטטוסים שמחזיקים תאריך «רך» עד אישור/ביטול */
export const DATE_HOLD_STATUSES = [
  'pending_owner_approval',
  'pending_payment',
  'awaiting_admin_approval',
  'confirmed',
] as const;

export type DateHoldStatus = (typeof DATE_HOLD_STATUSES)[number];

export function isDateHoldStatus(status: string): status is DateHoldStatus {
  return (DATE_HOLD_STATUSES as readonly string[]).includes(status);
}
