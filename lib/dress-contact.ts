const CONTACT_EMAIL_TAG = 'contact_email:';

export function appendContactEmailToDescription(description: string, email: string) {
  const clean = String(email || '').trim().toLowerCase();
  if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return description;
  }
  const withoutOld = description
    .split('|')
    .map((part) => part.trim())
    .filter((part) => part && !part.toLowerCase().startsWith(CONTACT_EMAIL_TAG))
    .join(' | ');
  return withoutOld ? `${withoutOld} | ${CONTACT_EMAIL_TAG}${clean}` : `${CONTACT_EMAIL_TAG}${clean}`;
}

export function parseContactEmailFromDescription(description: string) {
  const match = String(description || '').match(/contact_email:([^\s|]+)/i);
  const email = match?.[1]?.trim().toLowerCase() || '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}
