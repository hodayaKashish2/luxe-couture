import { NextResponse } from 'next/server';
import { calculateCommission, COMMISSION_PERCENT } from '@/lib/commission';
import {
  sendAdminEmail,
  sendBookingConfirmationEmail,
  sendBookingRequestSubmittedEmail,
} from '@/lib/email';
import { ownerResponseDeadlineIso } from '@/lib/booking-owner-deadlines';
import {
  notifyOwnerOfBookingRequest,
} from '@/lib/booking-owner-flow';
import { processAllBookingLifecycle } from '@/lib/booking-lifecycle';
import { BOOKING_SLOT_BLOCKED_USER_MESSAGE } from '@/lib/booking-payment-deadlines';
import { userOwnsDress } from '@/lib/dress-ownership';
import { getUserFromRequest } from '@/lib/user-auth';
import { phonesMatch } from '@/lib/phone-match';
import { isPastDate } from '@/lib/booking-dates';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

function isSchemaError(message: string) {
  return (
    message.includes('bookings') ||
    message.includes('pending_payment') ||
    message.includes('pending_owner_approval') ||
    message.includes('awaiting_admin_approval') ||
    message.includes('owner_response') ||
    message.includes('owner_reminder') ||
    message.includes('owner_reject') ||
    message.includes('payment_method') ||
    message.includes('payment_reported_at') ||
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
  status?: string;
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

async function ackRenterBookingRequest(params: {
  bookingId: number;
  to: string;
  customerName: string;
  dressName: string;
  eventDate: string;
  amount: number;
}) {
  const recipient = params.to.trim();
  const customerMail = await sendBookingRequestSubmittedEmail({
    to: recipient,
    customerName: params.customerName,
    dressName: params.dressName,
    eventDate: params.eventDate,
    amount: params.amount,
  });

  if (!customerMail.success) {
    console.error('Customer booking request email failed:', customerMail.error);
    await sendAdminEmail(
      `⚠️ מייל לשוכרת לא נשלח: ${params.dressName}`,
      `
        <div dir="rtl" style="font-family:sans-serif;padding:16px;">
          <p>בקשת שריון #${params.bookingId} נשמרה, אך המייל לשוכרת <strong>${recipient}</strong> לא נשלח.</p>
          <p>סיבה: ${customerMail.error || 'לא ידוע'}</p>
        </div>
      `
    );
  }

  return customerMail;
}

function buildBookingPaymentResponse({
  bookingId,
  total,
  platformFee,
  ownerPayout,
  legacyMode,
  resumed = false,
}: {
  bookingId: number | null;
  total: number;
  platformFee: number;
  ownerPayout: number;
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
    legacyMode,
    confirmedImmediately: legacyMode,
    awaitingOwnerApproval: false,
    resumed,
  });
}

function buildOwnerApprovalResponse({
  bookingId,
  total,
  platformFee,
  ownerPayout,
  resumed = false,
}: {
  bookingId: number;
  total: number;
  platformFee: number;
  ownerPayout: number;
  resumed?: boolean;
}) {
  return NextResponse.json({
    success: true,
    bookingId,
    amount: total,
    platformFee,
    ownerPayout,
    commissionPercent: COMMISSION_PERCENT,
    awaitingOwnerApproval: true,
    legacyMode: false,
    confirmedImmediately: false,
    resumed,
  });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdmin();
    await processAllBookingLifecycle(supabase);

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

    const { data: dressRow, error: dressError } = await supabase
      .from('dresses')
      .select('id, owner_phone, owner_email, submitter_user_id')
      .eq('id', dressId)
      .maybeSingle();

    if (dressError) throw dressError;
    if (!dressRow) {
      return NextResponse.json({ error: 'השמלה לא נמצאה' }, { status: 404 });
    }

    if (
      loggedInUser &&
      userOwnsDress(dressRow, {
        userId: loggedInUser.userId,
        phone: loggedInUser.phone || phone,
        email: loggedInUser.email || email,
      })
    ) {
      return NextResponse.json(
        {
          error:
            'זו השמלה שפרסמת באתר — לא ניתן להזמין אותה לעצמך. לניהול ההזמנות והתאריכים, היכנסי ל״השמלות שלי״ באזור האישי.',
        },
        { status: 403 }
      );
    }

    const { platformFee, ownerPayout, total } = calculateCommission(dressPrice);

    const { data: existingBookings, error: existingError } = await supabase
      .from('bookings')
      .select(
        'id, status, customer_email, customer_phone, site_user_id, amount_total, platform_fee, owner_payout'
      )
      .eq('dress_id', dressId)
      .eq('event_date', date)
      .in('status', ['pending_owner_approval', 'pending_payment']);

    if (existingError && !isSchemaError(existingError.message)) {
      throw existingError;
    }

    const sameUserBooking = (existingBookings as PendingBookingRow[] | null)?.find((booking) =>
      bookingMatchesCustomer(booking, loggedInUser, email, phone)
    );

    if (sameUserBooking) {
      const resumedTotal = Number(sameUserBooking.amount_total || total);
      const resumedPlatformFee = Number(sameUserBooking.platform_fee || platformFee);
      const resumedOwnerPayout = Number(sameUserBooking.owner_payout || ownerPayout);

      if (sameUserBooking.status === 'pending_payment') {
        return buildBookingPaymentResponse({
          bookingId: sameUserBooking.id,
          total: resumedTotal,
          platformFee: resumedPlatformFee,
          ownerPayout: resumedOwnerPayout,
          legacyMode: false,
          resumed: true,
        });
      }

      if (sameUserBooking.status === 'pending_owner_approval') {
        await ackRenterBookingRequest({
          bookingId: sameUserBooking.id,
          to: email,
          customerName: name,
          dressName,
          eventDate: date,
          amount: resumedTotal,
        });

        return buildOwnerApprovalResponse({
          bookingId: sameUserBooking.id,
          total: resumedTotal,
          platformFee: resumedPlatformFee,
          ownerPayout: resumedOwnerPayout,
          resumed: true,
        });
      }
    }

    const { data: blockingBookings, error: heldError } = await supabase
      .from('bookings')
      .select('id, status, customer_email, customer_phone, site_user_id')
      .eq('dress_id', dressId)
      .eq('event_date', date)
      .in('status', ['confirmed', 'pending_payment', 'awaiting_admin_approval']);

    if (heldError && !isSchemaError(heldError.message)) {
      throw heldError;
    }

    const blockedByOther = ((blockingBookings as PendingBookingRow[] | null) ?? []).some(
      (booking) => !bookingMatchesCustomer(booking, loggedInUser, email, phone)
    );

    if (blockedByOther) {
      return NextResponse.json(
        { error: BOOKING_SLOT_BLOCKED_USER_MESSAGE },
        { status: 409 }
      );
    }

    const createdAt = new Date().toISOString();
    const deadlineIso = ownerResponseDeadlineIso(createdAt);

    const requestPayload: Record<string, unknown> = {
      dress_id: dressId,
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      event_date: date,
      status: 'pending_owner_approval',
      amount_total: total,
      platform_fee: platformFee,
      owner_payout: ownerPayout,
      owner_response_deadline: deadlineIso,
    };
    if (loggedInUser?.userId) {
      requestPayload.site_user_id = loggedInUser.userId;
    }

    let bookingId: number | null = null;
    let legacyMode = false;

    let requestInsert = await supabase.from('bookings').insert([requestPayload]).select('id').single();

    if (requestInsert.error?.message && shouldOmitSiteUserId(requestInsert.error.message)) {
      delete requestPayload.site_user_id;
      requestInsert = await supabase.from('bookings').insert([requestPayload]).select('id').single();
    }

    if (requestInsert.error) {
      if (!isSchemaError(requestInsert.error.message)) {
        console.error('Booking insert error:', requestInsert.error.message);
        return NextResponse.json(
          { error: `שגיאה בשמירת ההזמנה: ${requestInsert.error.message}` },
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
                'טבלת השריונות לא מוגדרת ב-Supabase. הריצי את upgrade-v8-owner-booking-approval.sql ב-SQL Editor.',
            },
            { status: 503 }
          );
        }

        await sendAdminEmail(
          `📅 שריון (ללא DB): ${dressName}`,
          `
            <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
              <h2>שריון חדש — יש להריץ SQL upgrades ב-Supabase</h2>
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
          message: 'ההזמנה נקלטה! (הריצי upgrade-v8 ב-Supabase)',
        });
      }

      bookingId = legacyInsert.data.id;
      legacyMode = true;
    } else {
      bookingId = requestInsert.data.id;
    }

    await sendAdminEmail(
      legacyMode
        ? `📅 שריון חדש: ${dressName}`
        : `📨 בקשת שריון חדשה (ממתין למשכירה): ${dressName}`,
      `
        <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #eadaaf;border-radius:12px;">
          <h2>${legacyMode ? 'שריון חדש באתר' : 'בקשת שריון — ממתין לאישור משכירה'}</h2>
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

      return buildBookingPaymentResponse({
        bookingId,
        total,
        platformFee,
        ownerPayout,
        legacyMode: true,
      });
    }

    if (bookingId) {
      await ackRenterBookingRequest({
        bookingId,
        to: email,
        customerName: name,
        dressName,
        eventDate: date,
        amount: total,
      });

      await notifyOwnerOfBookingRequest(supabase, {
        bookingId,
        dressId,
        customerName: name,
        customerPhone: phone,
        eventDate: date,
        amount: total,
      });
    }

    return buildOwnerApprovalResponse({
      bookingId: bookingId!,
      total,
      platformFee,
      ownerPayout,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה בהזמנה';
    console.error('Booking error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  const url = new URL(request.url);
  const bookingId = Number(url.searchParams.get('bookingId'));
  const dressId = Number(url.searchParams.get('dressId'));
  const eventDate = String(url.searchParams.get('date') || '').trim();
  const emailParam = String(url.searchParams.get('email') || '').trim();
  const phoneParam = String(url.searchParams.get('phone') || '').trim();

  try {
    const supabase = getSupabaseAdmin();
    const runLifecycle = url.searchParams.get('runLifecycle') === '1';
    if (runLifecycle) {
      await processAllBookingLifecycle(supabase);
    }

    const loggedInUser = getUserFromRequest(request);

    if (dressId && !eventDate) {
      const email = emailParam || loggedInUser?.email || '';
      const phone = phoneParam || loggedInUser?.phone || '';

      if (!email && !phone && !loggedInUser?.userId) {
        return NextResponse.json({ success: true, booking: null });
      }

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(
          'id, dress_id, customer_name, customer_phone, customer_email, event_date, status, amount_total, platform_fee, owner_payout, site_user_id'
        )
        .eq('dress_id', dressId)
        .in('status', ['pending_owner_approval', 'pending_payment', 'awaiting_admin_approval'])
        .order('id', { ascending: false });

      if (error) throw error;

      const booking = (bookings ?? []).find((row) =>
        bookingMatchesCustomer(row, loggedInUser, email, phone)
      );

      if (!booking) {
        return NextResponse.json({ success: true, booking: null });
      }

      const { data: dress } = await supabase
        .from('dresses')
        .select('name, price')
        .eq('id', booking.dress_id)
        .maybeSingle();

      return NextResponse.json({
        success: true,
        booking: {
          id: booking.id,
          dressId: booking.dress_id,
          dressName: dress?.name || '',
          dressPrice: Number(dress?.price || booking.amount_total || 0),
          status: booking.status,
          amount: Number(booking.amount_total || 0),
          platformFee: Number(booking.platform_fee || 0),
          ownerPayout: Number(booking.owner_payout || 0),
          eventDate: booking.event_date,
          canPay: booking.status === 'pending_payment',
          awaitingOwner: booking.status === 'pending_owner_approval',
          awaitingAdmin: booking.status === 'awaiting_admin_approval',
        },
      });
    }

    if (dressId && eventDate) {
      const email = emailParam || loggedInUser?.email || '';
      const phone = phoneParam || loggedInUser?.phone || '';

      if (!email && !phone && !loggedInUser?.userId) {
        return NextResponse.json({ success: true, booking: null });
      }

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(
          'id, dress_id, customer_name, customer_phone, customer_email, event_date, status, amount_total, platform_fee, owner_payout, site_user_id'
        )
        .eq('dress_id', dressId)
        .eq('event_date', eventDate)
        .in('status', ['pending_owner_approval', 'pending_payment', 'awaiting_admin_approval'])
        .order('id', { ascending: false });

      if (error) throw error;

      const booking = (bookings ?? []).find((row) =>
        bookingMatchesCustomer(row, loggedInUser, email, phone)
      );

      if (!booking) {
        return NextResponse.json({ success: true, booking: null });
      }

      const { data: dress } = await supabase
        .from('dresses')
        .select('name, price')
        .eq('id', booking.dress_id)
        .maybeSingle();

      return NextResponse.json({
        success: true,
        booking: {
          id: booking.id,
          dressId: booking.dress_id,
          dressName: dress?.name || '',
          dressPrice: Number(dress?.price || booking.amount_total || 0),
          status: booking.status,
          amount: Number(booking.amount_total || 0),
          platformFee: Number(booking.platform_fee || 0),
          ownerPayout: Number(booking.owner_payout || 0),
          eventDate: booking.event_date,
          canPay: booking.status === 'pending_payment',
          awaitingOwner: booking.status === 'pending_owner_approval',
          awaitingAdmin: booking.status === 'awaiting_admin_approval',
        },
      });
    }

    if (!bookingId) {
      return NextResponse.json({ error: 'חסר מזהה הזמנה' }, { status: 400 });
    }
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(
        'id, dress_id, customer_name, customer_phone, customer_email, event_date, status, amount_total, platform_fee, owner_payout, site_user_id, owner_reject_reason, payment_deadline, owner_responded_at'
      )
      .eq('id', bookingId)
      .maybeSingle();

    if (error) throw error;
    if (!booking) {
      return NextResponse.json({ error: 'הזמנה לא נמצאה' }, { status: 404 });
    }

    const email = String(booking.customer_email || '');
    const phone = String(booking.customer_phone || '');
    if (!bookingMatchesCustomer(booking, loggedInUser, email, phone)) {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json(
        {
          success: false,
          cancelled: true,
          reason: booking.owner_reject_reason || 'הבקשה בוטלה.',
          error: booking.owner_reject_reason || 'הבקשה בוטלה.',
        },
        { status: 410 }
      );
    }

    const { data: dress } = await supabase
      .from('dresses')
      .select('name, price')
      .eq('id', booking.dress_id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        dressId: booking.dress_id,
        dressName: dress?.name || '',
        dressPrice: Number(dress?.price || booking.amount_total || 0),
        status: booking.status,
        amount: Number(booking.amount_total || 0),
        platformFee: Number(booking.platform_fee || 0),
        ownerPayout: Number(booking.owner_payout || 0),
        eventDate: booking.event_date,
        canPay: booking.status === 'pending_payment',
        awaitingOwner: booking.status === 'pending_owner_approval',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
