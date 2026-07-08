import { NextResponse } from 'next/server';
import {
  AUTH_COOKIE,
  authCookieOptions,
  createUserToken,
  verifyPassword,
} from '@/lib/user-auth';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!username || !password) {
      return NextResponse.json({ error: 'יש להזין שם משתמש וסיסמה' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: user, error } = await supabase
      .from('site_users')
      .select('id, username, display_name, phone, email, password_hash')
      .eq('username', username)
      .maybeSingle();

    if (error?.message?.includes('site_users')) {
      return NextResponse.json(
        { error: 'טבלת משתמשות לא קיימת. הריצי site_users.sql ב-Supabase.' },
        { status: 503 }
      );
    }

    if (error) throw error;
    if (!user || !verifyPassword(password, String(user.password_hash))) {
      return NextResponse.json({ error: 'שם משתמש או סיסמה שגויים' }, { status: 401 });
    }

    const token = createUserToken({
      userId: String(user.id),
      username: user.username,
      displayName: user.display_name || user.username,
      phone: user.phone || '',
      email: user.email || '',
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        username: user.username,
        displayName: user.display_name,
        phone: user.phone,
        email: user.email,
      },
    });

    response.cookies.set(AUTH_COOKIE, token, authCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
