/** מחזיר ספרות ישראליות עם 0 בתחילה (9 או 10 ספרות), או null אם לא תקין */
export function parseIsraeliPhoneDigits(phone: string): string | null {
  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('972')) {
    digits = `0${digits.slice(3)}`;
  }

  // נייד בלי 0 בתחילה — למשל 501234567
  if (digits.length === 9 && !digits.startsWith('0')) {
    digits = `0${digits}`;
  }

  if (!digits.startsWith('0')) return null;
  if (digits.length !== 9 && digits.length !== 10) return null;

  return digits;
}

export function isValidIsraeliPhone(phone: string): boolean {
  return parseIsraeliPhoneDigits(phone) !== null;
}

export function formatPhoneForStorage(phone: string): string | null {
  return parseIsraeliPhoneDigits(phone);
}

export function formatPhoneForDisplay(phone: string): string {
  const parsed = parseIsraeliPhoneDigits(phone);
  if (parsed) return parsed;

  const trimmed = phone.trim();
  if (trimmed.startsWith('972')) return `0${trimmed.slice(3)}`;
  return trimmed;
}

export function phoneValidationMessage(): string {
  return 'נא להזין מספר טלפון ישראלי — מתחיל ב-0, 9 או 10 ספרות (למשל 0501234567 או 021234567)';
}
