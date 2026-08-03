import {
  sendDressUpdateApprovedOwnerEmail,
  sendDressUpdatePendingAdminEmail,
  sendDressUpdatePendingOwnerEmail,
  sendDressUpdateRejectedOwnerEmail,
} from '@/lib/email';
import { fetchDressForNotify, resolveOwnerContact } from '@/lib/dress-approval-notify';
import type { PendingUpdatePayload } from '@/lib/dress-pending-update';
import type { SupabaseClient } from '@supabase/supabase-js';

type DressUpdateNotifyParams = {
  dressId: string | number;
  name: string;
  price: number;
  size: string;
  city: string;
  color?: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  images: string[];
};

export async function notifyDressUpdateSubmitted(params: DressUpdateNotifyParams) {
  const adminMail = await sendDressUpdatePendingAdminEmail(params);
  if (!adminMail.success) {
    console.error('Dress update pending admin email failed:', adminMail.error);
  }

  if (params.ownerEmail?.trim()) {
    const ownerMail = await sendDressUpdatePendingOwnerEmail({
      to: params.ownerEmail,
      ownerName: params.ownerName,
      dressName: params.name,
    });
    if (!ownerMail.success) {
      console.error('Dress update pending owner email failed:', ownerMail.error);
    }
  }
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
