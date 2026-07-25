import { NextResponse } from 'next/server';
import { fetchDressForNotify, notifyDressApproved } from '@/lib/dress-approval-notify';
import { recalculateDressRatingStats } from '@/lib/dress-rating-stats';
import { extendFeaturedUntil, FEATURED_REWARD_DAYS } from '@/lib/dress-ranking';
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

async function loadOverview(supabase: ReturnType<typeof getSupabaseAdmin>) {
  const [
    publishedRes,
    pendingDressesRes,
    featuredRes,
    pendingReviewsRes,
    pendingRatingsRes,
    pendingDressesListRes,
    pendingReviewsListRes,
    bookingsRes,
    citiesRes,
  ] = await Promise.all([
    supabase.from('dresses').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('dresses').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('dresses').select('*', { count: 'exact', head: true }).eq('status', 'approved').gt('featured_boost', 0),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('dress_ratings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('dresses')
      .select('id, name, price, size, city, owner_name, status, created_at, images')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('reviews')
      .select('id, name, role, review_text, stars, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('bookings')
      .select('id, dress_id, customer_name, customer_phone, customer_email, event_date, status, created_at')
      .order('created_at', { ascending: false })
      .limit(15),
    supabase.from('dresses').select('city').eq('status', 'approved').not('city', 'is', null),
  ]);

  if (pendingDressesListRes.error) throw pendingDressesListRes.error;
  if (pendingReviewsListRes.error) throw pendingReviewsListRes.error;

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
      pendingRatings: pendingRatingsRes.count ?? 0,
      recentBookings: bookingsRes.data?.length ?? 0,
    },
    pendingDresses: pendingDressesListRes.data ?? [],
    pendingReviews: (pendingReviewsListRes.data ?? []).map((r) => ({
      ...r,
      text: r.review_text,
    })),
    recentBookings: bookingsRes.error ? [] : (bookingsRes.data ?? []),
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
      'id, name, price, size, city, owner_name, created_at, images, featured_boost, featured_until, rental_count, rating_count',
      { count: 'exact' }
    )
    .eq('status', 'approved');

  if (search) {
    const safe = escapeIlike(search);
    const numericId = /^\d+$/.test(search) ? search : null;
    if (numericId) {
      query = query.or(
        `name.ilike.%${safe}%,owner_name.ilike.%${safe}%,city.ilike.%${safe}%,id.eq.${numericId}`
      );
    } else {
      query = query.or(`name.ilike.%${safe}%,owner_name.ilike.%${safe}%,city.ilike.%${safe}%`);
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

  const items = (data ?? []).map((row) => {
    const dressJoin = row.dresses as { name?: string } | { name?: string }[] | null;
    const dressName = Array.isArray(dressJoin) ? dressJoin[0]?.name : dressJoin?.name;
    return {
      id: row.id,
      dress_id: row.dress_id,
      dress_name: dressName || 'שמלה',
      customer_name: row.customer_name,
      stars: row.stars,
      review_text: row.review_text,
      status: row.status,
      created_at: row.created_at,
    };
  });

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

  let query = supabase
    .from('bookings')
    .select(
      'id, dress_id, customer_name, customer_phone, customer_email, event_date, status, created_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

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
    items: data ?? [],
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
      type: 'dress' | 'review' | 'dress_rating';
      id: string | number;
      action: 'approve' | 'reject' | 'delete' | 'toggle_featured' | 'extend_featured';
    };

    if (!type || !id || !action) {
      return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

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
      let { error } = await supabase.from('dresses').update({ status: 'removed' }).eq('id', id);
      if (error?.message?.includes('removed') || error?.message?.includes('check constraint')) {
        ({ error } = await supabase.from('dresses').update({ status: 'rejected' }).eq('id', id));
      }
      if (error) throw error;
      return NextResponse.json({ success: true, status: 'removed' });
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
