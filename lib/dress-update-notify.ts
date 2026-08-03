import {
  sendDressUpdateApprovedOwnerEmail,
  sendDressUpdateRejectedOwnerEmail,
} from '@/lib/email';
import { fetchDressForNotify, resolveOwnerContact } from '@/lib/dress-approval-notify';
import type { PendingUpdatePayload } from '@/lib/dress-pending-update';
import type { SupabaseClient } from '@supabase/supabase-js';

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
