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
import {
  marketingOptInUpgradeHint,
  selectSiteUserProfile,
  updateSiteUserProfile,
} from '@/lib/site-user-profile';

function formatPhoneStored(phone: string) {
  return formatPhoneForStorage(phone);
}

function mapProfileResponse(profile: {
  id: string;
  username: string;
  display_name: string;
  phone: string;
  email: string;
  marketing_emails_opt_in: boolean;
}) {
  return {
    userId: profile.id,
    username: profile.username,
    displayName: profile.display_name,
    phone: profile.phone,
    email: profile.email,
    marketing_emails_opt_in: profile.marketing_emails_opt_in,
  };
}

export async function GET(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });

  try {
    const supabase = getSupabaseAdmin();
    const { profile } = await selectSiteUserProfile(supabase, user.userId);

    if (!profile) return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 });

    return NextResponse.json({ user: mapProfileResponse(profile) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json(
      { error: formatSiteUsersDbError(message) },
      { status: 500 }
    );
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
    const result = await updateSiteUserProfile(supabase, user.userId, {
      display_name: displayName,
      phone: phoneStored,
      email,
      marketing_emails_opt_in: marketingOptIn,
    });

    const updatedUser = {
      userId: result.profile.id,
      username: result.profile.username,
      displayName: result.profile.display_name,
      phone: result.profile.phone,
      email: result.profile.email,
    };

    const token = createUserToken(updatedUser);
    const response = NextResponse.json({
      success: true,
      message: result.marketingOptInSkipped
        ? `פרטי החשבון עודכנו. ${marketingOptInUpgradeHint()}`
        : 'פרטי החשבון עודכנו',
      token,
      user: {
        ...mapProfileResponse(result.profile),
      },
    });
    response.cookies.set(AUTH_COOKIE, token, authCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json(
      { error: formatSiteUsersDbError(message) },
      { status: 503 }
    );
  }
}
