import { NextResponse } from 'next/server';

import {
  approveBookingByOwner,
  processBookingOwnerDeadlines,
  rejectBookingByOwner,
} from '@/lib/booking-owner-flow';
import { userOwnsDress } from '@/lib/dress-ownership';
import { getUserFromRequest } from '@/lib/user-auth';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const bookingId = Number(id);
    if (!bookingId) {
      return NextResponse.json({ error: 'מזהה בקשה לא תקין' }, { status: 400 });
    }

    const body = await request.json();
    const action = String(body.action || '').trim();
    const reason = String(body.reason || '').trim();

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'פעולה לא תקינה' }, { status: 400 });
    }

    if (action === 'reject' && reason.length < 3) {
      return NextResponse.json(
        { error: 'יש לציין סיבת דחייה (לפחות 3 תווים)' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    await processBookingOwnerDeadlines(supabase);

    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, dress_id, status')
      .eq('id', bookingId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!booking) {
      return NextResponse.json({ error: 'הבקשה לא נמצאה' }, { status: 404 });
    }

    const { data: dress, error: dressError } = await supabase
      .from('dresses')
      .select('id, owner_phone, owner_email, submitter_user_id')
      .eq('id', booking.dress_id)
      .maybeSingle();

    if (dressError) throw dressError;
    if (!dress || !userOwnsDress(dress, user)) {
      return NextResponse.json({ error: 'אין הרשאה לטפל בבקשה זו' }, { status: 403 });
    }

    if (action === 'approve') {
      const result = await approveBookingByOwner(supabase, bookingId);
      if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: result.status || 400 });
      }
      return NextResponse.json({ success: true, message: 'הבקשה אושרה — השוכרת תקבל מייל להשלמת התשלום.' });
    }

    const result = await rejectBookingByOwner(supabase, bookingId, reason);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }
    return NextResponse.json({ success: true, message: 'הבקשה נדחתה — השוכרת תקבל הודעה במייל.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
