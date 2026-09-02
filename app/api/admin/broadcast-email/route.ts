import { NextResponse } from 'next/server';
import {
  buildBroadcastEmailHtml,
  fetchBroadcastRecipients,
  fetchBroadcastStats,
  sendBroadcastBatch,
  type BroadcastAudience,
} from '@/lib/broadcast-email';
import { getAdminEmail, sendEmailTo } from '@/lib/email';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

function verifyAdminToken(request: Request) {
  const token =
    request.headers.get('x-admin-token') ||
    new URL(request.url).searchParams.get('token');
  return Boolean(token && process.env.ADMIN_SECRET && token === process.env.ADMIN_SECRET);
}

function parseAudience(raw: unknown): BroadcastAudience | null {
  if (raw === 'all' || raw === 'opt_in') return raw;
  return null;
}

function missingMarketingColumnMessage(message: string) {
  return (
    message.includes('marketing_emails_opt_in') ||
    (message.includes('column') && message.includes('site_users'))
  );
}

export async function GET(request: Request) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const stats = await fetchBroadcastStats(supabase);
    return NextResponse.json(stats, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    if (missingMarketingColumnMessage(message)) {
      return NextResponse.json(
        {
          error:
            'חסרה עמודת marketing_emails_opt_in. הריצי את supabase/upgrade-v15-marketing-opt-in.sql ב-Supabase SQL Editor.',
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const audience = parseAudience(body.audience);
    const subject = String(body.subject || '').trim();
    const content = String(body.body || '').trim();
    const action = body.action === 'test' ? 'test' : 'send';
    const offset = Math.max(0, Number.parseInt(String(body.offset ?? '0'), 10) || 0);

    if (!audience) {
      return NextResponse.json({ error: 'נא לבחור קהל יעד' }, { status: 400 });
    }
    if (!subject || subject.length < 2) {
      return NextResponse.json({ error: 'נא להזין נושא למייל' }, { status: 400 });
    }
    if (!content || content.length < 2) {
      return NextResponse.json({ error: 'נא להזין תוכן למייל' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    if (action === 'test') {
      const adminEmail = getAdminEmail();
      const html = buildBroadcastEmailHtml({
        subject,
        body: content,
        audience,
        displayName: 'מנהלת',
      });
      const result = await sendEmailTo(adminEmail, `[בדיקה] ${subject}`, html);
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'שליחת בדיקה נכשלה' }, { status: 502 });
      }
      return NextResponse.json({ success: true, sentTo: adminEmail });
    }

    const recipients = await fetchBroadcastRecipients(supabase, audience);
    if (recipients.length === 0) {
      return NextResponse.json({ error: 'אין נמענות ברשימה' }, { status: 400 });
    }

    const batch = await sendBroadcastBatch({
      recipients,
      offset,
      subject,
      body: content,
      audience,
    });

    return NextResponse.json({
      success: true,
      ...batch,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    if (missingMarketingColumnMessage(message)) {
      return NextResponse.json(
        {
          error:
            'חסרה עמודת marketing_emails_opt_in. הריצי את supabase/upgrade-v15-marketing-opt-in.sql ב-Supabase SQL Editor.',
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
