const DETAILS_RETURN_KEY = 'luxe_details_return';
const DETAILS_RETURN_SOURCE_KEY = 'luxe_details_return_source';
const DETAILS_RETURN_SECTION_KEY = 'luxe_details_return_section';

export type DetailsReturnSource = 'home' | 'account';

export function setDetailsReturnDressId(
  dressId: string,
  source: DetailsReturnSource = 'home',
  accountSection?: string
) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(DETAILS_RETURN_KEY, dressId);
  sessionStorage.setItem(DETAILS_RETURN_SOURCE_KEY, source);
  if (source === 'account' && accountSection) {
    sessionStorage.setItem(DETAILS_RETURN_SECTION_KEY, accountSection);
  } else {
    sessionStorage.removeItem(DETAILS_RETURN_SECTION_KEY);
  }
}

export function peekDetailsReturnDressId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(DETAILS_RETURN_KEY);
}

export function peekDetailsReturnSource(): DetailsReturnSource | null {
  if (typeof window === 'undefined') return null;
  const source = sessionStorage.getItem(DETAILS_RETURN_SOURCE_KEY);
  return source === 'account' || source === 'home' ? source : null;
}

export function peekDetailsReturnAccountSection(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(DETAILS_RETURN_SECTION_KEY);
}

export function consumeDetailsReturnDressId(): string | null {
  if (typeof window === 'undefined') return null;
  const id = sessionStorage.getItem(DETAILS_RETURN_KEY);
  sessionStorage.removeItem(DETAILS_RETURN_KEY);
  sessionStorage.removeItem(DETAILS_RETURN_SOURCE_KEY);
  sessionStorage.removeItem(DETAILS_RETURN_SECTION_KEY);
  return id;
}

export function clearDetailsReturn() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(DETAILS_RETURN_KEY);
  sessionStorage.removeItem(DETAILS_RETURN_SOURCE_KEY);
  sessionStorage.removeItem(DETAILS_RETURN_SECTION_KEY);
}
