export type AccountSection =
  | 'hub'
  | 'reservations'
  | 'rentals'
  | 'cart'
  | 'favorites'
  | 'add'
  | 'edit';

const ACCOUNT_SECTIONS = new Set([
  'cart',
  'favorites',
  'reservations',
  'rentals',
  'add',
  'edit',
]);

export function accountSectionUrl(section: AccountSection, dressId?: string): string {
  if (section === 'hub') return '/account';
  const params = new URLSearchParams({ section });
  if (section === 'edit' && dressId) params.set('dressId', dressId);
  return `/account?${params.toString()}`;
}

export function parseAccountSection(searchParams: URLSearchParams): {
  section: AccountSection;
  dressId?: string;
} {
  const tab = searchParams.get('section');
  if (tab && ACCOUNT_SECTIONS.has(tab)) {
    return {
      section: tab as AccountSection,
      dressId: searchParams.get('dressId') || undefined,
    };
  }
  return { section: 'hub' };
}
