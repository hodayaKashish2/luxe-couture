import { NextResponse } from 'next/server';
import { notifyDressApproved } from '@/lib/dress-approval-notify';
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
      .select('id, name, status, owner_name, owner_email, owner_phone')
      .eq('id', id)
      .single();

    if (fullSelect.error?.message?.includes('owner_email') || fullSelect.error?.message?.includes('owner_phone')) {
      const fallback = await supabase
        .from('dresses')
        .select('id, name, status, owner_name, owner_phone')
        .eq('id', id)
        .single();
      if (fallback.error || !fallback.data) {
        return new NextResponse(
          renderPage('שמלה לא נמצאה', 'לא נמצאה שמלה עם המזהה שבקישור.', false),
          { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
      dress = { ...fallback.data, owner_email: '' };
    } else if (fullSelect.error || !fullSelect.data) {
      return new NextResponse(
        renderPage('שמלה לא נמצאה', 'לא נמצאה שמלה עם המזהה שבקישור.', false),
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    } else {
      dress = fullSelect.data;
    }

    if (dress.status === 'approved') {
      return new NextResponse(
        renderPage('כבר אושרה', `השמלה "${dress.name}" כבר מופיעה באתר.`, true),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const { error: updateError } = await supabase
      .from('dresses')
      .update({ status: 'approved' })
      .eq('id', id);

    if (updateError) throw updateError;

    const mail = await notifyDressApproved(supabase, dress);
    if (!mail.success) {
      console.error('Dress approved owner email failed:', mail.error);
    }

    return new NextResponse(
      renderPage('אושר בהצלחה!', `השמלה "${dress.name}" אושרה ותופיע עכשיו באתר.`, true),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה באישור השמלה';
    return new NextResponse(renderPage('שגיאה', message, false), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
