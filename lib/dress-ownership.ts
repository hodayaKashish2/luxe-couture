import { phonesMatch } from '@/lib/owner-auth';
import type { SiteUser } from '@/lib/user-auth';

function emailsMatch(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export type DressOwnershipFields = {
  owner_phone?: string | null;
  owner_email?: string | null;
  submitter_user_id?: string | number | null;
};

export function userOwnsDress(
  dress: DressOwnershipFields,
  user: Pick<SiteUser, 'userId' | 'phone' | 'email'>
): boolean {
  if (user.userId && dress.submitter_user_id && String(dress.submitter_user_id) === String(user.userId)) {
    return true;
  }

  const ownerPhone = String(dress.owner_phone || '').trim();
  const ownerEmail = String(dress.owner_email || '').trim();

  if (user.phone?.trim() && ownerPhone && phonesMatch(ownerPhone, user.phone)) {
    return true;
  }

  if (user.email?.trim() && ownerEmail && emailsMatch(ownerEmail, user.email)) {
    return true;
  }

  return false;
}

export function formatAccountPhone(phone: string) {
  const trimmed = phone.trim();
  if (!trimmed) return '';
  return trimmed.replace(/^972/, '0') || trimmed;
}
