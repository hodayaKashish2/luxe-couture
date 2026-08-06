import { NextResponse } from 'next/server';
import { fetchDressForNotify, notifyDressApproved } from '@/lib/dress-approval-notify';
import {
  computeDressUpdateDiff,
  getLiveDressSnapshot,
  mergeDressWithPendingUpdate,
  pendingUpdateToDressPatch,
  type PendingUpdatePayload,
} from '@/lib/dress-pending-update';
import { notifyDressUpdateApproved, notifyDressUpdateRejected } from '@/lib/dress-update-notify';
import { markDressRemoved } from '@/lib/dress-removal';
import { approveDressRating, recalculateDressRatingStats } from '@/lib/dress-rating-stats';
import { extendFeaturedUntil, FEATURED_REWARD_DAYS } from '@/lib/dress-ranking';
import { confirmBookingPayment } from '@/lib/payment-confirmation';
import { retentionCutoffDateString } from '@/lib/retention';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

function verifyToken(request: Request) {
  const token =
    request.headers.get('x-admin-token') ||
    new URL(request.url).searchParams.get('token');
  return token && process.env.ADMIN_SECRET && token === process.env.ADMIN_SECRET;
}

function parsePageParams(searchParams: URLSearchParams) {
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(50, Math.max(10, Number.parseInt(searchParams.get('limit') || '25', 10) || 25));
  return { page, limit, from: (page - 1) * limit, to: (page - 1) * limit + limit - 1 };
}

function escapeIlike(value: string) {
  return value.replace(/[%_,]/g, ' ');
}

function mapDressNameJoin(dressJoin: { name?: string } | { name?: string }[] | null) {
  if (Array.isArray(dressJoin)) return dressJoin[0]?.name;
  return dressJoin?.name;
}

function mapPendingDressRow(row: Record<string, unknown>) {
  const merged = mergeDressWithPendingUpdate(row, row.pending_update as PendingUpdatePayload | null);
  return {
    id: Number(merged.id),
    name: String(merged.name || ''),
    price: Number(merged.price || 0),
    size: String(merged.size || ''),
    city: String(merged.city || ''),
    color: String(merged.color || ''),
    description: String(merged.description || ''),
    condition: String(merged.condition || ''),
    event_type: String(merged.event_type || ''),
    deposit: Number(merged.deposit || 0),
    pickup_method: String(merged.pickup_method || ''),
    includes_dry_cleaning: Boolean(merged.includes_dry_cleaning),
    owner_name: String(merged.owner_name || ''),
    owner_phone: String(merged.owner_phone || ''),
    owner_email: String(merged.owner_email || ''),
    images: Array.isArray(merged.images) ? merged.images.map(String) : [],
    created_at: String(merged.pending_update_submitted_at || merged.created_at || ''),
    status: String(merged.status || ''),
    pending_update_kind: merged.isPendingUpdate ? ('update' as const) : ('new' as const),
  };
}

function mapBookingRow(row: {
  id: number;
  dress_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  event_date: string;
  status: string;
  created_at: string;
  amount_total?: number | null;
  payment_method?: string | null;
  dresses?: { name?: string } | { name?: string }[] | null;
}) {
  return {
    id: row.id,
    dress_id: row.dress_id,
    dress_name: mapDressNameJoin(row.dresses ?? null) || undefined,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    customer_email: row.customer_email,
    event_date: row.event_date,
    status: row.status,
    amount_total: row.amount_total != null ? Number(row.amount_total) : undefined,
    payment_method: row.payment_method,
    created_at: row.created_at,
  };
}

function mapDressRatingRow(row: {
  id: number;
  dress_id: number;
  customer_name: string;
  stars: number;
  review_text: string;
  status: string;
  created_at: string;
  dresses?: { name?: string } | { name?: string }[] | null;
}) {
  return {
    id: row.id,
    dress_id: row.dress_id,
    dress_name: mapDressNameJoin(row.dresses ?? null) || 'שמלה',
    customer_name: row.customer_name,
    stars: row.stars,
    review_text: row.review_text,
    status: row.status,
    created_at: row.created_at,
  };
}

