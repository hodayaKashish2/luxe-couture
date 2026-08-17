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

/** כתובת ציבורית של האתר — בדפדפן משתמשים ב-origin הנוכחי */
export function getServerAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  const vercelHost =
    process.env.NEXT_PUBLIC_VERCEL_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (vercelHost) {
    const host = vercelHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `https://${host}`;
  }

  return 'https://dress-click.co.il';
}

export function getPublicAppUrl() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return getServerAppUrl();
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
