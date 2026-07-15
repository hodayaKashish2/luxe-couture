import { NextResponse } from 'next/server';

import { confirmBookingPayment, reportManualPayment } from '@/lib/payment-confirmation';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';
import { buildTranzilaPaymentUrl, isTranzilaConfigured } from '@/lib/tranzila';

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const bookingId = body.bookingId;

    if (!bookingId) {
      return NextResponse.json({ error: 'חסר מזהה הזמנה' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, dress_id, customer_name, customer_email, event_date, status, amount_total')
      .eq('id', bookingId)
      .maybeSingle();

    if (error) throw error;
    if (!booking) {
      return NextResponse.json({ error: 'הזמנה לא נמצאה' }, { status: 404 });
    }
    if (booking.status === 'confirmed') {
      return NextResponse.json({ success: true, alreadyPaid: true });
    }

    if (!isTranzilaConfigured()) {
      return NextResponse.json({
        success: true,
        mockMode: true,
        message: 'מצב בדיקה — Tranzila לא מוגדר',
      });
    }

    const { data: dress } = await supabase
      .from('dresses')
      .select('name')
      .eq('id', booking.dress_id)
      .maybeSingle();

    const paymentUrl = buildTranzilaPaymentUrl({
      amount: Number(booking.amount_total),
      bookingId: booking.id,
      description: `השכרת שמלה: ${dress?.name || ''}`,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
    });

    return NextResponse.json({ success: true, paymentUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const bookingId = Number(body.bookingId);
    const tranzilaIndex = body.tranzilaIndex ? String(body.tranzilaIndex) : null;
    const paymentMethod = body.paymentMethod ? String(body.paymentMethod) : null;

    if (!bookingId) {
      return NextResponse.json({ error: 'חסר מזהה הזמנה' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    if (paymentMethod === 'bit' || paymentMethod === 'bank') {
      const result = await reportManualPayment(supabase, bookingId, paymentMethod);
      if ('error' in result && result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status || 400 });
      }
      return NextResponse.json({
        success: true,
        awaitingAdminApproval: true,
        alreadyReported: 'alreadyReported' in result ? result.alreadyReported : false,
      });
    }

    if (paymentMethod === 'credit' && !tranzilaIndex) {
      if (!isTranzilaConfigured()) {
        const result = await confirmBookingPayment(supabase, bookingId, {
          paymentMethod: 'credit',
          notifyAdmin: true,
        });
        if ('error' in result && result.error) {
          return NextResponse.json({ error: result.error }, { status: result.status || 400 });
        }
        return NextResponse.json({ success: true });
      }

      return NextResponse.json(
        {
          error:
            'תשלום באשראי מאושר אוטומטית אחרי סיום התשלום בדף המאובטח. אם סיימת לשלם, המתיני לאישור במייל.',
        },
        { status: 400 }
      );
    }

    const result = await confirmBookingPayment(supabase, bookingId, {
      tranzilaIndex,
      paymentMethod: paymentMethod || 'credit',
      notifyAdmin: true,
    });

    if ('error' in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה באישור תשלום';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
