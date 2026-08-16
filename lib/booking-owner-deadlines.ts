export const OWNER_RESPONSE_HOURS = 48;
export const OWNER_REMINDER_HOURS = 24;

export const OWNER_NO_RESPONSE_REASON =
  'הבקשה בוטלה אוטומטית כי המשכירה לא הגיבה בתוך 48 שעות.';

export function ownerResponseDeadlineIso(createdAt: string | Date): string {
  const base = new Date(createdAt);
  base.setHours(base.getHours() + OWNER_RESPONSE_HOURS);
  return base.toISOString();
}

export function ownerReminderDue(createdAt: string | Date, now = Date.now()): boolean {
  const base = new Date(createdAt).getTime();
  return now - base >= OWNER_REMINDER_HOURS * 60 * 60 * 1000;
}

export function ownerResponseExpired(deadline: string | null | undefined, now = Date.now()): boolean {
  if (!deadline) return false;
  return new Date(deadline).getTime() <= now;
}

export function formatDeadlineHebrew(deadlineIso: string): string {
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
