import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/user-auth';
import { readPasswordResetToken } from '@/lib/password-reset';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר בשרת' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const token = String(body.token || '').trim();
    const password = String(body.password || '');

    if (!token) {
      return NextResponse.json({ error: 'קישור האיפוס לא תקין. בקשי קישור חדש.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'סיסמה — לפחות 6 תווים' }, { status: 400 });
    }

    const payload = readPasswordResetToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'הקישור לא תקין או שפג תוקפו. בקשי קישור חדש מההתחברות.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: user, error } = await supabase
      .from('site_users')
      .select('id, password_hash')
      .eq('id', payload.userId)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: 'החשבון לא נמצא' }, { status: 404 });
    }

    if (!String(user.password_hash || '').startsWith(payload.pw)) {
      return NextResponse.json(
        { error: 'הקישור כבר נוצל. אם צריך, בקשי קישור חדש.' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('site_users')
      .update({ password_hash: hashPassword(password) })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'עדכון הסיסמה נכשל' }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      message: 'הסיסמה עודכנה. אפשר להתחבר עם הסיסמה החדשה.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
