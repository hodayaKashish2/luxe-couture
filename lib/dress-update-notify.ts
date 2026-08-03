import {
  sendDressUpdateApprovedOwnerEmail,
  sendDressUpdatePendingAdminEmail,
  sendDressUpdatePendingOwnerEmail,
  sendDressUpdateRejectedOwnerEmail,
} from '@/lib/email';
import { fetchDressForNotify, resolveOwnerContact } from '@/lib/dress-approval-notify';
import type { PendingUpdatePayload } from '@/lib/dress-pending-update';
import type { SupabaseClient } from '@supabase/supabase-js';

type DressUpdateSubmittedParams = {
  dressId: string | number;
  name: string;
  price: number;
  size: string;
  city: string;
  color?: string;
  images: string[];
};

type SessionUser = {
  displayName: string;
  email: string;
  phone: string;
};

export async function notifyDressUpdateSubmitted(
  supabase: SupabaseClient,
  dressRow: Record<string, unknown>,
  user: SessionUser,
  update: DressUpdateSubmittedParams
) {
  const dressForNotify = {
    id: dressRow.id as string | number,
    name: String(dressRow.name || update.name),
    description: String(dressRow.description || ''),
    owner_name: String(dressRow.owner_name || user.displayName || 'משכירה'),
    owner_email: String(dressRow.owner_email || user.email || ''),
    owner_phone: String(dressRow.owner_phone || user.phone || ''),
    submitter_user_id: dressRow.submitter_user_id as string | null | undefined,
  };

  const { email: resolvedEmail, name: resolvedName, phone: resolvedPhone } =
    await resolveOwnerContact(supabase, dressForNotify);

  const ownerEmail = (resolvedEmail || user.email || '').trim().toLowerCase();
  const ownerName = resolvedName || user.displayName || dressForNotify.owner_name;
  const ownerPhone = resolvedPhone || user.phone || dressForNotify.owner_phone;

  const adminMail = await sendDressUpdatePendingAdminEmail({
    dressId: update.dressId,
    name: update.name,
    price: update.price,
    size: update.size,
    city: update.city,
    color: update.color,
    ownerName,
    ownerPhone,
    ownerEmail,
    images: update.images,
  });

  if (!adminMail.success) {
    console.error('Dress update pending admin email failed:', adminMail.error);
  }

  let ownerMail: { success: boolean; error?: string } = {
    success: false,
    error: 'אין כתובת מייל למשכירה',
  };

  if (ownerEmail) {
    ownerMail = await sendDressUpdatePendingOwnerEmail({
      to: ownerEmail,
      ownerName,
      dressName: update.name,
    });
    if (!ownerMail.success) {
      console.error('Dress update pending owner email failed:', ownerMail.error);
    }
  } else {
    console.error('Dress update owner email skipped: no owner email resolved');
  }

  return { adminMail, ownerMail, ownerEmail };
}

export async function notifyDressUpdateApproved(
  supabase: SupabaseClient,
  dress: NonNullable<Awaited<ReturnType<typeof fetchDressForNotify>>>,
  payload: PendingUpdatePayload
) {
  const { email: ownerEmail, name: ownerName } = await resolveOwnerContact(supabase, dress);

  if (ownerEmail) {
    const sent = await sendDressUpdateApprovedOwnerEmail({
      to: ownerEmail,
      ownerName,
      dressName: payload.name || dress.name,
    });
    if (!sent.success) {
      console.error('Dress update approved owner email failed:', sent.error);
    }
  }
}

export async function notifyDressUpdateRejected(
  supabase: SupabaseClient,
  dress: NonNullable<Awaited<ReturnType<typeof fetchDressForNotify>>>
) {
  const { email: ownerEmail, name: ownerName } = await resolveOwnerContact(supabase, dress);

  if (ownerEmail) {
    const sent = await sendDressUpdateRejectedOwnerEmail({
      to: ownerEmail,
      ownerName,
      dressName: dress.name,
    });
    if (!sent.success) {
      console.error('Dress update rejected owner email failed:', sent.error);
    }
  }
}
