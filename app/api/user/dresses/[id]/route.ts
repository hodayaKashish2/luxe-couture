import { NextResponse } from 'next/server';
import { getUserFromRequest, type SiteUser } from '@/lib/user-auth';
import { userOwnsDress } from '@/lib/dress-ownership';
import { sendDressUpdateEmails, resolveUpdateNotifyContact } from '@/lib/dress-edit-notify';
import {
  buildEditFormFromDress,
  buildPendingUpdatePayload,
  computeDressUpdateDiff,
  conditionLabel,
  filterKeptDressImages,
  getAllowedDressImageUrls,
  getDressColorFromRow,
  getLiveDressSnapshot,
  isSchemaMissingPendingUpdate,
  mapOwnedDressForEdit,
  normalizeDressImages,
  normalizePrice,
} from '@/lib/dress-pending-update';
import { isValidDressKind, isValidListingType } from '@/lib/dress-listing';
import { isValidDressLength, isValidDressStyle } from '@/lib/dress-style-length';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';
import { MAX_DRESS_IMAGES, uploadDressImages } from '@/lib/dress-images';

function parseJsonArray(raw: string | null) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? normalizeDressImages(parsed) : [];
  } catch {
    return [];
  }
}

function parseBooleanField(value: unknown) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'yes' || normalized === 'true' || normalized === '1';
}

