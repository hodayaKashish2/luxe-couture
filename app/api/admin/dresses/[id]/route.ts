import { NextResponse } from 'next/server';
import {
  buildDressUpdatesFromEditRequest,
  parseDressEditRequest,
} from '@/lib/dress-edit-server';
import { mapAdminDressForEdit } from '@/lib/dress-pending-update';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

function verifyAdminToken(request: Request) {
  const token =
    request.headers.get('x-admin-token') ||
    new URL(request.url).searchParams.get('token');
  return Boolean(token && process.env.ADMIN_SECRET && token === process.env.ADMIN_SECRET);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { data: dress, error } = await supabase.from('dresses').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!dress) return NextResponse.json({ error: 'שמלה לא נמצאה' }, { status: 404 });

    return NextResponse.json(mapAdminDressForEdit(dress as Record<string, unknown>), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });
  }

  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { data: dress, error: fetchError } = await supabase
      .from('dresses')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!dress) return NextResponse.json({ error: 'שמלה לא נמצאה' }, { status: 404 });

    const dressRow = dress as Record<string, unknown>;
    const status = String(dressRow.status || '');
    if (status === 'removed') {
      return NextResponse.json({ error: 'לא ניתן לערוך שמלה שהוסרה מהאתר' }, { status: 400 });
    }

    const payload = await parseDressEditRequest(request);
    const built = await buildDressUpdatesFromEditRequest(dressRow, payload, {
      includeOwnerFields: true,
    });
    if ('error' in built) {
      return NextResponse.json({ error: built.error }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('dresses')
      .update({
        ...built.updates,
        pending_update: null,
        pending_update_submitted_at: null,
      })
      .eq('id', id);
    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'השמלה עודכנה בהצלחה',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
