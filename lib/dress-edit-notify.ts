import { resolveOwnerContact } from '@/lib/dress-approval-notify';
import {
  sendDressPendingAdminEmail,
  sendDressPendingOwnerEmail,
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

/** Uses the same senders as new-dress submit, with update templates and submit fallback. */
export async function sendDressUpdateEmails(
  supabase: SupabaseClient,
  user: SiteUser,
  dressRow: Record<string, unknown>,
  update: DressUpdateEmailParams
) {
  const { email: ownerEmail, name: ownerName, phone: ownerPhone } =
    await resolveUpdateNotifyContact(supabase, user, dressRow);

  const resolvedOwnerEmail = (ownerEmail || user.email || String(dressRow.owner_email || '')).trim().toLowerCase();

  let adminResult = await sendDressUpdatePendingAdminEmail({
    dressId: update.dressId,
    name: update.name,
    price: update.price,
    size: update.size,
    city: update.city,
    color: update.color,
    ownerName,
    ownerPhone,
    ownerEmail: resolvedOwnerEmail,
    images: update.images,
  });

  if (!adminResult.success) {
    adminResult = await sendDressPendingAdminEmail({
      dressId: update.dressId,
      name: `${update.name} (עדכון)`,
      price: update.price,
      size: update.size,
      city: update.city,
      ownerName,
      ownerPhone,
      ownerEmail: resolvedOwnerEmail,
      images: update.images,
    });
  }

  let ownerResult: { success: boolean; error?: string } = {
    success: false,
    error: 'אין כתובת מייל למשכירה',
  };

  if (resolvedOwnerEmail) {
    ownerResult = await sendDressUpdatePendingOwnerEmail({
      to: resolvedOwnerEmail,
      ownerName,
      dressName: update.name,
    });

    if (!ownerResult.success) {
      ownerResult = await sendDressPendingOwnerEmail({
        to: resolvedOwnerEmail,
        ownerName,
        dressName: update.name,
      });
    }
  }

  if (!adminResult.success) {
    console.error('Dress update admin email failed:', adminResult.error);
  }
  if (!ownerResult.success) {
    console.error('Dress update owner email failed:', ownerResult.error);
  }

  return {
    ownerEmail: resolvedOwnerEmail,
    adminOk: adminResult.success,
    ownerOk: ownerResult.success,
    adminError: adminResult.success ? undefined : adminResult.error,
    ownerError: ownerResult.success ? undefined : ownerResult.error,
  };
}
