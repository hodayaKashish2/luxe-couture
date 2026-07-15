import { NextResponse } from 'next/server';
import { calculateCommission, COMMISSION_PERCENT } from '@/lib/commission';
import { sendAdminEmail, sendBookingConfirmationEmail, sendBookingPendingEmail } from '@/lib/email';
import { getUserFromRequest } from '@/lib/user-auth';
import { phonesMatch } from '@/lib/owner-auth';
import { isPastDate } from '@/lib/booking-dates';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';
import { buildTranzilaPaymentUrl, isTranzilaConfigured } from '@/lib/tranzila';

function isSchemaError(message: string) {
  return (
    message.includes('bookings') ||
    message.includes('pending_payment') ||
    message.includes('amount_total') ||
    message.includes('schema cache')
  );
}

function shouldOmitSiteUserId(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes('site_user_id') ||
    m.includes('bigint') ||
    m.includes('invalid input syntax')
  );
}

type PendingBookingRow = {
  id: number;
  customer_email?: string;
  customer_phone?: string;
  site_user_id?: string | number | null;
  amount_total?: number;
  platform_fee?: number;
  owner_payout?: number;
};

function bookingMatchesCustomer(
  booking: PendingBookingRow,
  loggedInUser: ReturnType<typeof getUserFromRequest>,
  email: string,
  phone: string
) {
  if (
    loggedInUser?.userId &&
    booking.site_user_id != null &&
    String(booking.site_user_id) === String(loggedInUser.userId)
  ) {
    return true;
  }
  if (
    email &&
    booking.customer_email &&
    booking.customer_email.trim().toLowerCase() === email.trim().toLowerCase()
  ) {
    return true;
  }
  if (phone && booking.customer_phone && phonesMatch(booking.customer_phone, phone)) {
    return true;
  }
  return false;
}

