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

export type AccountSectionUrlOptions = {
  dressId?: string;
  viewDress?: string;
};

export function accountSectionUrl(
  section: AccountSection,
  opts?: AccountSectionUrlOptions | string
): string {
  const options = typeof opts === 'string' ? { dressId: opts } : opts;
  if (section === 'hub') return '/account';
  const params = new URLSearchParams({ section });
  if (section === 'edit' && options?.dressId) params.set('dressId', options.dressId);
  if (options?.viewDress && (section === 'cart' || section === 'favorites')) {
    params.set('viewDress', options.viewDress);
  }
  return `/account?${params.toString()}`;
}

export function parseAccountSection(searchParams: URLSearchParams): {
  section: AccountSection;
  dressId?: string;
  viewDress?: string;
} {
  const tab = searchParams.get('section');
  if (tab && ACCOUNT_SECTIONS.has(tab)) {
    return {
      section: tab as AccountSection,
      dressId: searchParams.get('dressId') || undefined,
      viewDress: searchParams.get('viewDress') || undefined,
    };
  }
  return { section: 'hub' };
}
