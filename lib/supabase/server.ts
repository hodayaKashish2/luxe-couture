import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error('חסרים משתני סביבה של Supabase (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(url && key);
}

export function supabaseEnvStatus() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
  return {
    hasUrl: Boolean(url),
    hasServiceKey: Boolean(key),
    configured: Boolean(url && key),
    urlHost: url ? url.replace(/^https?:\/\//, '').split('/')[0] : null,
    keyLength: key.length,
  };
}
