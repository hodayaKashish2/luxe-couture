const DETAILS_RETURN_KEY = 'luxe_details_return';

export function setDetailsReturnDressId(dressId: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(DETAILS_RETURN_KEY, dressId);
}

export function consumeDetailsReturnDressId(): string | null {
  if (typeof window === 'undefined') return null;
  const id = sessionStorage.getItem(DETAILS_RETURN_KEY);
  if (id) sessionStorage.removeItem(DETAILS_RETURN_KEY);
  return id;
}
