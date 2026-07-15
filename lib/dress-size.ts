import { DRESS_SIZES } from '@/lib/constants';

export const DRESS_SIZE_DATALIST = DRESS_SIZES.map((s) => s.label);

export function getDressSizeSearchText(size: string): string {
  const trimmed = size.trim();
  if (!trimmed) return '';

  const preset = DRESS_SIZES.find(
    (s) =>
      s.value.toLowerCase() === trimmed.toLowerCase() ||
      s.label.toLowerCase() === trimmed.toLowerCase()
  );

  if (preset) {
    return `${preset.value} ${preset.label}`.toLowerCase();
  }

  return trimmed.toLowerCase();
}

export function dressSizeMatchesFilter(dressSize: string, filter: string): boolean {
  const query = filter.trim().toLowerCase();
  if (!query) return true;
  return getDressSizeSearchText(dressSize).includes(query);
}
