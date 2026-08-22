import { NextResponse } from 'next/server';
import { dressRowToNotify, resolveOwnerContact } from '@/lib/dress-approval-notify';
import {
  sendBookingCancelledByRenterEmail,
  sendBookingCancelledOwnerNoticeEmail,
} from '@/lib/email';
import { getUserFromRequest } from '@/lib/user-auth';
import { userOwnsBooking } from '@/lib/booking-ownership';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const CANCELLABLE_STATUSES = new Set([
  'pending_owner_approval',
  'pending_payment',
  'awaiting_admin_approval',
  'confirmed',
]);

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
      .select(
        'id, dress_id, status, site_user_id, customer_name, customer_email, customer_phone, event_date'
      )
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

    const { data: dressRow } = await supabase
      .from('dresses')
      .select('id, name, owner_name, owner_email, owner_phone, description, submitter_user_id')
      .eq('id', booking.dress_id)
      .maybeSingle();

    const dressName = dressRow?.name || 'שמלה';
    const eventDate = String(booking.event_date || '');
    const customerName = String(booking.customer_name || user.displayName || 'שוכרת');
    const customerEmail = String(booking.customer_email || user.email || '').trim();

    if (customerEmail) {
      try {
        await sendBookingCancelledByRenterEmail({
          to: customerEmail,
          customerName,
          dressName,
          eventDate,
        });
      } catch (emailError) {
        console.error('cancel renter email failed:', emailError);
      }
    }

    if (dressRow) {
      try {
        const owner = await resolveOwnerContact(supabase, dressRowToNotify(dressRow));
        if (owner.email) {
          await sendBookingCancelledOwnerNoticeEmail({
            to: owner.email,
            ownerName: owner.name,
            dressName,
            customerName,
            eventDate,
          });
        }
      } catch (emailError) {
        console.error('cancel owner email failed:', emailError);
      }
    }

    return NextResponse.json({ success: true, message: 'ההזמנה בוטלה בהצלחה' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
