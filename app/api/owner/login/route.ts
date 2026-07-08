import { NextResponse } from 'next/server';
import { createOwnerToken, normalizePhone, phonesMatch } from '@/lib/owner-auth';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const phone = String(body.phone || '').trim();
    const ownerName = String(body.owner_name || '').trim();

    if (!phone) {
      return NextResponse.json({ error: 'יש להזין מספר טלפון' }, { status: 400 });
    }

    const normalized = normalizePhone(phone);
    const supabase = getSupabaseAdmin();

    const { data: dresses, error } = await supabase
      .from('dresses')
      .select('owner_name, owner_phone, status')
      .not('owner_phone', 'is', null);

    if (error) throw error;

    const matches = (dresses ?? []).filter(
      (d) => phonesMatch(String(d.owner_phone || ''), normalized) && d.status !== 'rejected'
    );

    if (matches.length === 0) {
      return NextResponse.json(
        { error: 'לא נמצאו שמלות עם מספר טלפון זה. ודאי שהזנת את אותו מספר שפרסמת.' },
        { status: 404 }
      );
    }

    const resolvedName =
      ownerName ||
      matches.find((d) => d.owner_name)?.owner_name ||
      'משכירה';

    const nameOk = matches.some(
      (d) => !ownerName || String(d.owner_name || '').trim() === ownerName
    );

    if (ownerName && !nameOk) {
      return NextResponse.json({ error: 'שם המשכירה לא תואם למספר הטלפון' }, { status: 403 });
    }

    const token = createOwnerToken(phone, resolvedName);

    return NextResponse.json({
      success: true,
      token,
      ownerName: resolvedName,
      dressCount: matches.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
