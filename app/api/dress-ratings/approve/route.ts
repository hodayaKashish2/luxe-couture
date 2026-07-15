import { NextResponse } from 'next/server';

import { getAppUrl, getAdminEmail, sendAdminEmail } from '@/lib/email';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

function renderPage(title: string, message: string, success: boolean) {
  const color = success ? '#166534' : '#991b1b';
  const bg = success ? '#f0fdf4' : '#fef2f2';

  return `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
      </head>
      <body style="font-family: sans-serif; background: ${bg}; color: ${color}; min-height: 100vh; display: grid; place-items: center; padding: 24px;">
        <div style="max-width: 480px; background: white; border: 1px solid #eadaaf; border-radius: 16px; padding: 32px; text-align: center; box-shadow: 0 12px 40px rgba(0,0,0,0.08);">
          <h1 style="margin-top: 0; color: #3d2f24;">${title}</h1>
          <p style="line-height: 1.7; color: #554a33;">${message}</p>
          <a href="/" style="display:inline-block; margin-top: 16px; color: #b8860b; font-weight: bold;">← חזרה לאתר</a>
        </div>
      </body>
    </html>
  `;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const token = searchParams.get('token');
  const adminSecret = process.env.ADMIN_SECRET;

  if (!id || !token || !adminSecret || token !== adminSecret) {
    return new NextResponse(
      renderPage('גישה נדחתה', 'קישור האישור אינו תקין.', false),
      { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  if (!isSupabaseConfigured()) {
    return new NextResponse(
      renderPage('Supabase לא מוגדר', 'חסרים מפתחות החיבור.', false),
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: rating, error: fetchError } = await supabase
      .from('dress_ratings')
      .select('id, dress_id, customer_name, stars, review_text, status')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!rating) {
      return new NextResponse(
        renderPage('דירוג לא נמצא', 'לא נמצא דירוג עם המזהה שבקישור.', false),
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    if (rating.status === 'approved') {
      return new NextResponse(
        renderPage('כבר אושר', `הדירוג של ${rating.customer_name} כבר מפורסם באתר.`, true),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const { data: dress, error: dressError } = await supabase
      .from('dresses')
      .select('id, name, rating_sum, rating_count')
      .eq('id', rating.dress_id)
      .maybeSingle();

    if (dressError) throw dressError;
    if (!dress) {
      return new NextResponse(
        renderPage('שמלה לא נמצאה', 'לא נמצאה השמלה שאליה שייך הדירוג.', false),
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const { error: updateRatingError } = await supabase
      .from('dress_ratings')
      .update({ status: 'approved' })
      .eq('id', id);

    if (updateRatingError) throw updateRatingError;

    const newSum = Number(dress.rating_sum || 0) + Number(rating.stars);
    const newCount = Number(dress.rating_count || 0) + 1;

    const { error: updateDressError } = await supabase
      .from('dresses')
      .update({ rating_sum: newSum, rating_count: newCount })
      .eq('id', dress.id);

    if (updateDressError) throw updateDressError;

    return new NextResponse(
      renderPage(
        'דירוג אושר!',
        `הדירוג של ${rating.customer_name} לשמלה "${dress.name}" פורסם באתר.`,
        true
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה באישור הדירוג';
    return new NextResponse(renderPage('שגיאה', message, false), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
