import { NextResponse } from 'next/server';
import { getUserFromRequest, type SiteUser } from '@/lib/user-auth';
import { userOwnsDress } from '@/lib/dress-ownership';
import {
  buildPendingUpdatePayload,
  getDressColorFromRow,
  getEffectiveDressSnapshot,
  isSchemaMissingPendingUpdate,
  mapOwnedDressForEdit,
} from '@/lib/dress-pending-update';
import { notifyDressUpdateSubmitted } from '@/lib/dress-update-notify';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';
import { MAX_DRESS_IMAGES, uploadDressImages } from '@/lib/dress-images';

function conditionLabel(condition: string) {
  if (condition === 'new') return 'חדש עם תווית';
  if (condition === 'like-new') return 'כמו חדש';
  return 'יד שנייה';
}

function parseJsonArray(raw: string | null) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

async function getOwnedDress(id: string, user: Pick<SiteUser, 'userId' | 'phone' | 'email'>) {
  const supabase = getSupabaseAdmin();
  const { data: dress, error } = await supabase.from('dresses').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!dress || !userOwnsDress(dress, user)) return null;
  return dress;
}

function mapOwnedDressForClient(row: Record<string, unknown>) {
  return mapOwnedDressForEdit(row);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });

  try {
    const { id } = await params;
    const dress = await getOwnedDress(id, user);
    if (!dress) return NextResponse.json({ error: 'שמלה לא נמצאה' }, { status: 404 });
    return NextResponse.json(mapOwnedDressForClient(dress as Record<string, unknown>));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });

  try {
    const { id } = await params;
    const dress = await getOwnedDress(id, user);
    if (!dress) return NextResponse.json({ error: 'שמלה לא נמצאה' }, { status: 404 });

    const contentType = request.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');

    let body: Record<string, unknown> = {};
    let keptImages: string[] | null = null;
    let newFiles: File[] = [];

    if (isMultipart) {
      const formData = await request.formData();
      body = {
        name: formData.get('name'),
        price: formData.get('price'),
        size: formData.get('size'),
        city: formData.get('city'),
        color: formData.get('color'),
        description: formData.get('description'),
      };
      keptImages = parseJsonArray(String(formData.get('kept_images') || '[]'));
      newFiles = formData.getAll('images').filter((item): item is File => item instanceof File && item.size > 0);
    } else {
      body = await request.json();
      if (Array.isArray(body.images)) {
        keptImages = body.images.map(String);
      }
    }

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
      const submittedColor = body.color !== undefined ? String(body.color).trim() : undefined;
      const color =
        submittedColor ||
        getDressColorFromRow({
          color: dress.color as string | null,
          description: dress.description as string | null,
        });
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

    if (keptImages !== null || newFiles.length > 0) {
      const existing = keptImages ?? getEffectiveDressSnapshot(dress).images;
      const uploaded = newFiles.length > 0 ? await uploadDressImages(newFiles) : [];
      const merged = [...existing, ...uploaded];

      if (merged.length === 0) {
        return NextResponse.json({ error: 'חייבת להישאר לפחות תמונה אחת' }, { status: 400 });
      }
      if (merged.length > MAX_DRESS_IMAGES) {
        return NextResponse.json({ error: `ניתן לשמור עד ${MAX_DRESS_IMAGES} תמונות` }, { status: 400 });
      }

      updates.images = merged;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'אין שדות לעדכון' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const dressStatus = String(dress.status || '');

    if (dressStatus === 'approved') {
      const pendingUpdate = buildPendingUpdatePayload(dress, updates);
      const pendingPayload = {
        pending_update: pendingUpdate,
        pending_update_submitted_at: new Date().toISOString(),
      };

      let updateResult = await supabase.from('dresses').update(pendingPayload).eq('id', id);
      if (updateResult.error?.message && isSchemaMissingPendingUpdate(updateResult.error.message)) {
        updateResult = await supabase.from('dresses').update(updates).eq('id', id);
        if (updateResult.error) throw updateResult.error;

        const directSnapshot = buildPendingUpdatePayload(dress, updates);
        await notifyDressUpdateSubmitted(supabase, dress as Record<string, unknown>, user, {
          dressId: id,
          name: directSnapshot.name,
          price: directSnapshot.price,
          size: directSnapshot.size,
          city: directSnapshot.city,
          color: directSnapshot.color,
          images: directSnapshot.images,
        });

        return NextResponse.json({
          success: true,
          message: 'השמלה עודכנה בהצלחה',
          directUpdate: true,
        });
      }
      if (updateResult.error) throw updateResult.error;

      await notifyDressUpdateSubmitted(supabase, dress as Record<string, unknown>, user, {
        dressId: id,
        name: pendingUpdate.name,
        price: pendingUpdate.price,
        size: pendingUpdate.size,
        city: pendingUpdate.city,
        color: pendingUpdate.color,
        images: pendingUpdate.images,
      });

      return NextResponse.json({
        success: true,
        pendingApproval: true,
        message: 'העדכון נשלח לאישור ההנהלה! נעדכן אותך במייל כשיאושר.',
      });
    }

    const { error } = await supabase.from('dresses').update(updates).eq('id', id);
    if (error) throw error;

    return NextResponse.json({
      success: true,
      message:
        dressStatus === 'pending'
          ? 'השמלה עודכנה וממתינה לאישור ההנהלה'
          : 'השמלה עודכנה בהצלחה',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
