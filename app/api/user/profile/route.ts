import { NextResponse } from 'next/server';
import {
  AUTH_COOKIE,
  authCookieOptions,
  createUserToken,
  getUserFromRequest,
} from '@/lib/user-auth';
import { formatPhoneForStorage, phoneValidationMessage } from '@/lib/israeli-phone';
import { phonesMatch } from '@/lib/owner-auth';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';
import { formatSiteUsersDbError } from '@/lib/db-errors';

function formatPhoneStored(phone: string) {
  return formatPhoneForStorage(phone);
}

export async function GET(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('site_users')
      .select('id, username, display_name, phone, email')
      .eq('id', user.userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });

    return NextResponse.json({
      user: {
        userId: String(data.id),
        username: data.username,
        displayName: data.display_name,
        phone: data.phone,
        email: data.email,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });

  try {
    const body = await request.json();
    const displayName = String(body.display_name || '').trim();
    const phone = String(body.phone || '').trim();
    const email = String(body.email || '').trim().toLowerCase();

    if (!displayName) {
      return NextResponse.json({ error: 'יש להזין שם מלא' }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: 'יש להזין מספר טלפון' }, { status: 400 });
    }

    const phoneStored = formatPhoneStored(phone);
    if (!phoneStored) {
      return NextResponse.json({ error: phoneValidationMessage() }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'יש להזין כתובת אימייל תקינה' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: existingEmail } = await supabase
      .from('site_users')
      .select('id')
      .ilike('email', email)
      .neq('id', user.userId)
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json({ error: 'האימייל כבר בשימוש בחשבון אחר' }, { status: 409 });
    }

    const { data: phoneRows } = await supabase.from('site_users').select('id, phone');
    const existingPhone = (phoneRows ?? []).find(
      (row) => String(row.id) !== String(user.userId) && phonesMatch(String(row.phone || ''), phoneStored)
    );

    if (existingPhone) {
      return NextResponse.json({ error: 'מספר הטלפון כבר בשימוש בחשבון אחר' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('site_users')
      .update({
        display_name: displayName,
        phone: phoneStored,
        email,
      })
      .eq('id', user.userId)
      .select('id, username, display_name, phone, email')
      .single();

    if (error) {
      return NextResponse.json(
        { error: formatSiteUsersDbError(error.message, error.code) },
        { status: 503 }
      );
    }

    const updatedUser = {
      userId: String(data.id),
      username: data.username,
      displayName: data.display_name,
      phone: data.phone,
      email: data.email,
    };

    const token = createUserToken(updatedUser);
    const response = NextResponse.json({
      success: true,
      message: 'פרטי החשבון עודכנו',
      token,
      user: updatedUser,
    });
    response.cookies.set(AUTH_COOKIE, token, authCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
