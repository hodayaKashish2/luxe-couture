import { NextResponse } from 'next/server';
import { getEmailConfigStatus, sendEmailTo } from '@/lib/email';

/** בדיקת שליחת מייל — רק עם ADMIN_SECRET */
export async function POST(request: Request) {
  const adminSecret = process.env.ADMIN_SECRET?.trim();
  const authHeader = request.headers.get('x-admin-secret') || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!adminSecret || authHeader !== adminSecret) {
    return NextResponse.json({ error: 'לא מורשה' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const to = String(body.to || '').trim();

    if (!to) {
      return NextResponse.json({ error: 'חסרה כתובת נמען (to)' }, { status: 400 });
    }

    const config = getEmailConfigStatus();
    const result = await sendEmailTo(
      to,
      'בדיקת מייל — שמלה בקליק',
      `<div dir="rtl" style="font-family:sans-serif;padding:20px;">
        <h2>✅ המיילים עובדים!</h2>
        <p>אם קיבלת את ההודעה הזו — שליחה ללקוחות פעילה.</p>
      </div>`
    );

    return NextResponse.json({ config, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(getEmailConfigStatus());
}
