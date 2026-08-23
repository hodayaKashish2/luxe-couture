import type { SupabaseClient } from '@supabase/supabase-js';

import { sendBookingSlotTakenEmail } from '@/lib/email';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { dressRemovalPayload } from '@/lib/retention';

export const DRESS_REMOVED_BOOKING_REASON = 'השמלה הוסרה מהאתר';

const ACTIVE_BOOKING_STATUSES = [
  'pending_owner_approval',
  'pending_payment',
  'awaiting_admin_approval',
  'confirmed',
] as const;

type ActiveBookingRow = {
  id: number;
  dress_id: number;
  customer_name: string;
  customer_email: string;
  event_date: string;
  status: string;
};

async function fetchDressName(supabase: SupabaseClient, dressId: number | string) {
  const { data } = await supabase.from('dresses').select('name').eq('id', dressId).maybeSingle();
  return data?.name || 'שמלה';
}

export async function cancelActiveBookingsForDress(
  supabase: SupabaseClient,
  dressId: number | string,
  options: { notifyRenter?: boolean } = {}
) {
  const { notifyRenter = false } = options;

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, dress_id, customer_name, customer_email, event_date, status')
    .eq('dress_id', dressId)
    .in('status', [...ACTIVE_BOOKING_STATUSES]);

  if (error) throw error;
  if (!bookings?.length) return 0;

  const dressName = await fetchDressName(supabase, dressId);
  let cancelled = 0;

  for (const booking of bookings as ActiveBookingRow[]) {
    const cancelPayload: Record<string, unknown> = {
      status: 'cancelled',
      owner_reject_reason: DRESS_REMOVED_BOOKING_REASON,
      owner_responded_at: new Date().toISOString(),
    };

    let { data: updated, error: updateError } = await supabase
      .from('bookings')
      .update(cancelPayload)
      .eq('id', booking.id)
      .in('status', [...ACTIVE_BOOKING_STATUSES])
      .select('id')
      .maybeSingle();

    if (
      updateError?.message?.includes('owner_responded_at') ||
      updateError?.message?.includes('owner_reject_reason')
    ) {
      ({ data: updated, error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id)
        .in('status', [...ACTIVE_BOOKING_STATUSES])
        .select('id')
        .maybeSingle());
    }

    if (updateError) throw updateError;
    if (!updated) continue;

    cancelled += 1;

    if (notifyRenter && booking.customer_email) {
      const mail = await sendBookingSlotTakenEmail({
        to: booking.customer_email,
        customerName: booking.customer_name,
        dressName,
        eventDate: booking.event_date,
      });
      if (!mail.success) {
        console.error('Dress removal cancel email failed:', mail.error);
      }
    }
  }

  return cancelled;
}

export async function reconcileRemovedDressBookings(
  supabase: SupabaseClient,
  removedDressIds: Array<number | string>
) {
  let total = 0;
  for (const dressId of removedDressIds) {
    total += await cancelActiveBookingsForDress(supabase, dressId, { notifyRenter: false });
  }
  return total;
}

export async function markDressRemoved(dressId: number | string) {
  const supabase = getSupabaseAdmin();
  const payload = dressRemovalPayload();

  let { error } = await supabase.from('dresses').update(payload).eq('id', dressId);

  if (error?.message?.includes('removed_at')) {
    ({ error } = await supabase.from('dresses').update({ status: 'removed' }).eq('id', dressId));
  } else if (error?.message?.includes('removed') || error?.message?.includes('check constraint')) {
    ({ error } = await supabase.from('dresses').update({ status: 'rejected' }).eq('id', dressId));
  }

  if (error) throw error;

  await cancelActiveBookingsForDress(supabase, dressId, { notifyRenter: true });
}
