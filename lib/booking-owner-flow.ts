import type { SupabaseClient } from '@supabase/supabase-js';

import {
  OWNER_NO_RESPONSE_REASON,
  ownerReminderDue,
  ownerResponseExpired,
} from '@/lib/booking-owner-deadlines';
import { getServerAppUrl, accountRentalsUrl, completeBookingUrl } from '@/lib/site-config';
import {
  sendBookingOwnerApprovedEmail,
  sendBookingOwnerRejectedEmail,
  sendBookingOwnerReminderEmail,
  sendBookingOwnerRequestEmail,
  sendBookingOwnerTimeoutEmail,
} from '@/lib/email';
import { resolveOwnerContact, dressRowToNotify } from '@/lib/dress-approval-notify';

type SupabaseAdmin = SupabaseClient;

type PendingBookingRow = {
  id: number;
  dress_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  event_date: string;
  status: string;
  created_at: string;
  owner_response_deadline?: string | null;
  owner_reminder_sent_at?: string | null;
  amount_total?: number | null;
};

function schemaMissingColumn(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes('owner_response_deadline') ||
    m.includes('owner_reminder_sent_at') ||
    m.includes('owner_responded_at') ||
    m.includes('owner_reject_reason') ||
    m.includes('pending_owner_approval')
  );
}

async function fetchDressMeta(supabase: SupabaseAdmin, dressId: number) {
  const { data } = await supabase.from('dresses').select('*').eq('id', dressId).maybeSingle();
  return data ? dressRowToNotify(data as Record<string, unknown>) : null;
}

export async function processBookingOwnerDeadlines(supabase: SupabaseAdmin) {
  const { data: pendingRows, error } = await supabase
    .from('bookings')
    .select(
      'id, dress_id, customer_name, customer_phone, customer_email, event_date, status, created_at, owner_response_deadline, owner_reminder_sent_at, amount_total'
    )
    .eq('status', 'pending_owner_approval');

  if (error) {
    if (schemaMissingColumn(error.message)) return { skipped: true as const };
    throw error;
  }

  const rows = (pendingRows ?? []) as PendingBookingRow[];
  let remindersSent = 0;
  let expiredCount = 0;

  for (const booking of rows) {
    const dress = await fetchDressMeta(supabase, booking.dress_id);
    const dressName = dress?.name || 'שמלה';

    if (
      !booking.owner_reminder_sent_at &&
      ownerReminderDue(booking.created_at) &&
      !ownerResponseExpired(booking.owner_response_deadline)
    ) {
      if (dress) {
        const owner = await resolveOwnerContact(supabase, dress);
        if (owner.email) {
          await sendBookingOwnerReminderEmail({
            to: owner.email,
            ownerName: owner.name,
            dressName,
            customerName: booking.customer_name,
            eventDate: booking.event_date,
            accountUrl: accountRentalsUrl(),
          });
        }
      }

      await supabase
        .from('bookings')
        .update({ owner_reminder_sent_at: new Date().toISOString() })
        .eq('id', booking.id)
        .eq('status', 'pending_owner_approval');

      remindersSent += 1;
    }

    if (ownerResponseExpired(booking.owner_response_deadline)) {
      const now = new Date().toISOString();
      await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          owner_responded_at: now,
          owner_reject_reason: OWNER_NO_RESPONSE_REASON,
        })
        .eq('id', booking.id)
        .eq('status', 'pending_owner_approval');

      await sendBookingOwnerTimeoutEmail({
        to: booking.customer_email,
        customerName: booking.customer_name,
        dressName,
        eventDate: booking.event_date,
      });

      expiredCount += 1;
    }
  }

  return { skipped: false as const, remindersSent, expiredCount };
}

export async function notifyOwnerOfBookingRequest(
  supabase: SupabaseAdmin,
  params: {
    bookingId: number;
    dressId: number;
    customerName: string;
    customerPhone: string;
    eventDate: string;
    amount: number;
  }
) {
  const dress = await fetchDressMeta(supabase, params.dressId);
  if (!dress) return;

  const owner = await resolveOwnerContact(supabase, dress);
  const accountUrl = accountRentalsUrl();

  if (owner.email) {
    await sendBookingOwnerRequestEmail({
      to: owner.email,
      ownerName: owner.name,
      dressName: dress.name,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      eventDate: params.eventDate,
      amount: params.amount,
      accountUrl,
    });
  }
}

