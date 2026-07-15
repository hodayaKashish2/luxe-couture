export const SITE_NAME = 'שמלה בקליק';

export const DEFAULT_ADMIN_EMAIL = 'dressbclick@gmail.com';

export const CONTACT_EMAIL = process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;

export const CONTACT_PHONE = '053-420-1133';

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP || '972534201133';

export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('היי, אשמח לפרטים על שמלה מהאתר')}`;

export function dressShareUrl(dressName: string, dressId: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base}/?dress=${dressId}&text=${encodeURIComponent(`שמתי לב לשמלה "${dressName}" באתר ${SITE_NAME}`)}`;
}

export function dressPageUrl(dressId: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base}/?dress=${dressId}`;
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
