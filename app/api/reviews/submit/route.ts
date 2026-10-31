import { NextResponse } from 'next/server';
import { getAppUrl, getAdminEmail, sendAdminEmail } from '@/lib/email';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const role = String(body.role || 'לקוחה').trim();
    const text = String(body.text || '').trim();
    const stars = Number(body.stars);

    if (!name || !text) {
      return NextResponse.json({ error: 'חסרים שם ותוכן התגובה' }, { status: 400 });
    }

    if (Number.isNaN(stars) || stars < 1 || stars > 5) {
      return NextResponse.json({ error: 'יש לבחור דירוג בין 1 ל-5 כוכבים' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('reviews')
      .insert([
        {
          name,
          role,
          review_text: text,
          stars,
          status: 'pending',
        },
      ])
      .select('id, name, role, review_text, stars, status, created_at')
      .single();

    if (error) throw error;

    const reviewId = String(data.id);
    const approveUrl = `${getAppUrl()}/api/reviews/approve?id=${reviewId}&token=${process.env.ADMIN_SECRET || ''}`;
    const starsHtml = '⭐'.repeat(stars);

    await sendAdminEmail(
      `💬 תגובה חדשה: ${name}`,
      `
        <div dir="rtl" style="font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #eadaaf; border-radius: 16px; background: #fffdf8;">
          <h2 style="color: #3d2f24; margin-top: 0;">תגובה חדשה לאישור</h2>
          <p><strong>שם:</strong> ${name}</p>
          <p><strong>תפקיד:</strong> ${role}</p>
          <p><strong>דירוג:</strong> ${starsHtml} (${stars}/5)</p>
          <blockquote style="margin: 0; padding: 12px 16px; background: #faf6eb; border-right: 3px solid #d4af37; font-style: italic;">
            "${text}"
          </blockquote>
          <p style="margin-top: 24px;">
            <a href="${approveUrl}" style="display:inline-block;background:#b8860b;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:bold;">
              ✅ אשר ופרסמי
            </a>
          </p>
          <p style="font-size: 12px; color: #9a7b4f;">נשלח אל ${getAdminEmail()}</p>
        </div>
      `
    );

    return NextResponse.json({
      success: true,
      message: 'תודה! התגובה נשלחה.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה בשליחת התגובה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