function buildBookingPaymentResponse({
  bookingId,
  total,
  platformFee,
  ownerPayout,
  paymentUrl,
  legacyMode,
  resumed = false,
}: {
  bookingId: number | null;
  total: number;
  platformFee: number;
  ownerPayout: number;
  paymentUrl: string | null;
  legacyMode: boolean;
  resumed?: boolean;
}) {
  return NextResponse.json({
    success: true,
    bookingId,
    amount: total,
    platformFee,
    ownerPayout,
    commissionPercent: COMMISSION_PERCENT,
    paymentUrl,
    legacyMode,
    confirmedImmediately: legacyMode,
    mockMode: legacyMode || !isTranzilaConfigured(),
    resumed,
  });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const loggedInUser = getUserFromRequest(request);
    const dressId = Number(body.dressId);
    const name = String(body.name || loggedInUser?.displayName || '').trim();
    const phone = String(body.phone || loggedInUser?.phone || '').trim();
    const email = String(body.email || loggedInUser?.email || '').trim();
    const date = String(body.date || '').trim();
    const dressName = String(body.dressName || '').trim();
    const dressPrice = Number(body.dressPrice || 0);

    if (!Number.isFinite(dressId) || dressId <= 0) {
      return NextResponse.json({ error: 'מזהה שמלה לא תקין' }, { status: 400 });
    }

    if (!name || !phone || !email || !date || !dressName || !dressPrice) {
      return NextResponse.json({ error: 'חסרים פרטים בהזמנה (שם, טלפון, אימייל, תאריך)' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'כתובת אימייל לא תקינה' }, { status: 400 });
    }

    if (isPastDate(date)) {
      return NextResponse.json({ error: 'לא ניתן להזמין תאריך שכבר עבר. בחרי תאריך עתידי.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { platformFee, ownerPayout, total } = calculateCommission(dressPrice);

    const { data: confirmedBooking, error: confirmedError } = await supabase
      .from('bookings')
      .select('id')
      .eq('dress_id', dressId)
      .eq('event_date', date)
      .eq('status', 'confirmed')
      .maybeSingle();

    if (confirmedError && !isSchemaError(confirmedError.message)) {
      throw confirmedError;
    }

    if (confirmedBooking) {
      return NextResponse.json(
        { error: 'השמלה כבר שמורה לתאריך זה. בחרי תאריך אחר.' },
        { status: 409 }
      );
    }

    const { data: pendingBookings, error: pendingError } = await supabase
      .from('bookings')
      .select('id, customer_email, customer_phone, site_user_id, amount_total, platform_fee, owner_payout')
      .eq('dress_id', dressId)
      .eq('event_date', date)
      .eq('status', 'pending_payment');

    if (pendingError && !isSchemaError(pendingError.message)) {
      throw pendingError;
    }

    const sameUserPending = (pendingBookings as PendingBookingRow[] | null)?.find((booking) =>
      bookingMatchesCustomer(booking, loggedInUser, email, phone)
    );

    if (sameUserPending) {
      const resumedTotal = Number(sameUserPending.amount_total || total);
      const resumedPlatformFee = Number(sameUserPending.platform_fee || platformFee);
      const resumedOwnerPayout = Number(sameUserPending.owner_payout || ownerPayout);
      const paymentUrl = buildTranzilaPaymentUrl({
        amount: resumedTotal,
        bookingId: sameUserPending.id,
        description: `השכרת שמלה: ${dressName}`,
        customerName: name,
        customerEmail: email,
      });

      return buildBookingPaymentResponse({
        bookingId: sameUserPending.id,
        total: resumedTotal,
        platformFee: resumedPlatformFee,
        ownerPayout: resumedOwnerPayout,
        paymentUrl,
        legacyMode: false,
        resumed: true,
      });
    }

    const paymentPayload: Record<string, unknown> = {
      dress_id: dressId,
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      event_date: date,
      status: 'pending_payment',
      amount_total: total,
      platform_fee: platformFee,
      owner_payout: ownerPayout,
    };
    if (loggedInUser?.userId) {
      paymentPayload.site_user_id = loggedInUser.userId;
    }

    let bookingId: number | null = null;
    let legacyMode = false;

    let paymentInsert = await supabase.from('bookings').insert([paymentPayload]).select('id').single();

    if (paymentInsert.error?.message && shouldOmitSiteUserId(paymentInsert.error.message)) {
      delete paymentPayload.site_user_id;
      paymentInsert = await supabase.from('bookings').insert([paymentPayload]).select('id').single();
    }

    if (paymentInsert.error) {
      if (!isSchemaError(paymentInsert.error.message)) {
        console.error('Booking insert error:', paymentInsert.error.message);
        return NextResponse.json(
          { error: `שגיאה בשמירת ההזמנה: ${paymentInsert.error.message}` },
          { status: 500 }
        );
      }

      const legacyPayload: Record<string, unknown> = {
        dress_id: dressId,
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        event_date: date,
        status: 'confirmed',
      };
      if (loggedInUser?.userId) legacyPayload.site_user_id = loggedInUser.userId;

      let legacyInsert = await supabase.from('bookings').insert([legacyPayload]).select('id').single();
      if (legacyInsert.error?.message && shouldOmitSiteUserId(legacyInsert.error.message)) {
        delete legacyPayload.site_user_id;
        legacyInsert = await supabase.from('bookings').insert([legacyPayload]).select('id').single();
      }

      if (legacyInsert.error) {
        if (!isSchemaError(legacyInsert.error.message)) {
          console.error('Legacy booking insert error:', legacyInsert.error.message);
          return NextResponse.json(
            {
              error:
                'טבלת השריונות לא מוגדרת ב-Supabase. הריצי את run-all-upgrades.sql ב-SQL Editor.',
            },
            { status: 503 }
          );
        }

        await sendAdminEmail(
          `📅 שריון (ללא DB): ${dressName}`,
          `
            <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
              <h2>שריון חדש — יש להריץ upgrade-v2.sql ב-Supabase</h2>
              <p><strong>שמלה:</strong> ${dressName}</p>
              <p><strong>שוכרת:</strong> ${name} · ${phone} · ${email}</p>
              <p><strong>תאריך:</strong> ${date}</p>
              <p><strong>סכום:</strong> ₪${total}</p>
            </div>
          `
        );

        const customerMail = await sendBookingConfirmationEmail({
          to: email,
          customerName: name,
          dressName,
          eventDate: date,
          amount: total,
        });
        if (!customerMail.success) {
          console.error('Customer confirmation email failed:', customerMail.error);
        }

        return NextResponse.json({
          success: true,
          legacyMode: true,
          confirmedImmediately: true,
          bookingId: null,
          amount: total,
          platformFee,
          ownerPayout,
          commissionPercent: COMMISSION_PERCENT,
          paymentUrl: null,
          mockMode: true,
          message: 'ההזמנה נקלטה! (הריצי upgrade-v2.sql ב-Supabase ללוח שנה אוטומטי)',
        });
      }

      bookingId = legacyInsert.data.id;
      legacyMode = true;
    } else {
      bookingId = paymentInsert.data.id;
    }

    const paymentUrl = bookingId && !legacyMode
      ? buildTranzilaPaymentUrl({
          amount: total,
          bookingId,
          description: `השכרת שמלה: ${dressName}`,
          customerName: name,
          customerEmail: email,
        })
      : null;

    await sendAdminEmail(
      legacyMode
        ? `📅 שריון חדש: ${dressName}`
        : `📅 שריון חדש (ממתין לתשלום): ${dressName}`,
      `
        <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #eadaaf;border-radius:12px;">
          <h2>${legacyMode ? 'שריון חדש באתר' : 'שריון חדש — ממתין לתשלום'}</h2>
          <p><strong>שמלה:</strong> ${dressName}</p>
          <p><strong>שוכרת:</strong> ${name} · ${phone}</p>
          <p><strong>תאריך:</strong> ${date}</p>
          <p><strong>סכום:</strong> ₪${total}</p>
        </div>
      `
    );

    if (legacyMode) {
      const customerMail = await sendBookingConfirmationEmail({
        to: email,
        customerName: name,
        dressName,
        eventDate: date,
        amount: total,
      });
      if (!customerMail.success) {
        console.error('Customer confirmation email failed:', customerMail.error);
      }
    } else {
      const customerMail = await sendBookingPendingEmail({
        to: email,
        customerName: name,
        dressName,
        eventDate: date,
        amount: total,
        paymentUrl,
      });
      if (!customerMail.success) {
        console.error('Customer pending booking email failed:', customerMail.error);
      }
    }

    return buildBookingPaymentResponse({
      bookingId,
      total,
      platformFee,
      ownerPayout,
      paymentUrl,
      legacyMode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה בהזמנה';
    console.error('Booking error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
