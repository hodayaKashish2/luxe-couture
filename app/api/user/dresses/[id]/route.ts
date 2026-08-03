import { NextResponse } from 'next/server';
import { getUserFromRequest, type SiteUser } from '@/lib/user-auth';
import { userOwnsDress } from '@/lib/dress-ownership';
import { sendDressUpdateEmails } from '@/lib/dress-edit-notify';
import {
  buildEditFormFromDress,
  getDressColorFromRow,
  getLiveDressSnapshot,
  mapOwnedDressForEdit,
  normalizeDressImages,
} from '@/lib/dress-pending-update';
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
    return Array.isArray(parsed) ? normalizeDressImages(parsed) : [];
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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'יש להתחבר' }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Supabase לא מוגדר' }, { status: 503 });

  try {
    const { id } = await params;
    const dress = await getOwnedDress(id, user);
    if (!dress) return NextResponse.json({ error: 'שמלה לא נמצאה' }, { status: 404 });

    const mapped = mapOwnedDressForEdit(dress as Record<string, unknown>);
    return NextResponse.json(mapped, {
      headers: { 'Cache-Control': 'no-store' },
    });
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

    const dressRow = dress as Record<string, unknown>;
    const live = getLiveDressSnapshot(dressRow);
    const contentType = request.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');

    let body: Record<string, unknown> = {};
    let keptImages: string[] = [];
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
        keptImages = normalizeDressImages(body.images);
      }
    }

    const liveColor = getDressColorFromRow({
      color: dressRow.color as string | null,
      description: dressRow.description as string | null,
    });

    const submittedColor = body.color !== undefined ? String(body.color).trim() : '';
    const resolvedColor = submittedColor || liveColor;

    const updates: Record<string, unknown> = {
      name: String(body.name ?? live.name).trim(),
      price: Number(body.price ?? live.price),
      size: String(body.size ?? live.size).trim(),
      city: String(body.city ?? live.city).trim(),
      color: resolvedColor,
    };

    const condition = String(dressRow.condition || 'new');
    const descriptionInput = body.description !== undefined ? String(body.description).trim() : '';
    const existingParts = String(dressRow.description || '').split('|').map((p: string) => p.trim());
    const baseDescription =
      descriptionInput ||
      existingParts.find((p: string) => p && !p.startsWith('צבע:') && !p.startsWith('מצב:') && !p.includes('ניקוי יבש')) ||
      buildEditFormFromDress(live).description ||
      'אין תיאור זמין.';

    updates.description = [
      baseDescription,
      resolvedColor ? `צבע: ${resolvedColor}` : '',
      `מצב: ${conditionLabel(condition)}`,
    ]
      .filter(Boolean)
      .join(' | ');

    const uploaded = newFiles.length > 0 ? await uploadDressImages(newFiles) : [];
    const mergedImages = normalizeDressImages([...keptImages, ...uploaded]);

    if (mergedImages.length === 0) {
      return NextResponse.json({ error: 'חייבת להישאר לפחות תמונה אחת' }, { status: 400 });
    }
    if (mergedImages.length > MAX_DRESS_IMAGES) {
      return NextResponse.json({ error: `ניתן לשמור עד ${MAX_DRESS_IMAGES} תמונות` }, { status: 400 });
    }

    updates.images = mergedImages;
    updates.pending_update = null;
    updates.pending_update_submitted_at = null;

    const supabase = getSupabaseAdmin();
    let updateResult = await supabase.from('dresses').update(updates).eq('id', id);

    if (updateResult.error?.message?.includes('pending_update')) {
      const { pending_update: _p, pending_update_submitted_at: _t, ...safeUpdates } = updates;
      updateResult = await supabase.from('dresses').update(safeUpdates).eq('id', id);
    }

    if (updateResult.error) throw updateResult.error;

    const emailStatus = await sendDressUpdateEmails(supabase, user, dressRow, {
      dressId: id,
      name: String(updates.name),
      price: Number(updates.price),
      size: String(updates.size),
      city: String(updates.city),
      color: resolvedColor,
      images: mergedImages,
    });

    return NextResponse.json({
      success: true,
      message: 'השמלה עודכנה בהצלחה!',
      emailStatus: { ...emailStatus, ok: emailStatus.adminOk || emailStatus.ownerOk },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
