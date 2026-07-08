import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured, supabaseEnvStatus } from '@/lib/supabase/server';
import { formatSiteUsersDbError } from '@/lib/db-errors';

const SITE_USERS_COLUMNS =
  'id, username, display_name, phone, email, password_hash';

export async function GET() {
  const supabase = supabaseEnvStatus();
  const adminSecret = Boolean(process.env.ADMIN_SECRET?.trim());

  let siteUsersOk = false;
  let siteUsersError: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseAdmin();
      const { error } = await client.from('site_users').select(SITE_USERS_COLUMNS).limit(1);
      if (error) {
        siteUsersError = error.message;
        siteUsersOk = false;
      } else {
        siteUsersOk = true;
      }
    } catch (e) {
      siteUsersError = e instanceof Error ? e.message : 'unknown';
    }
  }

  const hint = siteUsersError
    ? formatSiteUsersDbError(siteUsersError)
    : !supabase.hasUrl
      ? 'חסר NEXT_PUBLIC_SUPABASE_URL ב-Vercel'
      : !supabase.hasServiceKey
        ? 'חסר SUPABASE_SERVICE_ROLE_KEY ב-Vercel (לא anon!)'
        : !adminSecret
          ? 'חסר ADMIN_SECRET ב-Vercel'
          : !siteUsersOk
            ? 'הריצי fix-site-users.sql ב-Supabase SQL Editor'
            : 'הכל מוגדר — נסי התחברות או הרשמה';

  return NextResponse.json({
    ok: supabase.configured && adminSecret && siteUsersOk,
    supabase,
    adminSecret,
    siteUsersTable: siteUsersOk,
    siteUsersError,
    hint,
  });
}
