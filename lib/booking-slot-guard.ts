import type { SupabaseClient } from '@supabase/supabase-js';

import {
  BOOKING_CANCEL_PAYMENT_EXPIRED,
  BOOKING_CANCEL_SLOT_TAKEN,
  paymentDeadlineExpired,
  resolvePaymentDeadline,
} from '@/lib/booking-payment-deadlines';
import {
  sendBookingPaymentExpiredEmail,
  sendBookingSlotTakenEmail,
} from '@/lib/email';

type SupabaseAdmin = SupabaseClient;

type CancellableBookingRow = {
  id: number;
  dress_id: number;
  customer_name: string;
  customer_email: string;
  event_date: string;
  status: string;
  owner_responded_at?: string | null;
  payment_deadline?: string | null;
  created_at: string;
};

const CANCELLABLE_STATUSES = [
  'pending_owner_approval',
  'pending_payment',
  'awaiting_admin_approval',
] as const;

function schemaMissingPaymentDeadline(message: string) {
  const m = message.toLowerCase();
  return m.includes('payment_deadline') || m.includes('schema cache');
}

async function fetchDressName(supabase: SupabaseAdmin, dressId: number) {
  const { data } = await supabase.from('dresses').select('name').eq('id', dressId).maybeSingle();
  return data?.name || 'שמלה';
}

async function cancelBookingWithNotice(
  supabase: SupabaseAdmin,
  booking: Pick<CancellableBookingRow, 'id' | 'dress_id' | 'customer_name' | 'customer_email' | 'event_date' | 'status'>,
  reason: string,
  emailKind: 'slot_taken' | 'payment_expired'
) {
  const { data: updated, error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      owner_reject_reason: reason,
    })
    .eq('id', booking.id)
    .in('status', [...CANCELLABLE_STATUSES])
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!updated) return false;

  const dressName = await fetchDressName(supabase, booking.dress_id);
  if (!booking.customer_email) return true;

  if (emailKind === 'payment_expired') {
    const mail = await sendBookingPaymentExpiredEmail({
      to: booking.customer_email,
      customerName: booking.customer_name,
      dressName,
      eventDate: booking.event_date,
    });
    if (!mail.success) {
      console.error('Payment expired email failed:', mail.error);
    }
  } else {
    const mail = await sendBookingSlotTakenEmail({
      to: booking.customer_email,
      customerName: booking.customer_name,
      dressName,
      eventDate: booking.event_date,
    });
    if (!mail.success) {
      console.error('Slot taken email failed:', mail.error);
    }
  }

  return true;
}

export async function cancelCompetingSlotBookings(
  supabase: SupabaseAdmin,
  dressId: number,
  eventDate: string,
  keepBookingId: number,
  reason = BOOKING_CANCEL_SLOT_TAKEN
) {
  const { data: others, error } = await supabase
    .from('bookings')
    .select('id, dress_id, customer_name, customer_email, event_date, status')
    .eq('dress_id', dressId)
    .eq('event_date', eventDate)
    .in('status', [...CANCELLABLE_STATUSES])
    .neq('id', keepBookingId);

  if (error) throw error;

  let cancelled = 0;
  for (const row of others ?? []) {
    const didCancel = await cancelBookingWithNotice(supabase, row, reason, 'slot_taken');
    if (didCancel) cancelled += 1;
  }

  return cancelled;
}

export async function processBookingPaymentDeadlines(supabase: SupabaseAdmin) {
  let selectQuery = await supabase
    .from('bookings')
    .select(
      'id, dress_id, customer_name, customer_email, event_date, status, owner_responded_at, payment_deadline'
    )
    .eq('status', 'pending_payment');

  if (selectQuery.error && schemaMissingPaymentDeadline(selectQuery.error.message)) {
    selectQuery = await supabase
      .from('bookings')
      .select('id, dress_id, customer_name, customer_email, event_date, status, owner_responded_at')
      .eq('status', 'pending_payment');
  }

  if (selectQuery.error) throw selectQuery.error;

  let expiredCount = 0;
  for (const row of (selectQuery.data ?? []) as CancellableBookingRow[]) {
    const deadline = resolvePaymentDeadline(row.payment_deadline, row.owner_responded_at);
    if (!paymentDeadlineExpired(deadline)) continue;

    const didCancel = await cancelBookingWithNotice(
      supabase,
      row,
      BOOKING_CANCEL_PAYMENT_EXPIRED,
      'payment_expired'
    );
    if (didCancel) expiredCount += 1;
  }

  return { expiredCount };
}

function pickSlotHolder(bookings: CancellableBookingRow[]): CancellableBookingRow | null {
  const holders = bookings.filter(
    (b) => b.status === 'pending_payment' || b.status === 'awaiting_admin_approval'
  );
  if (!holders.length) return null;

  holders.sort((a, b) => {
    const ta = a.owner_responded_at || a.created_at;
    const tb = b.owner_responded_at || b.created_at;
    return ta.localeCompare(tb) || a.id - b.id;
  });

  return holders[0] ?? null;
}

export async function processBookingSlotConflicts(supabase: SupabaseAdmin) {
  const { data: active, error } = await supabase
    .from('bookings')
    .select(
      'id, dress_id, event_date, status, customer_name, customer_email, owner_responded_at, created_at'
    )
    .in('status', [...CANCELLABLE_STATUSES, 'confirmed']);

  if (error) throw error;

  const groups = new Map<string, CancellableBookingRow[]>();
  for (const row of (active ?? []) as CancellableBookingRow[]) {
    const key = `${row.dress_id}:${row.event_date}`;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  let cancelledCount = 0;

  for (const bookings of groups.values()) {
    if (bookings.length <= 1) continue;

    const confirmed = bookings.filter((b) => b.status === 'confirmed');
    if (confirmed.length > 0) {
      const winner = confirmed.sort((a, b) => a.id - b.id)[0];
      for (const booking of bookings) {
        if (booking.id === winner.id) continue;
        const didCancel = await cancelBookingWithNotice(
          supabase,
          booking,
          BOOKING_CANCEL_SLOT_TAKEN,
          'slot_taken'
        );
        if (didCancel) cancelledCount += 1;
      }
      continue;
    }

    const holder = pickSlotHolder(bookings);
    if (!holder) continue;

    for (const booking of bookings) {
      if (booking.id === holder.id) continue;
      const didCancel = await cancelBookingWithNotice(
        supabase,
        booking,
        BOOKING_CANCEL_SLOT_TAKEN,
        'slot_taken'
      );
      if (didCancel) cancelledCount += 1;
    }
  }

  return { cancelledCount };
}
