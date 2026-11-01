import { NextResponse } from 'next/server';
import { sendEmailTo } from '@/lib/email';
import { createPasswordResetToken, passwordResetEmailHtml } from '@/lib/password-reset';
import { DEFAULT_ADMIN_EMAIL, getServerAppUrl } from '@/lib/site-config';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';
import { isValidEmail } from '@/lib/form-validation';

type AccountRow = {
  id: string;
  username: string;
  email: string;
  password_hash: string;
};

const recentRequests = new Map<string, number>();
const REQUEST_GAP_MS = 60 * 1000;

function recentlySent(key: string) {
  const last = recentRequests.get(key) || 0;
  return Date.now() - last < REQUEST_GAP_MS;
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר בשרת' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const identifier = String(body.identifier || '').trim().toLowerCase();
    if (!identifier) {
      return NextResponse.json({ error: 'הזיני שם משתמש או אימייל' }, { status: 400 });
    }

    if (recentlySent(identifier)) {
      return NextResponse.json(
        { error: 'כבר נשלחה בקשה. המתיני דקה ונסי שוב.' },
        { status: 429 }
      );
    }

    const supabase = getSupabaseAdmin();
    let account: AccountRow | null = null;

    if (identifier.includes('@')) {
      if (!isValidEmail(identifier)) {
        return NextResponse.json({ error: 'כתובת האימייל לא תקינה' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('site_users')
        .select('id, username, email, password_hash')
        .eq('email', identifier);

      if (error) {
        return NextResponse.json({ error: 'לא הצלחנו לחפש את החשבון' }, { status: 503 });
      }

      const matches = (data || []).filter(
        (row) => String(row.email || '').trim().toLowerCase() === identifier
      ) as AccountRow[];

      if (matches.length > 1) {
        return NextResponse.json(
          {
            error:
              'יש כמה חשבונות עם המייל הזה, וכל אחד עם סיסמה משלו. הזיני את שם המשתמש של החשבון שאת רוצה לאפס.',
            needsUsername: true,
          },
          { status: 409 }
        );
      }

      account = matches[0] || null;
      if (!account) {
        return NextResponse.json({ error: 'לא מצאנו חשבון עם המייל הזה' }, { status: 404 });
      }
    } else {
      const { data, error } = await supabase
        .from('site_users')
        .select('id, username, email, password_hash')
        .eq('username', identifier)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: 'לא הצלחנו לחפש את החשבון' }, { status: 503 });
      }
      account = (data as AccountRow | null) || null;
      if (!account) {
        return NextResponse.json({ error: 'לא מצאנו חשבון עם שם המשתמש הזה' }, { status: 404 });
      }
    }

    const email = String(account.email || '').trim().toLowerCase();
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          error: `לחשבון הזה אין אימייל שאפשר לשלוח אליו. כתבי ל-${DEFAULT_ADMIN_EMAIL} ונאפס את הסיסמה ידנית.`,
        },
        { status: 400 }
      );
    }

    const token = createPasswordResetToken(String(account.id), String(account.password_hash));
    const resetUrl = `${getServerAppUrl()}/login?reset=${encodeURIComponent(token)}`;
    const sent = await sendEmailTo(email, 'איפוס סיסמה — שמלה בקליק', passwordResetEmailHtml(resetUrl));

    if (!sent.success) {
      return NextResponse.json({ error: sent.error || 'שליחת המייל נכשלה' }, { status: 502 });
    }

    recentRequests.set(identifier, Date.now());

    return NextResponse.json({
      success: true,
      message: 'שלחנו קישור לאיפוס הסיסמה אל המייל של החשבון. הקישור תקף ל-20 דקות.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
