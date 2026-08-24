export const SITE_NAME = 'שמלה בקליק';

export const DEFAULT_ADMIN_EMAIL = 'dressbclick@gmail.com';

export const LEGACY_ADMIN_EMAIL = 'hodayaka1212@gmail.com';

export function resolveSiteEmail(email?: string | null) {
  const value = (email || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
  if (
    !value ||
    value === LEGACY_ADMIN_EMAIL ||
    value.includes('hodayaka1212')
  ) {
    return DEFAULT_ADMIN_EMAIL;
  }
  return value;
}

/** כתובת המייל הראשית של האתר — תמיד dressbclick אלא אם הוגדר מייל חדש במפורש */
export function getSiteAdminEmail() {
  return resolveSiteEmail(process.env.ADMIN_EMAIL);
}

export const CONTACT_EMAIL = getSiteAdminEmail();

export const CONTACT_PHONE = '053-420-1133';

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP || '972534201133';

export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('היי, אשמח לפרטים על שמלה מהאתר')}`;

export const PRODUCTION_SITE_URL = 'https://dress-click.co.il';

/** נתיב סודי לפאנל הניהול — לא מופיע בתפריט */
export const ADMIN_PANEL_PATH = 'hodaya0527640';

export function adminPanelUrl() {
  return `${getServerAppUrl()}/${ADMIN_PANEL_PATH}`;
}

/** כתובת ציבורית של האתר — בדפדפן משתמשים ב-origin הנוכחי */
export function getServerAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    const normalized = configured.replace(/\/$/, '');
    if (normalized.includes('localhost') || normalized.includes('127.0.0.1')) {
      return normalized;
    }
    if (!normalized.includes('.vercel.app')) {
      return normalized;
    }
  }

  return PRODUCTION_SITE_URL;
}

export function getPublicAppUrl() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin.replace(/\/$/, '');
    if (!origin.includes('.vercel.app')) {
      return origin;
    }
  }
  return getServerAppUrl();
}

export function accountReservationsUrl() {
  return `${getServerAppUrl()}/account?section=reservations`;
}

export function accountRentalsUrl() {
  return `${getServerAppUrl()}/account?section=rentals`;
}

export function accountAddDressUrl() {
  return `${getServerAppUrl()}/account?section=add`;
}

export function completeBookingUrl(bookingId: number | string) {
  return `${getServerAppUrl()}/account?section=reservations&completeBooking=${bookingId}`;
}

export function dressShareUrl(dressName: string, dressId: string) {
  const base = getPublicAppUrl();
  return `${base}/?dress=${dressId}&text=${encodeURIComponent(`שמתי לב לשמלה "${dressName}" באתר ${SITE_NAME}`)}`;
}

export function dressPageUrl(dressId: string) {
  return `${getPublicAppUrl()}/?dress=${dressId}`;
}

export function ownerWhatsAppLink(phone: string, dressName: string) {
  const digits = phone.replace(/\D/g, '');
  const wa = digits.startsWith('972')
    ? digits
    : digits.startsWith('0')
      ? `972${digits.slice(1)}`
      : `972${digits}`;
  const text = encodeURIComponent(`היי, מעוניינת בשמלה "${dressName}" מהאתר ${SITE_NAME}`);
  return `https://wa.me/${wa}?text=${text}`;
}
