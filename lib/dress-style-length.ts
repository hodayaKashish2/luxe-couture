import { normalizeDressKind } from '@/lib/dress-listing';

export const DRESS_STYLE_OPTIONS = [
  { value: 'conservative', label: 'שמרני' },
  { value: 'classic', label: 'קלאסי' },
  { value: 'modern', label: 'מודרני' },
] as const;

export const DRESS_LENGTH_OPTIONS = [
  { value: 'short', label: 'קצר' },
  { value: 'medium', label: 'אמצע' },
  { value: 'long', label: 'ארוך' },
] as const;

export type DressStyle = (typeof DRESS_STYLE_OPTIONS)[number]['value'];
export type DressLength = (typeof DRESS_LENGTH_OPTIONS)[number]['value'];

export const DEFAULT_DRESS_STYLE: DressStyle = 'classic';
export const DEFAULT_DRESS_LENGTH: DressLength = 'long';

export function normalizeDressStyle(value: string | null | undefined): DressStyle {
  if (value === 'conservative' || value === 'modern') return value;
  return DEFAULT_DRESS_STYLE;
}

export function normalizeDressLength(value: string | null | undefined): DressLength {
  if (value === 'short' || value === 'medium') return value;
  return DEFAULT_DRESS_LENGTH;
}

export function dressStyleLabel(value: string | null | undefined): string {
  const normalized = normalizeDressStyle(value);
  return DRESS_STYLE_OPTIONS.find((o) => o.value === normalized)?.label || 'קלאסי';
}

export function dressLengthLabel(value: string | null | undefined): string {
  const normalized = normalizeDressLength(value);
  return DRESS_LENGTH_OPTIONS.find((o) => o.value === normalized)?.label || 'ארוך';
}

export function dressLengthFieldLabel(dressKind: string | null | undefined): string {
  return normalizeDressKind(dressKind) === 'set'
    ? 'אורך השמלה העיקרית בסט *'
    : 'אורך השמלה *';
}

export function isValidDressStyle(value: string): value is DressStyle {
  return DRESS_STYLE_OPTIONS.some((o) => o.value === value);
}

export function isValidDressLength(value: string): value is DressLength {
  return DRESS_LENGTH_OPTIONS.some((o) => o.value === value);
}