async function loadOverview(supabase: ReturnType<typeof getSupabaseAdmin>) {
  const [
    publishedRes,
    pendingDressesRes,
    featuredRes,
    pendingReviewsRes,
    pendingRatingsRes,
    pendingPaymentsRes,
    approvedReviewsRes,
    confirmedBookingsRes,
    pendingDressesListRes,
    pendingReviewsListRes,
    pendingRatingsListRes,
    pendingPaymentsListRes,
    confirmedBookingsListRes,
    citiesRes,
  ] = await Promise.all([
    supabase.from('dresses').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('dresses').select('*', { count: 'exact', head: true }).or('status.eq.pending,pending_update.not.is.null'),
    supabase.from('dresses').select('*', { count: 'exact', head: true }).eq('status', 'approved').gt('featured_boost', 0),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('dress_ratings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'awaiting_admin_approval'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .gte('event_date', retentionCutoffDateString()),
    supabase
      .from('dresses')
      .select(
        'id, name, price, size, city, color, description, condition, event_type, deposit, pickup_method, includes_dry_cleaning, owner_name, owner_phone, owner_email, status, created_at, images, pending_update, pending_update_submitted_at'
      )
      .or('status.eq.pending,pending_update.not.is.null')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('reviews')
      .select('id, name, role, review_text, stars, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('dress_ratings')
      .select('id, dress_id, customer_name, stars, review_text, status, created_at, dresses(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('bookings')
      .select(
        'id, dress_id, customer_name, customer_phone, customer_email, event_date, status, amount_total, payment_method, created_at, dresses(name)'
      )
      .eq('status', 'awaiting_admin_approval')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('bookings')
      .select(
        'id, dress_id, customer_name, customer_phone, customer_email, event_date, status, amount_total, payment_method, created_at, dresses(name)'
      )
      .eq('status', 'confirmed')
      .gte('event_date', retentionCutoffDateString())
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('dresses').select('city').eq('status', 'approved').not('city', 'is', null),
  ]);

  if (pendingDressesListRes.error) throw pendingDressesListRes.error;
  if (pendingReviewsListRes.error) throw pendingReviewsListRes.error;

  let pendingRatings: ReturnType<typeof mapDressRatingRow>[] = [];
  if (!pendingRatingsListRes.error) {
    pendingRatings = (pendingRatingsListRes.data ?? []).map(mapDressRatingRow);
  }

  let pendingPayments: ReturnType<typeof mapBookingRow>[] = [];
  if (!pendingPaymentsListRes.error) {
    pendingPayments = (pendingPaymentsListRes.data ?? []).map(mapBookingRow);
  }

  const citySet = new Set<string>();
  for (const row of citiesRes.data ?? []) {
    const city = String(row.city || '').trim();
    if (city) citySet.add(city);
  }

  return {
    stats: {
      published: publishedRes.count ?? 0,
      pendingDresses: pendingDressesRes.count ?? 0,
      featured: featuredRes.count ?? 0,
      pendingReviews: pendingReviewsRes.count ?? 0,
      pendingRatings: pendingRatingsRes.error ? pendingRatings.length : (pendingRatingsRes.count ?? 0),
      pendingPayments: pendingPaymentsRes.error ? pendingPayments.length : (pendingPaymentsRes.count ?? 0),
      approvedReviews: approvedReviewsRes.count ?? 0,
      confirmedBookings: confirmedBookingsRes.count ?? 0,
    },
    pendingDresses: (pendingDressesListRes.data ?? []).map((row) => mapPendingDressRow(row as Record<string, unknown>)),
    pendingReviews: (pendingReviewsListRes.data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      text: r.review_text,
      stars: r.stars,
      status: r.status,
      created_at: r.created_at,
    })),
    pendingRatings,
    pendingPayments,
    recentBookings: confirmedBookingsListRes.error
      ? []
      : (confirmedBookingsListRes.data ?? []).map(mapBookingRow),
    cities: [...citySet].sort((a, b) => a.localeCompare(b, 'he')),
  };
}

async function loadDressesPage(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  searchParams: URLSearchParams
) {
  const { page, limit, from, to } = parsePageParams(searchParams);
  const search = searchParams.get('search')?.trim() || '';
  const sort = searchParams.get('sort') || 'newest';
  const featured = searchParams.get('featured');
  const city = searchParams.get('city')?.trim() || '';

  let query = supabase
    .from('dresses')
    .select(
      'id, name, price, size, city, color, description, condition, event_type, deposit, pickup_method, includes_dry_cleaning, owner_name, owner_phone, owner_email, created_at, images, featured_boost, featured_until, rental_count, rating_count',
      { count: 'exact' }
    )
    .eq('status', 'approved');

  if (search) {
    const safe = escapeIlike(search);
    const numericId = /^\d+$/.test(search) ? search : null;
    if (numericId) {
      query = query.or(
        `name.ilike.%${safe}%,owner_name.ilike.%${safe}%,city.ilike.%${safe}%,owner_phone.ilike.%${safe}%,id.eq.${numericId}`
      );
    } else {
      query = query.or(`name.ilike.%${safe}%,owner_name.ilike.%${safe}%,city.ilike.%${safe}%,owner_phone.ilike.%${safe}%`);
    }
  }

  if (city) query = query.eq('city', city);
  if (featured === 'yes') query = query.gt('featured_boost', 0);
  if (featured === 'no') query = query.eq('featured_boost', 0);

  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'name':
      query = query.order('name', { ascending: true });
      break;
    case 'rentals':
      query = query.order('rental_count', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  const total = count ?? 0;
  return {
    items: data ?? [],
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function loadRatingsPage(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  searchParams: URLSearchParams
) {
  const { page, limit, from, to } = parsePageParams(searchParams);
  const search = searchParams.get('search')?.trim() || '';
  const status = searchParams.get('status') || 'all';

  let query = supabase
    .from('dress_ratings')
    .select('id, dress_id, customer_name, stars, review_text, status, created_at, dresses(name)', {
      count: 'exact',
    })
    .order('created_at', { ascending: false });

  if (status === 'approved') query = query.eq('status', 'approved');
  else if (status === 'pending') query = query.eq('status', 'pending');
  else query = query.in('status', ['approved', 'pending']);

  if (search) {
    const safe = escapeIlike(search);
    const { data: matchingDresses } = await supabase
      .from('dresses')
      .select('id')
      .ilike('name', `%${safe}%`)
      .limit(40);
    const dressIds = (matchingDresses ?? []).map((row) => row.id);
    if (dressIds.length > 0) {
      query = query.or(
        `customer_name.ilike.%${safe}%,review_text.ilike.%${safe}%,dress_id.in.(${dressIds.join(',')})`
      );
    } else {
      query = query.or(`customer_name.ilike.%${safe}%,review_text.ilike.%${safe}%`);
    }
  }

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  const items = (data ?? []).map(mapDressRatingRow);

  const total = count ?? 0;
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function loadReviewsPage(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  searchParams: URLSearchParams
) {
  const { page, limit, from, to } = parsePageParams(searchParams);
  const search = searchParams.get('search')?.trim() || '';
  const status = searchParams.get('status') || 'all';

  let query = supabase
    .from('reviews')
    .select('id, name, role, review_text, stars, status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status === 'approved') query = query.eq('status', 'approved');
  else if (status === 'pending') query = query.eq('status', 'pending');
  else if (status === 'rejected') query = query.eq('status', 'rejected');
  else query = query.in('status', ['approved', 'pending', 'rejected']);

  if (search) {
    const safe = escapeIlike(search);
    query = query.or(`name.ilike.%${safe}%,role.ilike.%${safe}%,review_text.ilike.%${safe}%`);
  }

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  const items = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    text: r.review_text,
    stars: r.stars,
    status: r.status,
    created_at: r.created_at,
  }));

  const total = count ?? 0;
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function loadBookingsPage(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  searchParams: URLSearchParams
) {
  const { page, limit, from, to } = parsePageParams(searchParams);
  const search = searchParams.get('search')?.trim() || '';
  const scope = searchParams.get('scope') || 'confirmed';

  let query = supabase
    .from('bookings')
    .select(
      'id, dress_id, customer_name, customer_phone, customer_email, event_date, status, amount_total, payment_method, created_at, dresses(name)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  if (scope === 'pending') {
    query = query.eq('status', 'awaiting_admin_approval');
  } else if (scope === 'confirmed') {
    query = query.eq('status', 'confirmed').gte('event_date', retentionCutoffDateString());
  } else if (scope === 'all') {
    query = query.in('status', ['pending_payment', 'awaiting_admin_approval', 'confirmed', 'cancelled', 'failed']);
  }

  if (search) {
    const safe = escapeIlike(search);
    query = query.or(
      `customer_name.ilike.%${safe}%,customer_phone.ilike.%${safe}%,customer_email.ilike.%${safe}%`
    );
  }

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  const total = count ?? 0;
  return {
    items: (data ?? []).map(mapBookingRow),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function GET(request: Request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: 'גישה נדחתה' }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const searchParams = new URL(request.url).searchParams;
    const view = searchParams.get('view') || 'overview';

    if (view === 'dresses') {
      return NextResponse.json(await loadDressesPage(supabase, searchParams));
    }
    if (view === 'ratings') {
      return NextResponse.json(await loadRatingsPage(supabase, searchParams));
    }
    if (view === 'reviews') {
      return NextResponse.json(await loadReviewsPage(supabase, searchParams));
    }
    if (view === 'bookings') {
      return NextResponse.json(await loadBookingsPage(supabase, searchParams));
    }

    return NextResponse.json(await loadOverview(supabase));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: 'גישה נדחתה' }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { type, id, action } = body as {
      type: 'dress' | 'review' | 'dress_rating' | 'booking';
      id: string | number;
      action:
        | 'approve'
        | 'reject'
        | 'delete'
        | 'toggle_featured'
        | 'extend_featured'
        | 'approve_payment';
    };

    if (!type || !id || !action) {
      return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    if (type === 'booking' && action === 'approve_payment') {
      const result = await confirmBookingPayment(supabase, Number(id), { notifyAdmin: false });
      if ('error' in result && result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status || 400 });
      }
      return NextResponse.json({
        success: true,
        alreadyConfirmed: 'alreadyConfirmed' in result ? result.alreadyConfirmed : false,
        dressName: 'dressName' in result ? result.dressName : undefined,
      });
    }

    if (type === 'review' && action === 'delete') {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (type === 'dress_rating' && action === 'approve') {
      const result = await approveDressRating(supabase, id);
      if ('error' in result && result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status || 400 });
      }
      return NextResponse.json({ success: true, alreadyApproved: result.alreadyApproved });
    }

    if (type === 'dress_rating' && action === 'delete') {
      const { data: rating, error: fetchError } = await supabase
        .from('dress_ratings')
        .select('id, dress_id, status')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!rating) {
        return NextResponse.json({ error: 'דירוג לא נמצא' }, { status: 404 });
      }

      const { error: deleteError } = await supabase.from('dress_ratings').delete().eq('id', id);
      if (deleteError) throw deleteError;

      if (rating.status === 'approved') {
        await recalculateDressRatingStats(supabase, rating.dress_id);
      }

      return NextResponse.json({ success: true });
    }

    if (type === 'dress' && action === 'toggle_featured') {
      const { data: row, error: fetchError } = await supabase
        .from('dresses')
        .select('featured_boost')
        .eq('id', id)
        .maybeSingle();

      if (fetchError && !fetchError.message.includes('featured_boost')) throw fetchError;

      const nextBoost = Number(row?.featured_boost || 0) > 0 ? 0 : 50;
      const { error } = await supabase
        .from('dresses')
        .update({ featured_boost: nextBoost })
        .eq('id', id);

      if (error?.message?.includes('featured_boost')) {
        return NextResponse.json(
          { error: 'הריצי upgrade-v6.sql ב-Supabase לפני שימוש בחשיפה מועדפת' },
          { status: 503 }
        );
      }
      if (error) throw error;
      return NextResponse.json({ success: true, featured_boost: nextBoost });
    }

    if (type === 'dress' && action === 'extend_featured') {
      const { data: row, error: fetchError } = await supabase
        .from('dresses')
        .select('featured_until')
        .eq('id', id)
        .maybeSingle();

      if (fetchError && !fetchError.message.includes('featured_until')) throw fetchError;

      const featuredUntil = extendFeaturedUntil(row?.featured_until, FEATURED_REWARD_DAYS);
      const { error } = await supabase
        .from('dresses')
        .update({ featured_until: featuredUntil })
        .eq('id', id);

      if (error?.message?.includes('featured_until')) {
        return NextResponse.json(
          { error: 'הריצי upgrade-v6.sql ב-Supabase לפני שימוש בחשיפה מועדפת' },
          { status: 503 }
        );
      }
      if (error) throw error;
      return NextResponse.json({ success: true, featured_until: featuredUntil });
    }

    if (type === 'dress' && action === 'delete') {
      await markDressRemoved(id);
      return NextResponse.json({ success: true, status: 'removed' });
    }

    if (type === 'dress' && (action === 'approve' || action === 'reject')) {
      const { data: dressRow, error: fetchDressError } = await supabase
        .from('dresses')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchDressError) throw fetchDressError;

      if (dressRow?.pending_update) {
        const payload = dressRow.pending_update as PendingUpdatePayload;
        const dressForNotify = await fetchDressForNotify(supabase, id);

        if (action === 'approve') {
          const liveBefore = getLiveDressSnapshot(dressRow as Record<string, unknown>);
          const updateDiff = computeDressUpdateDiff(liveBefore, payload);
          const { error } = await supabase
            .from('dresses')
            .update(pendingUpdateToDressPatch(payload))
            .eq('id', id);
          if (error) throw error;
          if (dressForNotify) {
            await notifyDressUpdateApproved(supabase, dressForNotify, payload, updateDiff);
          }
          return NextResponse.json({ success: true, status: 'approved', kind: 'update' });
        }

        const { error } = await supabase
          .from('dresses')
          .update({ pending_update: null, pending_update_submitted_at: null })
          .eq('id', id);
        if (error) throw error;
        if (dressForNotify) {
          await notifyDressUpdateRejected(supabase, dressForNotify);
        }
        return NextResponse.json({ success: true, status: 'rejected', kind: 'update' });
      }
    }

    const table = type === 'dress' ? 'dresses' : 'reviews';
    const status = action === 'approve' ? 'approved' : 'rejected';

    if (type === 'dress' && action === 'approve') {
      const dress = await fetchDressForNotify(supabase, id);

      const { error } = await supabase.from(table).update({ status }).eq('id', id);
      if (error) throw error;

      if (dress && dress.status !== 'approved') {
        await notifyDressApproved(supabase, dress);
      }

      return NextResponse.json({ success: true, status });
    }

    const { error } = await supabase.from(table).update({ status }).eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה בעדכון';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
