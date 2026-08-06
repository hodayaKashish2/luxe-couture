import type { SupabaseClient } from '@supabase/supabase-js';
import {
  sendDressRatingRejectedEmail,
  sendDressRejectedOwnerEmail,
  sendDressUpdateRejectedOwnerEmail,
} from '@/lib/email';
import { fetchDressForNotify, resolveOwnerContact, dressRowToNotify } from '@/lib/dress-approval-notify';
import type { PendingUpdatePayload } from '@/lib/dress-pending-update';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function notifyNewDressRejected(
  supabase: SupabaseClient,
  dressId: string | number,
  reason: string
) {
  const dress = await fetchDressForNotify(supabase, dressId);
  if (!dress) {
    return { success: false as const, error: 'שמלה לא נמצאה' };
  }

  const { email, name } = await resolveOwnerContact(supabase, dress);
  if (!email || !isValidEmail(email)) {
    return { success: false as const, error: 'אין כתובת מייל למשכירה' };
  }

  return sendDressRejectedOwnerEmail({
    to: email,
    ownerName: name,
    dressName: dress.name,
    reason,
  });
}

export async function notifyDressUpdateRejectedWithReason(
  supabase: SupabaseClient,
  dressId: string | number,
  dressRow: Record<string, unknown>,
  payload: PendingUpdatePayload | undefined,
  reason: string
) {
  const dress =
    (await fetchDressForNotify(supabase, dressId)) ?? dressRowToNotify(dressRow);

  let email = payload?.notify_email?.trim().toLowerCase() || '';
  let name = dress.owner_name || 'משכירה';

  if (!email || !isValidEmail(email)) {
    const resolved = await resolveOwnerContact(supabase, dress);
    email = resolved.email;
    name = resolved.name;
  }

  if (!email || !isValidEmail(email)) {
    return { success: false as const, error: 'אין כתובת מייל למשכירה' };
  }

  return sendDressUpdateRejectedOwnerEmail({
    to: email,
    ownerName: name,
    dressName: payload?.name || dress.name,
    reason,
  });
}

export async function notifyDressRatingRejected(
  supabase: SupabaseClient,
  ratingId: string | number,
  reason: string
) {
  const { data: rating, error } = await supabase
    .from('dress_ratings')
    .select('id, customer_name, dress_id, review_text, stars, rater_user_id, dresses(name)')
    .eq('id', ratingId)
    .maybeSingle();

  if (error) throw error;
  if (!rating) {
    return { success: false as const, error: 'דירוג לא נמצא' };
  }

  let email = '';
  let name = rating.customer_name || 'לקוחה';

  if (rating.rater_user_id) {
    const { data: user } = await supabase
      .from('site_users')
      .select('email, display_name')
      .eq('id', rating.rater_user_id)
      .maybeSingle();

    if (user?.email && isValidEmail(user.email)) {
      email = user.email.trim().toLowerCase();
    }
    if (user?.display_name) name = user.display_name;
  }

  if (!email) {
    return { success: false as const, error: 'אין כתובת מייל לשולחת הדירוג' };
  }

  const dressJoin = rating.dresses as { name?: string } | { name?: string }[] | null | undefined;
  const dressName = Array.isArray(dressJoin) ? dressJoin[0]?.name : dressJoin?.name;

  return sendDressRatingRejectedEmail({
    to: email,
    customerName: name,
    dressName: dressName || 'שמלה',
    reason,
  });
}
