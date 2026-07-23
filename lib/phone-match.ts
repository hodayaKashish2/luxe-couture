import { parseIsraeliPhoneDigits } from '@/lib/israeli-phone';

export function normalizePhone(phone: string) {
  const parsed = parseIsraeliPhoneDigits(phone);
  if (parsed) return `972${parsed.slice(1)}`;

  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('972')) return digits;
  if (digits.startsWith('0')) return `972${digits.slice(1)}`;
  if (digits.length === 9) return `972${digits}`;
  return digits;
}

export function phonesMatch(a: string, b: string) {
  if (!a || !b) return false;
  return normalizePhone(a) === normalizePhone(b);
}

export function emailsMatch(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
