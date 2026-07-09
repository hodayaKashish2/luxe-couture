import { NextResponse } from 'next/server';
import { notifyDressApproved } from '@/lib/dress-approval-notify';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

function verifyToken(request: Request) {
  const token =
    request.headers.get('x-admin-token') ||
    new URL(request.url).searchParams.get('token');
  return token && process.env.ADMIN_SECRET && token === process.env.ADMIN_SECRET;
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

    const [dressesRes, reviewsRes, publishedRes] = await Promise.all([
      supabase
        .from('dresses')
        .select('id, name, price, size, city, owner_name, status, created_at, images')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('reviews')
        .select('id, name, role, review_text, stars, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('dresses')
        .select('id, name, price, size, city, owner_name, created_at, images')
        .eq('status', 'approved')
        .order('created_at', { ascending: false }),
    ]);

    if (dressesRes.error) throw dressesRes.error;
    if (reviewsRes.error) throw reviewsRes.error;
    if (publishedRes.error) throw publishedRes.error;

    let recentBookings: unknown[] = [];
    const bookingsRes = await supabase
      .from('bookings')
      .select('id, dress_id, customer_name, customer_phone, customer_email, event_date, status, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (!bookingsRes.error) {
      recentBookings = bookingsRes.data ?? [];
    }

    return NextResponse.json({
      pendingDresses: dressesRes.data ?? [],
      pendingReviews: (reviewsRes.data ?? []).map((r) => ({
        ...r,
        text: r.review_text,
      })),
      publishedDresses: publishedRes.data ?? [],
      recentBookings,
    });
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
      type: 'dress' | 'review';
      id: string | number;
      action: 'approve' | 'reject' | 'delete';
    };

    if (!type || !id || !action) {
      return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

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
      let dress: {
        id: string | number;
        name: string;
        status: string;
        owner_name?: string | null;
        owner_email?: string | null;
        owner_phone?: string | null;
      } | null = null;

      const fullSelect = await supabase
        .from('dresses')
        .select('id, name, owner_name, owner_email, owner_phone, status')
        .eq('id', id)
        .maybeSingle();

      if (fullSelect.error?.message?.includes('owner_email') || fullSelect.error?.message?.includes('owner_phone')) {
        const fallback = await supabase
          .from('dresses')
          .select('id, name, owner_name, owner_phone, status')
          .eq('id', id)
          .maybeSingle();
        dress = fallback.data ? { ...fallback.data, owner_email: '' } : null;
      } else {
        dress = fullSelect.data;
      }

      const { error } = await supabase.from(table).update({ status }).eq('id', id);
      if (error) throw error;

      if (dress && dress.status !== 'approved') {
        const mail = await notifyDressApproved(supabase, dress);
        if (!mail.success) {
          console.error('Dress approved owner email failed:', mail.error);
        }
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
