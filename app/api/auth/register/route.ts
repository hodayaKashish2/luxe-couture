import { NextResponse } from 'next/server';
import {
  AUTH_COOKIE,
  authCookieOptions,
  createUserToken,
  hashPassword,
} from '@/lib/user-auth';
import { normalizePhone } from '@/lib/owner-auth';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';
import { formatSiteUsersDbError } from '@/lib/db-errors';

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          'Supabase לא מוגדר בשרת. ב-Vercel: Settings → Environment Variables → הוסיפי NEXT_PUBLIC_SUPABASE_URL ו-SUPABASE_SERVICE_ROLE_KEY → Redeploy.',
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    const displayName = String(body.display_name || '').trim();
    const phone = String(body.phone || '').trim();
    const email = String(body.email || '').trim().toLowerCase();

    if (!username || username.length < 3) {
      return NextResponse.json({ error: 'שם משתמש — לפחות 3 תווים' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'סיסמה — לפחות 6 תווים' }, { status: 400 });
    }
    if (!displayName || !phone) {
      return NextResponse.json({ error: 'יש למלא שם וטלפון' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'יש להזין כתובת אימייל תקינה' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: existingUser } = await supabase
      .from('site_users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: 'שם המשתמש כבר תפוס — בחרי שם משתמש אחר' }, { status: 409 });
    }

    const { data: existingEmail } = await supabase
      .from('site_users')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json({ error: 'האימייל כבר רשום — התחברי או השתמשי באימייל אחר' }, { status: 409 });
    }

    const phoneStored = phone.startsWith('0') ? phone : `0${normalizePhone(phone).slice(3)}`;

    const { data: existingPhone } = await supabase
      .from('site_users')
      .select('id')
      .eq('phone', phoneStored)
      .maybeSingle();

    if (existingPhone) {
      return NextResponse.json({ error: 'מספר הטלפון כבר רשום — התחברי או השתמשי במספר אחר' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('site_users')
      .insert([
        {
          username,
          password_hash: hashPassword(password),
          display_name: displayName,
          phone: phoneStored,
          email,
        },
      ])
      .select('id, username, display_name, phone, email')
      .single();

    if (error?.message?.includes('duplicate') || error?.code === '23505') {
      if (error.message?.includes('phone')) {
        return NextResponse.json({ error: 'מספר הטלפון כבר רשום — התחברי או השתמשי במספר אחר' }, { status: 409 });
      }
      if (error.message?.includes('email')) {
        return NextResponse.json({ error: 'האימייל כבר רשום — התחברי או השתמשי באימייל אחר' }, { status: 409 });
      }
      return NextResponse.json({ error: 'שם המשתמש כבר תפוס — בחרי שם משתמש אחר' }, { status: 409 });
    }

    if (error) {
      return NextResponse.json(
        { error: formatSiteUsersDbError(error.message, error.code) },
        { status: 503 }
      );
    }

    const token = createUserToken({
      userId: String(data.id),
      username: data.username,
      displayName: data.display_name,
      phone: data.phone,
      email: data.email || '',
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        userId: String(data.id),
        username: data.username,
        displayName: data.display_name,
        phone: data.phone,
        email: data.email,
      },
    });
    response.cookies.set(AUTH_COOKIE, token, authCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
