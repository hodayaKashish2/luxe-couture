import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/user-auth';
import { phonesMatch } from '@/lib/owner-auth';
import { userOwnsDress } from '@/lib/dress-ownership';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

function emailsMatch(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export async function GET(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
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

    const myDresses = (allDresses ?? []).filter((d) => userOwnsDress(d, user));

    const dressIds = myDresses.map((d) => d.id);
    let ownerBookings: Array<Record<string, unknown>> = [];

    if (dressIds.length > 0) {
      const { data: bookingRows, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, dress_id, customer_name, customer_phone, customer_email, event_date, status, created_at')
        .in('dress_id', dressIds)
        .in('status', ['confirmed', 'pending_payment'])
        .order('event_date', { ascending: true });

      if (bookingsError && !bookingsError.message.includes('bookings')) {
        throw bookingsError;
      }

      const dressNames = Object.fromEntries(myDresses.map((d) => [String(d.id), d.name]));
      ownerBookings = (bookingRows ?? []).map((b) => ({
        ...b,
        dress_name: dressNames[String(b.dress_id)] || 'שמלה',
      }));
    }

    type ReservationRow = {
      id: number;
      dress_id: number;
      customer_name: string;
      customer_phone: string;
      customer_email: string;
      event_date: string;
      status: string;
      created_at: string;
      site_user_id?: string | number | null;
    };

    let myReservations: Array<Record<string, unknown>> = [];
    let allBookings: ReservationRow[] | null = null;
    let resError: { message: string } | null = null;

    const withUserId = await supabase
      .from('bookings')
      .select('id, dress_id, customer_name, customer_phone, customer_email, event_date, status, created_at, site_user_id')
      .in('status', ['confirmed', 'pending_payment'])
      .order('event_date', { ascending: true });

    if (withUserId.error?.message?.includes('site_user_id')) {
      const withoutUserId = await supabase
        .from('bookings')
        .select('id, dress_id, customer_name, customer_phone, customer_email, event_date, status, created_at')
        .in('status', ['confirmed', 'pending_payment'])
        .order('event_date', { ascending: true });
      allBookings = (withoutUserId.data ?? []) as ReservationRow[];
      resError = withoutUserId.error;
    } else {
      allBookings = (withUserId.data ?? []) as ReservationRow[];
      resError = withUserId.error;
    }

    if (resError && !resError.message.includes('bookings')) {
      throw resError;
    }

    if (allBookings) {
      const dressIdsNeeded = [...new Set(allBookings.map((b) => b.dress_id))];
      let dressMap: Record<string, string> = {};

      if (dressIdsNeeded.length > 0) {
        const { data: dressRows } = await supabase
          .from('dresses')
          .select('id, name')
          .in('id', dressIdsNeeded);
        dressMap = Object.fromEntries((dressRows ?? []).map((d) => [String(d.id), d.name]));
      }

      myReservations = allBookings
        .filter((b) => {
          if (b.status === 'cancelled') return false;
          if (b.site_user_id) {
            return user.userId ? String(b.site_user_id) === String(user.userId) : false;
          }
          const bookingEmail = String(b.customer_email || '').trim();
          const bookingPhone = String(b.customer_phone || '').trim();
          if (user.email?.trim() && bookingEmail && emailsMatch(bookingEmail, user.email)) {
            return true;
          }
          if (user.phone?.trim() && bookingPhone && phonesMatch(bookingPhone, user.phone)) {
            return true;
          }
          return false;
        })
        .map((b) => ({
          ...b,
          dress_name: dressMap[String(b.dress_id)] || 'שמלה',
        }));
    }

    return NextResponse.json({
      user,
      rentals: {
        dresses: myDresses.map((d) => ({
          id: String(d.id),
          name: d.name,
          price: Number(d.price),
          size: d.size,
          city: d.city || '',
          status: d.status,
          images: Array.isArray(d.images) ? d.images : [],
          rental_count: Number(d.rental_count || 0),
          booked_dates: ownerBookings
            .filter((b) => String(b.dress_id) === String(d.id) && b.status === 'confirmed')
            .map((b) => b.event_date),
        })),
        bookings: ownerBookings,
      },
      reservations: myReservations,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
