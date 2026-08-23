export const LISTING_TYPE_OPTIONS = [
  { value: 'rent', label: 'השכרה' },
  { value: 'sale', label: 'מכירה' },
] as const;

export const DRESS_KIND_OPTIONS = [
  { value: 'single', label: 'שמלה בודדת' },
  { value: 'set', label: 'סט' },
] as const;

export type ListingType = (typeof LISTING_TYPE_OPTIONS)[number]['value'];
export type DressKind = (typeof DRESS_KIND_OPTIONS)[number]['value'];

export function normalizeListingType(value: string | null | undefined): ListingType {
  return value === 'sale' ? 'sale' : 'rent';
}

export function normalizeDressKind(value: string | null | undefined): DressKind {
  return value === 'set' ? 'set' : 'single';
}

export function listingTypeLabel(value: string | null | undefined): string {
  const normalized = normalizeListingType(value);
  return LISTING_TYPE_OPTIONS.find((o) => o.value === normalized)?.label || 'השכרה';
}

export function dressKindLabel(value: string | null | undefined): string {
  const normalized = normalizeDressKind(value);
  return DRESS_KIND_OPTIONS.find((o) => o.value === normalized)?.label || 'שמלה בודדת';
}

export function isValidListingType(value: string): value is ListingType {
  return value === 'rent' || value === 'sale';
}

export function isValidDressKind(value: string): value is DressKind {
  return value === 'single' || value === 'set';
}
