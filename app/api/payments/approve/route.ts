import { NextResponse } from 'next/server';

import { confirmBookingPayment } from '@/lib/payment-confirmation';
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
  const bookingId = Number(searchParams.get('bookingId'));
  const token = searchParams.get('token');
  const adminSecret = process.env.ADMIN_SECRET;

  if (!bookingId || !token || !adminSecret || token !== adminSecret) {
    return new NextResponse(
      renderPage('גישה נדחתה', 'קישור האישור אינו תקין או שפג תוקפו.', false),
      { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  if (!isSupabaseConfigured()) {
    return new NextResponse(
      renderPage('Supabase לא מוגדר', 'חסרים מפתחות החיבור למסד הנתונים.', false),
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const result = await confirmBookingPayment(supabase, bookingId, { notifyAdmin: false });

    if ('error' in result && result.error) {
      return new NextResponse(renderPage('לא ניתן לאשר', result.error, false), {
        status: result.status || 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if ('alreadyConfirmed' in result && result.alreadyConfirmed) {
      return new NextResponse(
        renderPage('כבר אושר', 'התשלום להזמנה הזו כבר אושר בעבר.', true),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    return new NextResponse(
      renderPage(
        'התשלום אושר!',
        `אישרת את התשלום עבור "${result.dressName}". נשלח מייל אישור ללקוחה.`,
        true
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה באישור התשלום';
    return new NextResponse(renderPage('שגיאה', message, false), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
