import { NextResponse } from 'next/server';
import { getAppUrl } from '@/lib/email';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bookingId = url.searchParams.get('bookingId');
  const status = url.searchParams.get('status');
  const appUrl = getAppUrl();

  if (!bookingId || !isSupabaseConfigured()) {
    return NextResponse.redirect(`${appUrl}/?payment=error`);
  }

  if (status === 'fail') {
    const supabase = getSupabaseAdmin();
    await supabase.from('bookings').update({ status: 'failed' }).eq('id', bookingId);
    return NextResponse.redirect(`${appUrl}/?payment=fail&booking=${bookingId}`);
  }

  try {
    const tranzilaIndex = url.searchParams.get('index') || url.searchParams.get('ConfirmationCode');
    const confirmUrl = new URL(`${appUrl}/api/payments/create`);

    const confirmRes = await fetch(confirmUrl.toString(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, tranzilaIndex, paymentMethod: 'credit' }),
    });

    if (!confirmRes.ok) {
      return NextResponse.redirect(`${appUrl}/?payment=error`);
    }

    return NextResponse.redirect(`${appUrl}/?payment=success&booking=${bookingId}`);
  } catch {
    return NextResponse.redirect(`${appUrl}/?payment=error`);
  }
}
