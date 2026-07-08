import { NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured, supabaseEnvStatus } from '@/lib/supabase/server';

export async function GET() {
  const supabase = supabaseEnvStatus();
  const adminSecret = Boolean(process.env.ADMIN_SECRET?.trim());

  let siteUsersTable = false;
  let siteUsersError: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseAdmin();
      const { error } = await client.from('site_users').select('id').limit(1);
      if (error) {
        siteUsersError = error.message;
        siteUsersTable = !error.message.includes('site_users');
      } else {
        siteUsersTable = true;
      }
    } catch (e) {
      siteUsersError = e instanceof Error ? e.message : 'unknown';
    }
  }

  return NextResponse.json({
    ok: supabase.configured && adminSecret && siteUsersTable,
    supabase,
    adminSecret,
    siteUsersTable,
    siteUsersError,
    hint: !supabase.hasUrl
      ? 'חסר NEXT_PUBLIC_SUPABASE_URL ב-Vercel'
      : !supabase.hasServiceKey
        ? 'חסר SUPABASE_SERVICE_ROLE_KEY ב-Vercel (לא anon!)'
        : !adminSecret
          ? 'חסר ADMIN_SECRET ב-Vercel'
          : !siteUsersTable
            ? 'הריצי site_users.sql ב-Supabase SQL Editor'
            : 'הכל מוגדר — נסי התחברות או הרשמה',
  });
}
