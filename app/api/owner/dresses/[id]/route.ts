import { NextResponse } from 'next/server';
import { getOwnerFromRequest, phonesMatch } from '@/lib/owner-auth';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

async function getOwnedDress(id: string, ownerPhone: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('dresses').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data || !phonesMatch(String(data.owner_phone || ''), ownerPhone)) return null;
  return data;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = getOwnerFromRequest(request);
  if (!owner) return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });

  try {
    const { id } = await params;
    const dress = await getOwnedDress(id, owner.phone);
    if (!dress) return NextResponse.json({ error: 'שמלה לא נמצאה' }, { status: 404 });

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
    if (body.includes_dry_cleaning !== undefined) {
      updates.includes_dry_cleaning = Boolean(body.includes_dry_cleaning);
    }
    if (body.description !== undefined) updates.description = String(body.description).trim();
    if (body.condition !== undefined) updates.condition = String(body.condition);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'אין שדות לעדכון' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('dresses').update(updates).eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'השמלה עודכנה בהצלחה' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const owner = getOwnerFromRequest(request);
  if (!owner) return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });

  try {
    const { id } = await params;
    const dress = await getOwnedDress(id, owner.phone);
    if (!dress) return NextResponse.json({ error: 'שמלה לא נמצאה' }, { status: 404 });

    const supabase = getSupabaseAdmin();
    let { error } = await supabase.from('dresses').update({ status: 'removed' }).eq('id', id);

    if (error?.message?.includes('removed')) {
      ({ error } = await supabase.from('dresses').update({ status: 'rejected' }).eq('id', id));
    }

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'השמלה הוסרה מהאתר' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
