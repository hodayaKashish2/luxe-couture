import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json([], { status: 503 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('reviews')
      .select('id, name, role, review_text, stars, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const reviews = (data ?? []).map((review) => ({
      id: String(review.id),
      name: review.name,
      role: review.role,
      text: review.review_text,
      stars: Number(review.stars),
    }));

    return NextResponse.json(reviews);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה בשליפת תגובות';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
