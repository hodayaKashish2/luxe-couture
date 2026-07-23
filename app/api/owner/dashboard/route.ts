import { NextResponse } from 'next/server';
import { getOwnerFromRequest, phonesMatch } from '@/lib/owner-auth';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const owner = getOwnerFromRequest(request);
  if (!owner) {
    return NextResponse.json({ error: 'יש להתחבר מחדש' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: allDresses, error: dressesError } = await supabase
      .from('dresses')
      .select('*')
      .in('status', ['approved', 'pending', 'removed'])
      .order('created_at', { ascending: false });

    if (dressesError) throw dressesError;

    const dresses = (allDresses ?? []).filter((d) =>
      phonesMatch(String(d.owner_phone || ''), owner.phone)
    );

    const dressIds = dresses.map((d) => d.id);
    let bookings: Array<Record<string, unknown>> = [];

    if (dressIds.length > 0) {
      const { data: bookingRows, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, dress_id, customer_name, customer_phone, customer_email, event_date, status, created_at')
        .in('dress_id', dressIds)
        .in('status', ['confirmed', 'pending_payment', 'awaiting_admin_approval'])
        .order('event_date', { ascending: true });

      if (bookingsError && !bookingsError.message.includes('bookings')) {
        throw bookingsError;
      }

      const dressNames = Object.fromEntries(dresses.map((d) => [String(d.id), d.name]));
      bookings = (bookingRows ?? []).map((b) => ({
        ...b,
        dress_name: dressNames[String(b.dress_id)] || 'שמלה',
      }));
    }

    return NextResponse.json({
      ownerName: owner.ownerName,
      phone: owner.phone,
      dresses: dresses.map((d) => ({
        id: String(d.id),
        name: d.name,
        price: Number(d.price),
        size: d.size,
        city: d.city || '',
        color: d.color || '',
        event_type: d.event_type || '',
        status: d.status,
        deposit: Number(d.deposit || 0),
        pickup_method: d.pickup_method || 'pickup',
        includes_dry_cleaning: Boolean(d.includes_dry_cleaning),
        condition: d.condition,
        description: d.description,
        images: Array.isArray(d.images) ? d.images : [],
        rental_count: Number(d.rental_count || 0),
        created_at: d.created_at,
        booked_dates: bookings
          .filter((b) => String(b.dress_id) === String(d.id) && b.status === 'confirmed')
          .map((b) => b.event_date),
      })),
      bookings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
