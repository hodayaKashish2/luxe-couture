import { DRESS_SIZES } from '@/lib/constants';

export const DRESS_SIZE_DATALIST = DRESS_SIZES.map((s) => s.label);

function normalizeSizeText(value: string) {
  return value.trim().toLowerCase();
}

export function findDressSizePreset(size: string) {
  const trimmed = size.trim();
  if (!trimmed) return undefined;

  return DRESS_SIZES.find(
    (entry) =>
      entry.label.toLowerCase() === trimmed.toLowerCase() ||
      entry.value.toLowerCase() === trimmed.toLowerCase()
  );
}

export function getDressSizeSearchText(size: string): string {
  const preset = findDressSizePreset(size);
  if (preset) {
    return `${preset.value} ${preset.label}`.toLowerCase();
  }

  return normalizeSizeText(size);
}

function dressSizeMatchesPreset(dressSize: string, preset: (typeof DRESS_SIZES)[number]) {
  const normalizedDress = normalizeSizeText(dressSize);
  const normalizedLabel = preset.label.toLowerCase();
  const normalizedValue = preset.value.toLowerCase();

  if (normalizedDress === normalizedLabel || normalizedDress === normalizedValue) {
    return true;
  }

  if (
    normalizedDress.startsWith(`${normalizedValue} `) ||
    normalizedDress.startsWith(`${normalizedValue}(`)
  ) {
    return true;
  }

  const dressPreset = findDressSizePreset(dressSize);
  return dressPreset?.value === preset.value;
}

export function dressSizeMatchesFilter(dressSize: string, filter: string): boolean {
  const query = filter.trim();
  if (!query) return true;

  const preset = DRESS_SIZES.find((entry) => entry.label === query || entry.value === query);
  if (preset) {
    return dressSizeMatchesPreset(dressSize, preset);
  }

  return getDressSizeSearchText(dressSize).includes(query.toLowerCase());
}

export function dressSizeMatchesAnyFilter(dressSize: string, filters: string[]): boolean {
  if (!filters.length) return true;
  return filters.some((filter) => dressSizeMatchesFilter(dressSize, filter));
}
