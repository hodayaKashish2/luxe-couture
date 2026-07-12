import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/user-auth';
import { userOwnsBooking } from '@/lib/booking-ownership';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const CANCELLABLE_STATUSES = new Set(['pending_payment', 'confirmed']);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || '').trim();

    if (action !== 'cancel') {
      return NextResponse.json({ error: 'פעולה לא נתמכת' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, dress_id, status, site_user_id, customer_email, customer_phone')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!booking) return NextResponse.json({ error: 'הזמנה לא נמצאה' }, { status: 404 });
    if (!userOwnsBooking(booking, user)) {
      return NextResponse.json({ error: 'אין הרשאה לבטל הזמנה זו' }, { status: 403 });
    }

    if (!CANCELLABLE_STATUSES.has(booking.status)) {
      return NextResponse.json({ error: 'לא ניתן לבטל הזמנה זו' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'ההזמנה בוטלה בהצלחה' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
