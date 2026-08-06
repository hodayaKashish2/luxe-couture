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

async function resolveOwnerEmailForUpdate(
  supabase: SupabaseClient,
  dress: NonNullable<Awaited<ReturnType<typeof fetchDressForNotify>>>,
  dressRow?: Record<string, unknown>,
  payload?: PendingUpdatePayload
) {
  const storedNotify = payload?.notify_email?.trim().toLowerCase();
  if (storedNotify && isValidEmail(storedNotify)) {
    const fromDress = await resolveOwnerContact(supabase, {
      ...dress,
      owner_email:
        dress.owner_email ||
        (dressRow?.owner_email ? String(dressRow.owner_email) : '') ||
        undefined,
      submitter_user_id:
        dress.submitter_user_id ||
        (dressRow?.submitter_user_id ? String(dressRow.submitter_user_id) : null),
    });
    return { email: storedNotify, name: fromDress.name || dress.owner_name || 'משכירה' };
  }

  const fromDress = await resolveOwnerContact(supabase, {
    ...dress,
    owner_email:
      dress.owner_email ||
      (dressRow?.owner_email ? String(dressRow.owner_email) : '') ||
      undefined,
    submitter_user_id:
      dress.submitter_user_id ||
      (dressRow?.submitter_user_id ? String(dressRow.submitter_user_id) : null),
  });

  let email = fromDress.email?.trim().toLowerCase() || '';
  let name = fromDress.name || dress.owner_name || 'משכירה';

  if ((!email || !isValidEmail(email)) && dressRow?.submitter_user_id) {
    const { data: dbUser } = await supabase
      .from('site_users')
      .select('email, display_name')
      .eq('id', String(dressRow.submitter_user_id))
      .maybeSingle();

    if (dbUser?.email?.trim() && isValidEmail(dbUser.email)) {
      email = dbUser.email.trim().toLowerCase();
    }
    if (dbUser?.display_name) name = dbUser.display_name;
  }

  const rowEmail = String(dressRow?.owner_email || '').trim().toLowerCase();
  if (!email && rowEmail && isValidEmail(rowEmail)) {
    email = rowEmail;
  }

  return { email, name };
}

export async function notifyDressUpdateApproved(
  supabase: SupabaseClient,
  dress: NonNullable<Awaited<ReturnType<typeof fetchDressForNotify>>>,
  payload: PendingUpdatePayload,
  diff?: DressUpdateDiff,
  dressRow?: Record<string, unknown>
) {
  const { email: ownerEmail, name: ownerName } = await resolveOwnerEmailForUpdate(
    supabase,
    dress,
    dressRow,
    payload
  );

  if (!ownerEmail || !isValidEmail(ownerEmail)) {
    console.error('Dress update approved owner email skipped: no valid owner email');
    return { success: false as const, error: 'אין כתובת מייל למשכירה' };
  }

  const sent = await sendDressUpdateApprovedOwnerEmail({
    to: ownerEmail,
    ownerName,
    dressName: payload.name || dress.name,
    dressId: dress.id,
    diff,
  });

  if (!sent.success) {
    console.error('Dress update approved owner email failed:', sent.error, 'to:', ownerEmail);
  } else {
    console.log('Dress update approved owner email sent to:', ownerEmail);
  }

  return sent;
}

export async function notifyDressUpdateRejected(
  supabase: SupabaseClient,
  dress: NonNullable<Awaited<ReturnType<typeof fetchDressForNotify>>>,
  dressRow?: Record<string, unknown>
) {
  const { email: ownerEmail, name: ownerName } = await resolveOwnerEmailForUpdate(
    supabase,
    dress,
    dressRow
  );

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
