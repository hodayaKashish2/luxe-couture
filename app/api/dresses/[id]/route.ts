import { NextResponse } from 'next/server';
import { mapPublicDressRow } from '@/lib/dress-public-map';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { data: dress, error } = await supabase
      .from('dresses')
      .select('*')
      .eq('id', id)
      .eq('status', 'approved')
      .maybeSingle();

    if (error) throw error;
    if (!dress) return NextResponse.json({ error: 'שמלה לא נמצאה' }, { status: 404 });

    let bookedDates: string[] = [];
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('event_date')
      .eq('dress_id', id)
      .eq('status', 'confirmed');

    if (!bookingsError && bookings) {
      bookedDates = bookings.map((b) => b.event_date);
    }

    return NextResponse.json(mapPublicDressRow(dress as Record<string, unknown>, bookedDates), {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה בשליפת שמלה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