function parseEditBody(raw: Record<string, unknown>) {
  const eventType = String(raw.event_type ?? 'single').trim();
  const listingType = String(raw.listing_type ?? 'rent').trim();
  const dressStyle = String(raw.dress_style ?? '').trim();
  const dressLength = String(raw.dress_length ?? '').trim();

  if (!isValidDressKind(eventType)) {
    return { error: 'נא לבחור סוג פריט — שמלה בודדת או סט' };
  }
  if (!isValidListingType(listingType)) {
    return { error: 'נא לבחור השכרה או מכירה' };
  }
  if (!dressStyle || !isValidDressStyle(dressStyle)) {
    return { error: 'נא לבחור סגנון — שמרני, קלאסי או מודרני' };
  }
  if (!dressLength || !isValidDressLength(dressLength)) {
    return { error: 'נא לבחור אורך — קצר, אמצע או ארוך' };
  }

  return {
    fields: {
      name: String(raw.name ?? '').trim(),
      price: normalizePrice(raw.price),
      size: String(raw.size ?? '').trim(),
      city: String(raw.city ?? '').trim(),
      color: String(raw.color ?? '').trim(),
      description: raw.description !== undefined ? String(raw.description).trim() : undefined,
      event_type: eventType,
      listing_type: listingType,
      dress_style: dressStyle,
      dress_length: dressLength,
      condition:
        raw.condition != null ? String(raw.condition).trim() || 'new' : undefined,
      deposit: normalizePrice(raw.deposit ?? 0),
      pickup_method:
        raw.pickup_method != null ? String(raw.pickup_method).trim() || 'pickup' : undefined,
      includes_dry_cleaning: parseBooleanField(raw.includes_dry_cleaning),
    },
  };
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
        event_type: formData.get('event_type'),
        listing_type: formData.get('listing_type'),
        dress_style: formData.get('dress_style'),
        dress_length: formData.get('dress_length'),
        condition: formData.get('condition'),
        deposit: formData.get('deposit'),
        pickup_method: formData.get('pickup_method'),
        includes_dry_cleaning: formData.get('includes_dry_cleaning'),
      };
      keptImages = parseJsonArray(String(formData.get('kept_images') || '[]'));
      newFiles = formData.getAll('images').filter((item): item is File => item instanceof File && item.size > 0);
    } else {
      body = await request.json();
      if (Array.isArray(body.images)) {
        keptImages = normalizeDressImages(body.images);
      }
    }

    const parsed = parseEditBody(body);
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const fields = parsed.fields;

    const liveColor = getDressColorFromRow({
      color: dressRow.color as string | null,
      description: dressRow.description as string | null,
    });

    const submittedColor = fields.color || liveColor;

    const condition =
      fields.condition ?? String(dressRow.condition ?? 'new').trim() || 'new';
    const pickupMethod =
      fields.pickup_method ?? String(dressRow.pickup_method ?? 'pickup').trim() || 'pickup';
    const descriptionInput = fields.description !== undefined ? fields.description : '';
    const existingParts = String(dressRow.description || '')
      .split('|')
      .map((p: string) => p.trim())
      .filter((p) => p && !p.startsWith('צבע:') && !p.startsWith('מצב:') && !p.includes('ניקוי יבש'));

    const baseDescription =
      descriptionInput ||
      existingParts[0] ||
      buildEditFormFromDress(live).description ||
      'אין תיאור זמין.';

    const updates: Record<string, unknown> = {
      name: fields.name,
      price: fields.price,
      size: fields.size,
      city: fields.city,
      color: submittedColor,
      event_type: fields.event_type,
      listing_type: fields.listing_type,
      dress_style: fields.dress_style,
      dress_length: fields.dress_length,
      condition,
      deposit: fields.deposit,
      pickup_method: pickupMethod,
      includes_dry_cleaning: fields.includes_dry_cleaning,
      description: [
        baseDescription,
        submittedColor ? `צבע: ${submittedColor}` : '',
        `מצב: ${conditionLabel(condition)}`,
        fields.includes_dry_cleaning ? 'כולל ניקוי יבש' : '',
      ]
        .filter(Boolean)
        .join(' | '),
    };

    const uploaded = newFiles.length > 0 ? await uploadDressImages(newFiles) : [];
    const allowedImages = getAllowedDressImageUrls(dressRow, live.images);
    const validatedKept = filterKeptDressImages(keptImages, allowedImages);
    const mergedImages = normalizeDressImages([...validatedKept, ...uploaded]);

    if (mergedImages.length === 0) {
      return NextResponse.json({ error: 'חייבת להישאר לפחות תמונה אחת' }, { status: 400 });
    }
    if (mergedImages.length > MAX_DRESS_IMAGES) {
      return NextResponse.json({ error: `ניתן לשמור עד ${MAX_DRESS_IMAGES} תמונות` }, { status: 400 });
    }

    updates.images = mergedImages;

    const supabase = getSupabaseAdmin();
    const dressStatus = String(dressRow.status || '');
    const pendingSnapshot = buildPendingUpdatePayload(dressRow, updates);
    const updateDiff = computeDressUpdateDiff(live, pendingSnapshot);

    const { email: notifyEmail } = await resolveUpdateNotifyContact(supabase, user, dressRow);
    if (notifyEmail) {
      pendingSnapshot.notify_email = notifyEmail;
    }

    if (dressStatus === 'approved') {
      const pendingPayload = {
        pending_update: pendingSnapshot,
        pending_update_submitted_at: new Date().toISOString(),
      };

      const updateResult = await supabase.from('dresses').update(pendingPayload).eq('id', id);

      if (updateResult.error?.message && isSchemaMissingPendingUpdate(updateResult.error.message)) {
        return NextResponse.json(
          {
            error:
              'חסרה עמודת pending_update ב-Supabase. הריצי את הקובץ supabase/upgrade-v9.sql ואז נסי שוב.',
          },
          { status: 503 }
        );
      }

      if (updateResult.error) throw updateResult.error;

      let emailStatus: Awaited<ReturnType<typeof sendDressUpdateEmails>> = {
        ownerEmail: '',
        adminOk: false,
        ownerOk: false,
      };
      try {
        emailStatus = await sendDressUpdateEmails(supabase, user, dressRow, {
          dressId: id,
          name: pendingSnapshot.name,
          ownerName: String(dressRow.owner_name || user.displayName || 'משכירה'),
          diff: updateDiff,
        });
      } catch (mailError) {
        console.error('Dress update email error:', mailError);
      }

      return NextResponse.json({
        success: true,
        pendingApproval: true,
        message: 'העדכון נשלח לאישור ההנהלה! בקטלוג תמשיך להופיע הגרסה הנוכחית עד האישור.',
        emailStatus,
      });
    }

    const { error } = await supabase.from('dresses').update(updates).eq('id', id);
    if (error) throw error;

    let emailStatus = { adminOk: false, ownerOk: false };
    try {
      emailStatus = await sendDressUpdateEmails(supabase, user, dressRow, {
        dressId: id,
        name: pendingSnapshot.name,
        ownerName: String(dressRow.owner_name || user.displayName || 'משכירה'),
        diff: updateDiff,
      });
    } catch (mailError) {
      console.error('Dress update email error:', mailError);
    }

    return NextResponse.json({
      success: true,
      message:
        dressStatus === 'pending'
          ? 'השמלה עודכנה וממתינה לאישור ההנהלה'
          : 'השמלה עודכנה בהצלחה',
      emailStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'שגיאה';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
