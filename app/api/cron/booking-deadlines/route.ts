import { NextResponse } from 'next/server';

import { processAllBookingLifecycle } from '@/lib/booking-lifecycle';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

function isAuthorized(request: Request) {
  const secret = process.env.ADMIN_SECRET || process.env.CRON_SECRET || '';
  if (!secret) return false;
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : request.headers.get('x-cron-secret') || '';
  return token === secret;
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const result = await processAllBookingLifecycle(supabase);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
