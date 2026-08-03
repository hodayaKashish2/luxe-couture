import { resolveOwnerContact } from '@/lib/dress-approval-notify';
import type { DressNotifyResult } from '@/lib/dress-submit-notify';
import type { DressUpdateDiff } from '@/lib/dress-pending-update';
import {
  sendDressUpdatePendingAdminEmail,
  sendDressUpdatePendingOwnerEmail,
} from '@/lib/email';
import type { SiteUser } from '@/lib/user-auth';
import type { SupabaseClient } from '@supabase/supabase-js';

export type DressUpdateEmailParams = {
  dressId: string | number;
  name: string;
  ownerName: string;
  diff: DressUpdateDiff;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function resolveUpdateNotifyContact(
  supabase: SupabaseClient,
  user: SiteUser,
  dressRow: Record<string, unknown>
) {
  let email = String(user.email || '').trim().toLowerCase();
  let name = user.displayName || String(dressRow.owner_name || 'משכירה');
  let phone = user.phone || String(dressRow.owner_phone || '');

  if (user.userId) {
    const { data: dbUser } = await supabase
      .from('site_users')
      .select('email, display_name, phone')
      .eq('id', user.userId)
      .maybeSingle();

    if (dbUser?.email?.trim() && isValidEmail(dbUser.email)) {
      email = dbUser.email.trim().toLowerCase();
    }
    if (dbUser?.display_name) name = dbUser.display_name;
    if (dbUser?.phone) phone = String(dbUser.phone);
  }

  const directOwnerEmail = String(dressRow.owner_email || '').trim().toLowerCase();
  if (!email && directOwnerEmail && isValidEmail(directOwnerEmail)) {
    email = directOwnerEmail;
  }

  if (!email) {
    const resolved = await resolveOwnerContact(supabase, {
      id: dressRow.id as string | number,
      name: String(dressRow.name || ''),
      description: String(dressRow.description || ''),
      owner_name: String(dressRow.owner_name || name),
      owner_email: String(dressRow.owner_email || ''),
      owner_phone: String(dressRow.owner_phone || phone),
      submitter_user_id: dressRow.submitter_user_id as string | null | undefined,
    });
    email = resolved.email || email;
    name = resolved.name || name;
    phone = resolved.phone || phone;
  }

  return { email, name, phone };
}

export async function sendDressUpdateEmails(
  supabase: SupabaseClient,
  user: SiteUser,
  dressRow: Record<string, unknown>,
  update: DressUpdateEmailParams
): Promise<DressNotifyResult & { ownerEmail: string }> {
  const { email: ownerEmail, name: ownerName } = await resolveUpdateNotifyContact(
    supabase,
    user,
    dressRow
  );

  const resolvedOwnerEmail = ownerEmail.trim().toLowerCase();

  const adminMail = await sendDressUpdatePendingAdminEmail({
    dressId: update.dressId,
    dressName: update.name,
    ownerName,
    ownerEmail: resolvedOwnerEmail,
    diff: update.diff,
  });

  let ownerOk = false;
  let ownerError: string | undefined;

  if (resolvedOwnerEmail && isValidEmail(resolvedOwnerEmail)) {
    const ownerMail = await sendDressUpdatePendingOwnerEmail({
      to: resolvedOwnerEmail,
      ownerName,
      dressName: update.name,
      diff: update.diff,
    });
    ownerOk = ownerMail.success;
    ownerError = ownerMail.success ? undefined : ownerMail.error;
  } else {
    ownerError = 'אין כתובת מייל תקינה למשכירה — עדכני מייל בפרופיל';
  }

  if (!adminMail.success) console.error('Dress update admin email failed:', adminMail.error);
  if (!ownerOk) console.error('Dress update owner email failed:', ownerError);

  return {
    ownerEmail: resolvedOwnerEmail,
    adminOk: adminMail.success,
    ownerOk,
    adminError: adminMail.success ? undefined : adminMail.error,
    ownerError,
  };
}
