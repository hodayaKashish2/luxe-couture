import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/user-auth';
import { phonesMatch } from '@/lib/owner-auth';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

function emailsMatch(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function userOwnsDress(
  dress: { owner_phone?: string | null; owner_email?: string | null },
  user: { phone?: string; email?: string }
) {
  const ownerPhone = String(dress.owner_phone || '').trim();
  const ownerEmail = String(dress.owner_email || '').trim();
  const phoneOk = Boolean(user.phone?.trim() && ownerPhone && phonesMatch(ownerPhone, user.phone));
  const emailOk = Boolean(user.email?.trim() && ownerEmail && emailsMatch(ownerEmail, user.email));
  return phoneOk || emailOk;
}

function conditionLabel(condition: string) {
  if (condition === 'new') return 'חדש עם תווית';
  if (condition === 'like-new') return 'כמו חדש';
  return 'יד שנייה';
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });

  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { data: dress, error: fetchError } = await supabase.from('dresses').select('*').eq('id', id).maybeSingle();

    if (fetchError) throw fetchError;
    if (!dress || !userOwnsDress(dress, user)) {
      return NextResponse.json({ error: 'שמלה לא נמצאה' }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.price !== undefined) updates.price = Number(body.price);
    if (body.size !== undefined) updates.size = String(body.size).trim();
    if (body.city !== undefined) updates.city = String(body.city).trim();
    if (body.color !== undefined) updates.color = String(body.color).trim();
    if (body.event_type !== undefined) updates.event_type = String(body.event_type).trim();
    if (body.deposit !== undefined) updates.deposit = Number(body.deposit) || 0;
    if (body.pickup_method !== undefined) updates.pickup_method = String(body.pickup_method);
    if (body.condition !== undefined) updates.condition = String(body.condition);
    if (body.includes_dry_cleaning !== undefined) {
      updates.includes_dry_cleaning = body.includes_dry_cleaning === true || body.includes_dry_cleaning === 'yes';
    }

    if (body.description !== undefined || body.color !== undefined || body.condition !== undefined) {
      const descriptionInput = body.description !== undefined ? String(body.description).trim() : '';
      const color = body.color !== undefined ? String(body.color).trim() : String(dress.color || '').trim();
      const condition = body.condition !== undefined ? String(body.condition) : String(dress.condition || 'new');
      const existingParts = String(dress.description || '').split('|').map((p: string) => p.trim());
      const baseDescription =
        descriptionInput ||
        existingParts.find((p: string) => p && !p.startsWith('צבע:') && !p.startsWith('מצב:') && !p.includes('ניקוי יבש')) ||
        'אין תיאור זמין.';

      updates.description = [
        baseDescription,
        color ? `צבע: ${color}` : '',
        `מצב: ${conditionLabel(condition)}`,
      ]
        .filter(Boolean)
        .join(' | ');
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'אין שדות לעדכון' }, { status: 400 });
    }

    const { error } = await supabase.from('dresses').update(updates).eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'השמלה עודכנה בהצלחה' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
