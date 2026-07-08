import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

function mapDress(row: Record<string, unknown>, bookedDates: string[] = []) {
  const ratingCount = Number(row.rating_count || 0);
  const ratingSum = Number(row.rating_sum || 0);
  const ratingAvg = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0;

  return {
    id: String(row.id),
    name: row.name,
    price: Number(row.price),
    size: row.size,
    condition: row.condition,
    description: row.description,
    images: Array.isArray(row.images) ? row.images : [],
    city: row.city || '',
    color: row.color || '',
    event_type: row.event_type || '',
    owner_name: row.owner_name || '',
    owner_phone: row.owner_phone || '',
    deposit: Number(row.deposit || 0),
    pickup_method: row.pickup_method || 'pickup',
    includes_dry_cleaning: Boolean(row.includes_dry_cleaning),
    booked_dates: bookedDates,
    rental_count: Number(row.rental_count || 0),
    rating_avg: ratingAvg,
    rating_count: ratingCount,
    created_at: row.created_at,
  };
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase לא מוגדר' },
      { status: 503 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: dresses, error: dressesError } = await supabase
      .from('dresses')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (dressesError) throw dressesError;

    const dressIds = (dresses ?? []).map((d) => d.id);
    let bookingsByDress: Record<string, string[]> = {};

    if (dressIds.length > 0) {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('dress_id, event_date')
        .in('dress_id', dressIds)
        .eq('status', 'confirmed');

      if (bookingsError && !bookingsError.message.includes('bookings')) {
        throw bookingsError;
      }

      if (bookings) {
        bookingsByDress = bookings.reduce<Record<string, string[]>>((acc, booking) => {
          const key = String(booking.dress_id);
          if (!acc[key]) acc[key] = [];
          acc[key].push(booking.event_date);
          return acc;
        }, {});
      }
    }

    return NextResponse.json(
      (dresses ?? []).map((dress) => mapDress(dress, bookingsByDress[String(dress.id)] || []))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה בשליפת שמלות';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
