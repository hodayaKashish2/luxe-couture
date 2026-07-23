const VALID_AREA_SECOND_DIGITS = new Set(['2', '3', '4', '5', '8', '9']);

/** מחזיר 10 ספרות ישראליות עם 0 בתחילה, או null אם לא תקין */
export function parseIsraeliPhoneDigits(phone: string): string | null {
  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('972')) {
    digits = `0${digits.slice(3)}`;
  }

  if (digits.length === 9 && !digits.startsWith('0')) {
    digits = `0${digits}`;
  }

  if (digits.length !== 10 || !digits.startsWith('0')) {
    return null;
  }

  if (!VALID_AREA_SECOND_DIGITS.has(digits[1]!)) {
    return null;
  }

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
  return 'נא להזין מספר ישראלי תקין — 10 ספרות, מתחיל ב-0 (למשל 0501234567)';
}
