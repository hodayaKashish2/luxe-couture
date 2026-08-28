import { NextResponse } from 'next/server';
import { mapPublicDressRow } from '@/lib/dress-public-map';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

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
      (dresses ?? []).map((dress) => mapPublicDressRow(dress, bookingsByDress[String(dress.id)] || []))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה בשליפת שמלות';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
