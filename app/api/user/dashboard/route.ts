import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/user-auth';
import { phonesMatch } from '@/lib/owner-auth';
import { userOwnsDress } from '@/lib/dress-ownership';
import {
  filterBookingsWithinRetention,
  filterRemovedDressesWithinRetention,
  shouldShowBookingByEventDate,
  shouldShowRemovedDress,
} from '@/lib/retention';
import { mapOwnedDressForEdit } from '@/lib/dress-pending-update';
import { processBookingOwnerDeadlines } from '@/lib/booking-owner-flow';
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
    await processBookingOwnerDeadlines(supabase);

    const { data: allDresses, error: dressesError } = await supabase
      .from('dresses')
      .select('*')
      .in('status', ['approved', 'pending', 'removed'])
      .order('created_at', { ascending: false });

    if (dressesError) throw dressesError;

    const myDresses = filterRemovedDressesWithinRetention(
      (allDresses ?? []).filter((d) => userOwnsDress(d, user))
    );

    const dressIds = myDresses.map((d) => d.id);
    let ownerBookings: Array<Record<string, unknown>> = [];

    if (dressIds.length > 0) {
      const { data: bookingRows, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, dress_id, customer_name, customer_phone, customer_email, event_date, status, created_at')
        .in('dress_id', dressIds)
        .in('status', [
          'confirmed',
          'pending_owner_approval',
          'pending_payment',
          'awaiting_admin_approval',
        ])
        .order('event_date', { ascending: true });

      if (bookingsError && !bookingsError.message.includes('bookings')) {
        throw bookingsError;
      }

      const dressNames = Object.fromEntries(myDresses.map((d) => [String(d.id), d.name]));
      ownerBookings = filterBookingsWithinRetention(
        (bookingRows ?? []).map((b) => ({
          ...b,
          dress_name: dressNames[String(b.dress_id)] || 'שמלה',
        }))
      );
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

    const reservationStatuses = [
      'confirmed',
      'pending_owner_approval',
      'pending_payment',
      'awaiting_admin_approval',
      'cancelled',
    ];

    const withUserId = await supabase
      .from('bookings')
      .select('id, dress_id, customer_name, customer_phone, customer_email, event_date, status, created_at, site_user_id, owner_reject_reason')
      .in('status', reservationStatuses)
      .order('event_date', { ascending: true });

    if (withUserId.error?.message?.includes('site_user_id')) {
      const withoutUserId = await supabase
        .from('bookings')
        .select('id, dress_id, customer_name, customer_phone, customer_email, event_date, status, created_at')
        .in('status', reservationStatuses)
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
      let dressOwnerMap: Record<
        string,
        {
          owner_name: string;
          owner_phone: string;
          owner_email: string;
          status: string;
          removed_at: string | null;
          created_at: string | null;
        }
      > = {};

      if (dressIdsNeeded.length > 0) {
        type DressMetaRow = {
          id: number | string;
          name: string;
          owner_name: string | null;
          owner_phone: string | null;
          owner_email: string | null;
          status: string | null;
          removed_at?: string | null;
          created_at: string | null;
        };

        let dressRows: DressMetaRow[] | null = null;
        const withRemoved = await supabase
          .from('dresses')
          .select('id, name, owner_name, owner_phone, owner_email, status, removed_at, created_at')
          .in('id', dressIdsNeeded);

        if (withRemoved.error?.message?.includes('removed_at')) {
          const withoutRemoved = await supabase
            .from('dresses')
            .select('id, name, owner_name, owner_phone, owner_email, status, created_at')
            .in('id', dressIdsNeeded);
          dressRows = (withoutRemoved.data ?? []) as DressMetaRow[];
        } else {
          dressRows = (withRemoved.data ?? []) as DressMetaRow[];
        }

        dressMap = Object.fromEntries((dressRows ?? []).map((d) => [String(d.id), d.name]));
        dressOwnerMap = Object.fromEntries(
          (dressRows ?? []).map((d) => [
            String(d.id),
            {
              owner_name: d.owner_name || '',
              owner_phone: d.owner_phone || '',
              owner_email: d.owner_email || '',
              status: d.status || 'approved',
              removed_at: d.removed_at ?? null,
              created_at: d.created_at || null,
            },
          ])
        );
      }

      myReservations = allBookings
        .filter((b) => {
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
        .map((b) => {
          const owner = dressOwnerMap[String(b.dress_id)] || {
            owner_name: '',
            owner_phone: '',
            owner_email: '',
            status: 'approved',
            removed_at: null,
            created_at: null,
          };
          return {
            ...b,
            dress_name: dressMap[String(b.dress_id)] || 'שמלה',
            owner_name: owner.owner_name,
            owner_phone: owner.owner_phone,
            owner_email: owner.owner_email,
            dress_status: owner.status,
            dress_removed_at: owner.removed_at,
            dress_created_at: owner.created_at,
          };
        })
        .filter((b) => {
          if (
            b.dress_status === 'removed' &&
            !shouldShowRemovedDress(b.dress_removed_at, b.dress_created_at)
          ) {
            return false;
          }
          return shouldShowBookingByEventDate(b.event_date, b.status);
        });
    }

    return NextResponse.json({
      user,
      rentals: {
        dresses: myDresses.map((d) => {
          const mapped = mapOwnedDressForEdit(d as Record<string, unknown>);
          return {
            ...mapped,
            featured_boost: Number(d.featured_boost || 0),
            featured_until: d.featured_until || null,
            booked_dates: ownerBookings
              .filter((b) => String(b.dress_id) === String(d.id) && b.status === 'confirmed')
              .map((b) => b.event_date),
          };
        }),
        bookings: ownerBookings,
      },
      reservations: myReservations,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
