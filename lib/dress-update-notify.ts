import {
  sendDressUpdateApprovedOwnerEmail,
  sendDressUpdateRejectedOwnerEmail,
} from '@/lib/email';
import { fetchDressForNotify, resolveOwnerContact } from '@/lib/dress-approval-notify';
import type { DressUpdateDiff, PendingUpdatePayload } from '@/lib/dress-pending-update';
import type { SupabaseClient } from '@supabase/supabase-js';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function notifyDressUpdateApproved(
  supabase: SupabaseClient,
  dress: NonNullable<Awaited<ReturnType<typeof fetchDressForNotify>>>,
  payload: PendingUpdatePayload,
  diff?: DressUpdateDiff
) {
  const { email: ownerEmail, name: ownerName } = await resolveOwnerContact(supabase, dress);

  if (!ownerEmail || !isValidEmail(ownerEmail)) {
    console.error('Dress update approved owner email skipped: no valid owner email');
    return { success: false as const, error: 'אין כתובת מייל למשכירה' };
  }

  const sent = await sendDressUpdateApprovedOwnerEmail({
    to: ownerEmail,
    ownerName,
    dressName: payload.name || dress.name,
    diff,
  });

  if (!sent.success) {
    console.error('Dress update approved owner email failed:', sent.error);
  }

  return sent;
}

export async function notifyDressUpdateRejected(
  supabase: SupabaseClient,
  dress: NonNullable<Awaited<ReturnType<typeof fetchDressForNotify>>>
) {
  const { email: ownerEmail, name: ownerName } = await resolveOwnerContact(supabase, dress);

  if (ownerEmail && isValidEmail(ownerEmail)) {
    const sent = await sendDressUpdateRejectedOwnerEmail({
      to: ownerEmail,
      ownerName,
      dressName: dress.name,
    });
    if (!sent.success) {
      console.error('Dress update rejected owner email failed:', sent.error);
    }
    return sent;
  }

  console.error('Dress update rejected owner email skipped: no valid owner email');
  return { success: false as const, error: 'אין כתובת מייל למשכירה' };
}
