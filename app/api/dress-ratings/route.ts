import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  const dressId = new URL(request.url).searchParams.get('dressId');
  if (!dressId) {
    return NextResponse.json({ error: 'חסר מזהה שמלה' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('dress_ratings')
      .select('id, dress_id, customer_name, stars, review_text, created_at')
      .eq('dress_id', dressId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json(
      (data ?? []).map((r) => ({
        id: String(r.id),
        dress_id: String(r.dress_id),
        customer_name: r.customer_name,
        stars: Number(r.stars),
        review_text: r.review_text,
        created_at: r.created_at,
      }))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const dressId = body.dressId;
    const customerName = String(body.name || '').trim();
    const stars = Number(body.stars);
    const reviewText = String(body.text || '').trim();

    if (!dressId || !customerName) {
      return NextResponse.json({ error: 'חסרים שם ושמלה' }, { status: 400 });
    }
    if (Number.isNaN(stars) || stars < 1 || stars > 5) {
      return NextResponse.json({ error: 'יש לבחור דירוג 1–5' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: dress, error: dressError } = await supabase
      .from('dresses')
      .select('id, rating_sum, rating_count, status')
      .eq('id', dressId)
      .eq('status', 'approved')
      .maybeSingle();

    if (dressError) throw dressError;
    if (!dress) {
      return NextResponse.json({ error: 'שמלה לא נמצאה' }, { status: 404 });
    }

    const { error: insertError } = await supabase.from('dress_ratings').insert([
      {
        dress_id: dressId,
        customer_name: customerName,
        stars,
        review_text: reviewText,
      },
    ]);

    if (insertError) throw insertError;

    const newSum = Number(dress.rating_sum || 0) + stars;
    const newCount = Number(dress.rating_count || 0) + 1;

    const { error: updateError } = await supabase
      .from('dresses')
      .update({ rating_sum: newSum, rating_count: newCount })
      .eq('id', dressId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      rating_avg: Math.round((newSum / newCount) * 10) / 10,
      rating_count: newCount,
      message: 'תודה! הדירוג שלך פורסם ויעזור לשאר הבנות.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה בשמירת דירוג';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
