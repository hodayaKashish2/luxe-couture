import { NextResponse } from 'next/server';

import { calculateCommission } from '@/lib/commission';

import { sendAdminEmail, sendBookingConfirmationEmail } from '@/lib/email';

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

      return NextResponse.json({ error: 'חסר מזהה שריון' }, { status: 400 });

    }



    const supabase = getSupabaseAdmin();

    const { data: booking, error } = await supabase

      .from('bookings')

      .select('id, dress_id, customer_name, customer_email, event_date, status, amount_total')

      .eq('id', bookingId)

      .maybeSingle();



    if (error) throw error;

    if (!booking) {

      return NextResponse.json({ error: 'שריון לא נמצא' }, { status: 404 });

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

    const bookingId = body.bookingId;

    const tranzilaIndex = body.tranzilaIndex ? String(body.tranzilaIndex) : null;



    if (!bookingId) {

      return NextResponse.json({ error: 'חסר מזהה שריון' }, { status: 400 });

    }



    const supabase = getSupabaseAdmin();



    const { data: booking, error: fetchError } = await supabase

      .from('bookings')

      .select('id, dress_id, customer_name, customer_phone, customer_email, event_date, status, amount_total, platform_fee, owner_payout')

      .eq('id', bookingId)

      .maybeSingle();



    if (fetchError) throw fetchError;

    if (!booking) {

      return NextResponse.json({ error: 'שריון לא נמצא' }, { status: 404 });

    }

    if (booking.status === 'confirmed') {

      return NextResponse.json({ success: true });

    }



    const { data: dress } = await supabase

      .from('dresses')

      .select('name, owner_name, rental_count')

      .eq('id', booking.dress_id)

      .maybeSingle();



    const { error: updateBookingError } = await supabase

      .from('bookings')

      .update({

        status: 'confirmed',

        tranzila_index: tranzilaIndex,

        payment_confirmed_at: new Date().toISOString(),

      })

      .eq('id', bookingId);



    if (updateBookingError) throw updateBookingError;



    if (dress) {

      await supabase

        .from('dresses')

        .update({ rental_count: Number(dress.rental_count || 0) + 1 })

        .eq('id', booking.dress_id);

    }



    await sendAdminEmail(

      `✅ תשלום אושר: ${dress?.name || 'שמלה'}`,

      `

        <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">

          <h2>תשלום אושר בהצלחה</h2>

          <p><strong>שמלה:</strong> ${dress?.name || ''}</p>

          <p><strong>שוכרת:</strong> ${booking.customer_name}</p>

          <p><strong>תאריך:</strong> ${booking.event_date}</p>

          <p><strong>סכום:</strong> ₪${booking.amount_total}</p>

        </div>

      `

    );

    if (booking.customer_email) {
      await sendBookingConfirmationEmail({
        to: booking.customer_email,
        customerName: booking.customer_name,
        dressName: dress?.name || 'שמלה',
        eventDate: booking.event_date,
        amount: Number(booking.amount_total),
      });
    }



    return NextResponse.json({ success: true });

  } catch (error) {

    const message = error instanceof Error ? error.message : 'שגיאה באישור תשלום';

    return NextResponse.json({ error: message }, { status: 500 });

  }

}


