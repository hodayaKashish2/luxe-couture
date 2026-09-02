import { NextResponse } from 'next/server';
import {
  AUTH_COOKIE,
  authCookieOptions,
  createUserToken,
  getUserFromRequest,
} from '@/lib/user-auth';
import { formatPhoneForStorage, phoneValidationMessage } from '@/lib/israeli-phone';
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
      .select('id, username, display_name, phone, email, marketing_emails_opt_in')
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
        marketing_emails_opt_in: Boolean(data.marketing_emails_opt_in),
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
    const marketingOptIn =
      body.marketing_emails_opt_in !== undefined
        ? Boolean(body.marketing_emails_opt_in)
        : undefined;

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

    const updates: Record<string, unknown> = {
      display_name: displayName,
      phone: phoneStored,
      email,
    };
    if (marketingOptIn !== undefined) {
      updates.marketing_emails_opt_in = marketingOptIn;
    }

    const { data, error } = await supabase
      .from('site_users')
      .update(updates)
      .eq('id', user.userId)
      .select('id, username, display_name, phone, email, marketing_emails_opt_in')
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
      user: {
        ...updatedUser,
        marketing_emails_opt_in: Boolean(data.marketing_emails_opt_in),
      },
    });
    response.cookies.set(AUTH_COOKIE, token, authCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
