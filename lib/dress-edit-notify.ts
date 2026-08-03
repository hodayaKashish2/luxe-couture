import { notifyDressSubmitted, type DressNotifyResult } from '@/lib/dress-submit-notify';
import { resolveOwnerContact } from '@/lib/dress-approval-notify';
import {
  sendDressUpdatePendingAdminEmail,
  sendDressUpdatePendingOwnerEmail,
} from '@/lib/email';
import type { SiteUser } from '@/lib/user-auth';
import type { SupabaseClient } from '@supabase/supabase-js';

export type DressUpdateEmailParams = {
  dressId: string | number;
  name: string;
  price: number;
  size: string;
  city: string;
  color?: string;
  images: string[];
};

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

    if (dbUser?.email?.trim()) email = dbUser.email.trim().toLowerCase();
    if (dbUser?.display_name) name = dbUser.display_name;
    if (dbUser?.phone) phone = String(dbUser.phone);
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

/** Same delivery path as new-dress submit, with update-specific templates first. */
export async function sendDressUpdateEmails(
  supabase: SupabaseClient,
  user: SiteUser,
  dressRow: Record<string, unknown>,
  update: DressUpdateEmailParams
): Promise<DressNotifyResult & { ownerEmail: string }> {
  const { email: ownerEmail, name: ownerName, phone: ownerPhone } =
    await resolveUpdateNotifyContact(supabase, user, dressRow);

  const resolvedOwnerEmail = (ownerEmail || user.email || String(dressRow.owner_email || '')).trim().toLowerCase();

  const submitParams = {
    dressId: update.dressId,
    name: update.name,
    price: update.price,
    size: update.size,
    city: update.city,
    ownerName,
    ownerPhone,
    ownerEmail: resolvedOwnerEmail,
    images: update.images,
  };

  let adminOk = false;
  let adminError: string | undefined;

  const adminUpdate = await sendDressUpdatePendingAdminEmail({
    ...submitParams,
    color: update.color,
  });

  if (adminUpdate.success) {
    adminOk = true;
  } else {
    const fallback = await notifyDressSubmitted({
      ...submitParams,
      name: `${update.name} (עדכון)`,
    });
    adminOk = fallback.adminOk;
    adminError = adminUpdate.error || fallback.adminError;
  }

  let ownerOk = false;
  let ownerError: string | undefined;

  if (resolvedOwnerEmail) {
    const ownerUpdate = await sendDressUpdatePendingOwnerEmail({
      to: resolvedOwnerEmail,
      ownerName,
      dressName: update.name,
    });

    if (ownerUpdate.success) {
      ownerOk = true;
    } else {
      const fallback = await notifyDressSubmitted(submitParams);
      ownerOk = fallback.ownerOk;
      ownerError = ownerUpdate.error || fallback.ownerError;
    }
  } else {
    ownerError = 'אין כתובת מייל למשכירה';
  }

  if (!adminOk) console.error('Dress update admin email failed:', adminError);
  if (!ownerOk) console.error('Dress update owner email failed:', ownerError);

  return {
    ownerEmail: resolvedOwnerEmail,
    adminOk,
    ownerOk,
    adminError,
    ownerError,
  };
}
