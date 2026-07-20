import {
  sendAdminEmail,
  sendPaymentConfirmationEmail,
  sendPaymentReportedAdminEmail,
  sendPaymentReportedCustomerEmail,
} from '@/lib/email';
import { FEATURED_REWARD_DAYS, extendFeaturedUntil } from '@/lib/dress-ranking';
import { getSupabaseAdmin } from '@/lib/supabase/server';

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bit: 'ביט',
  credit: 'אשראי',
  bank: 'העברה בנקאית',
};

export function paymentMethodLabel(method: string | null | undefined) {
  if (!method) return '';
  return PAYMENT_METHOD_LABELS[method] || method;
}

export async function reportManualPayment(
  supabase: SupabaseAdmin,
  bookingId: number,
  paymentMethod: 'bit' | 'bank'
) {
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select(
      'id, dress_id, customer_name, customer_phone, customer_email, event_date, status, amount_total'
    )
    .eq('id', bookingId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!booking) return { error: 'הזמנה לא נמצאה', status: 404 as const };
  if (booking.status === 'confirmed') {
    return { success: true as const, alreadyConfirmed: true };
  }
  if (booking.status === 'awaiting_admin_approval') {
    return { success: true as const, alreadyReported: true };
  }

  const { data: dressRow } = await supabase
    .from('dresses')
    .select('name')
    .eq('id', booking.dress_id)
    .maybeSingle();

  const reportedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'awaiting_admin_approval',
      payment_method: paymentMethod,
      payment_reported_at: reportedAt,
    })
    .eq('id', bookingId);

  if (updateError) throw updateError;

  const methodLabel = paymentMethodLabel(paymentMethod);
  await sendPaymentReportedAdminEmail({
    bookingId,
    dressName: dressRow?.name || 'שמלה',
    customerName: booking.customer_name,
    customerPhone: booking.customer_phone,
    customerEmail: booking.customer_email,
    eventDate: booking.event_date,
    amount: Number(booking.amount_total),
    paymentMethodLabel: methodLabel,
  });

  if (booking.customer_email) {
    const customerMail = await sendPaymentReportedCustomerEmail({
      to: booking.customer_email,
      customerName: booking.customer_name,
      dressName: dressRow?.name || 'שמלה',
      eventDate: booking.event_date,
      amount: Number(booking.amount_total),
      paymentMethodLabel: methodLabel,
    });
    if (!customerMail.success) {
      console.error('Customer payment reported email failed:', customerMail.error);
    }
  }

  return { success: true as const, awaitingAdminApproval: true };
}

export async function confirmBookingPayment(
  supabase: SupabaseAdmin,
  bookingId: number,
  options?: {
    tranzilaIndex?: string | null;
    paymentMethod?: string | null;
    notifyAdmin?: boolean;
  }
) {
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select(
      'id, dress_id, customer_name, customer_phone, customer_email, event_date, status, amount_total, platform_fee, owner_payout, payment_method'
    )
    .eq('id', bookingId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!booking) return { error: 'הזמנה לא נמצאה', status: 404 as const };
  if (booking.status === 'confirmed') {
    return { success: true as const, alreadyConfirmed: true };
  }

  const { data: conflictingBooking, error: conflictError } = await supabase
    .from('bookings')
    .select('id')
    .eq('dress_id', booking.dress_id)
    .eq('event_date', booking.event_date)
    .eq('status', 'confirmed')
    .neq('id', bookingId)
    .maybeSingle();

  if (conflictError) throw conflictError;
  if (conflictingBooking) {
    return {
      error: 'השמלה כבר הוזמנה לתאריך זה. לא ניתן לאשר תשלום.',
      status: 409 as const,
    };
  }

  const { data: dress } = await supabase
    .from('dresses')
    .select('name, owner_name, rental_count, featured_until')
    .eq('id', booking.dress_id)
    .maybeSingle();

  const resolvedMethod = options?.paymentMethod || booking.payment_method || null;
  const methodLabel = paymentMethodLabel(resolvedMethod);

  const { error: updateBookingError } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      tranzila_index: options?.tranzilaIndex ?? null,
      payment_confirmed_at: new Date().toISOString(),
      ...(resolvedMethod ? { payment_method: resolvedMethod } : {}),
    })
    .eq('id', bookingId);

  if (updateBookingError) throw updateBookingError;

  if (dress) {
    const featuredUntil = extendFeaturedUntil(dress.featured_until, FEATURED_REWARD_DAYS);

    const dressUpdate: Record<string, unknown> = {
      rental_count: Number(dress.rental_count || 0) + 1,
      featured_until: featuredUntil,
    };

    let { error: dressUpdateError } = await supabase
      .from('dresses')
      .update(dressUpdate)
      .eq('id', booking.dress_id);

    if (
      dressUpdateError &&
      (dressUpdateError.message.includes('featured_until') ||
        dressUpdateError.message.includes('schema cache'))
    ) {
      ({ error: dressUpdateError } = await supabase
        .from('dresses')
        .update({ rental_count: Number(dress.rental_count || 0) + 1 })
        .eq('id', booking.dress_id));
    }

    if (dressUpdateError) throw dressUpdateError;
  }

  if (options?.notifyAdmin !== false && methodLabel) {
    await sendAdminEmail(
      `✅ תשלום אושר: ${dress?.name || 'שמלה'}`,
      `
        <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2>תשלום אושר בהצלחה</h2>
          <p><strong>שמלה:</strong> ${dress?.name || ''}</p>
          <p><strong>שוכרת:</strong> ${booking.customer_name}</p>
          <p><strong>תאריך:</strong> ${booking.event_date}</p>
          <p><strong>סכום:</strong> ₪${booking.amount_total}</p>
          ${methodLabel ? `<p><strong>אמצעי תשלום:</strong> ${methodLabel}</p>` : ''}
        </div>
      `
    );
  }

  if (booking.customer_email) {
    const customerMail = await sendPaymentConfirmationEmail({
      to: booking.customer_email,
      customerName: booking.customer_name,
      dressName: dress?.name || 'שמלה',
      eventDate: booking.event_date,
      amount: Number(booking.amount_total),
    });
    if (!customerMail.success) {
      console.error('Customer payment confirmation email failed:', customerMail.error);
    }
  }

  return { success: true as const, dressName: dress?.name || 'שמלה' };
}
