import { NextResponse } from 'next/server';

import { getAppUrl, getAdminEmail, sendAdminEmail } from '@/lib/email';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

function isSchemaError(message: string) {
  return message.includes('dress_ratings') || message.includes('status') || message.includes('schema cache');
}

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
    let query = supabase
      .from('dress_ratings')
      .select('id, dress_id, customer_name, stars, review_text, created_at, status')
      .eq('dress_id', dressId)
      .order('created_at', { ascending: false })
      .limit(20);

    const withStatus = await query.eq('status', 'approved');
    let rows: Array<{
      id: unknown;
      dress_id: unknown;
      customer_name: string;
      stars: unknown;
      review_text: string;
      created_at: string;
    }> | null = withStatus.data;
    let error = withStatus.error;

    if (error?.message && isSchemaError(error.message)) {
      const fallback = await supabase
        .from('dress_ratings')
        .select('id, dress_id, customer_name, stars, review_text, created_at')
        .eq('dress_id', dressId)
        .order('created_at', { ascending: false })
        .limit(20);
      rows = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    return NextResponse.json(
      (rows ?? []).map((r) => ({
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
      .select('id, name, rating_sum, rating_count, status')
      .eq('id', dressId)
      .eq('status', 'approved')
      .maybeSingle();

    if (dressError) throw dressError;
    if (!dress) {
      return NextResponse.json({ error: 'שמלה לא נמצאה' }, { status: 404 });
    }

    const payload = {
      dress_id: dressId,
      customer_name: customerName,
      stars,
      review_text: reviewText,
      status: 'pending',
    };

    let insert = await supabase.from('dress_ratings').insert([payload]).select('id').single();

    if (insert.error?.message && isSchemaError(insert.error.message)) {
      const legacyPayload = {
        dress_id: dressId,
        customer_name: customerName,
        stars,
        review_text: reviewText,
      };
      insert = await supabase.from('dress_ratings').insert([legacyPayload]).select('id').single();
      if (insert.error) throw insert.error;

      const newSum = Number(dress.rating_sum || 0) + stars;
      const newCount = Number(dress.rating_count || 0) + 1;
      await supabase
        .from('dresses')
        .update({ rating_sum: newSum, rating_count: newCount })
        .eq('id', dressId);

      return NextResponse.json({
        success: true,
        rating_avg: Math.round((newSum / newCount) * 10) / 10,
        rating_count: newCount,
        message: 'תודה! הדירוג שלך פורסם ויעזור לשאר הבנות.',
      });
    }

    if (insert.error) throw insert.error;

    const ratingId = insert.data.id;
    const approveUrl = `${getAppUrl()}/api/dress-ratings/approve?id=${ratingId}&token=${encodeURIComponent(process.env.ADMIN_SECRET || '')}`;
    const starsHtml = '⭐'.repeat(stars);

    await sendAdminEmail(
      `⭐ דירוג חדש לשמלה: ${dress.name}`,
      `
        <div dir="rtl" style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:24px;border:1px solid #eadaaf;border-radius:16px;background:#fffdf8;">
          <h2 style="color:#3d2f24;margin-top:0;">דירוג חדש לאישור</h2>
          <p><strong>שמלה:</strong> ${dress.name}</p>
          <p><strong>שם:</strong> ${customerName}</p>
          <p><strong>דירוג:</strong> ${starsHtml} (${stars}/5)</p>
          ${reviewText ? `<blockquote style="margin:0;padding:12px 16px;background:#faf6eb;border-right:3px solid #d4af37;font-style:italic;">"${reviewText}"</blockquote>` : '<p style="color:#9a7b4f;">(ללא טקסט)</p>'}
          <p style="margin-top:24px;">
            <a href="${approveUrl}" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
              ✅ אשרי ופרסמי דירוג
            </a>
          </p>
          <p style="font-size:12px;color:#9a7b4f;">נשלח אל ${getAdminEmail()}</p>
        </div>
      `
    );

    const ratingCount = Number(dress.rating_count || 0);
    const ratingAvg =
      ratingCount > 0
        ? Math.round((Number(dress.rating_sum || 0) / ratingCount) * 10) / 10
        : 0;

    return NextResponse.json({
      success: true,
      pendingApproval: true,
      rating_avg: ratingAvg,
      rating_count: ratingCount,
      message: 'תודה! הדירוג נשלח לאישור ויופיע באתר אחרי אישור.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה בשמירת דירוג';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