export async function rejectCompetingOwnerRequests(
  supabase: SupabaseAdmin,
  dressId: number,
  eventDate: string,
  approvedBookingId: number
) {
  const { data: others } = await supabase
    .from('bookings')
    .select('id, customer_name, customer_email, event_date')
    .eq('dress_id', dressId)
    .eq('event_date', eventDate)
    .eq('status', 'pending_owner_approval')
    .neq('id', approvedBookingId);

  const reason = 'התאריך נתפס — המשכירה אישרה בקשה אחרת לאותו יום.';
  const dress = await fetchDressMeta(supabase, dressId);
  const dressName = dress?.name || 'שמלה';
  const now = new Date().toISOString();

  for (const row of others ?? []) {
    await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        owner_responded_at: now,
        owner_reject_reason: reason,
      })
      .eq('id', row.id);

    if (row.customer_email) {
      await sendBookingOwnerRejectedEmail({
        to: row.customer_email,
        customerName: row.customer_name,
        dressName,
        eventDate: row.event_date,
        reason,
      });
    }
  }
}

export async function approveBookingByOwner(
  supabase: SupabaseAdmin,
  bookingId: number
) {
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(
      'id, dress_id, customer_name, customer_email, event_date, status, amount_total'
    )
    .eq('id', bookingId)
    .maybeSingle();

  if (error) throw error;
  if (!booking) return { error: 'הבקשה לא נמצאה', status: 404 as const };
  if (booking.status !== 'pending_owner_approval') {
    return { error: 'הבקשה כבר טופלה', status: 409 as const };
  }

  const { data: conflict } = await supabase
    .from('bookings')
    .select('id')
    .eq('dress_id', booking.dress_id)
    .eq('event_date', booking.event_date)
    .in('status', ['confirmed', 'pending_payment', 'awaiting_admin_approval'])
    .maybeSingle();

  if (conflict) {
    return {
      error: 'התאריך כבר תפוס — לא ניתן לאשר את הבקשה.',
      status: 409 as const,
    };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'pending_payment',
      owner_responded_at: now,
    })
    .eq('id', bookingId)
    .eq('status', 'pending_owner_approval');

  if (updateError) throw updateError;

  await rejectCompetingOwnerRequests(
    supabase,
    booking.dress_id,
    booking.event_date,
    bookingId
  );

  const dress = await fetchDressMeta(supabase, booking.dress_id);
  const dressName = dress?.name || 'שמלה';
  const payUrl = completeBookingUrl(bookingId);

  await sendBookingOwnerApprovedEmail({
    to: booking.customer_email,
    customerName: booking.customer_name,
    dressName,
    eventDate: booking.event_date,
    amount: Number(booking.amount_total || 0),
    payUrl,
  });

  return { success: true as const, dressName };
}

export async function rejectBookingByOwner(
  supabase: SupabaseAdmin,
  bookingId: number,
  reason: string
) {
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, dress_id, customer_name, customer_email, event_date, status')
    .eq('id', bookingId)
    .maybeSingle();

  if (error) throw error;
  if (!booking) return { error: 'הבקשה לא נמצאה', status: 404 as const };
  if (booking.status !== 'pending_owner_approval') {
    return { error: 'הבקשה כבר טופלה', status: 409 as const };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      owner_responded_at: now,
      owner_reject_reason: reason,
    })
    .eq('id', bookingId)
    .eq('status', 'pending_owner_approval');

  if (updateError) throw updateError;

  const dress = await fetchDressMeta(supabase, booking.dress_id);
  await sendBookingOwnerRejectedEmail({
    to: booking.customer_email,
    customerName: booking.customer_name,
    dressName: dress?.name || 'שמלה',
    eventDate: booking.event_date,
    reason,
  });

  return { success: true as const };
}
