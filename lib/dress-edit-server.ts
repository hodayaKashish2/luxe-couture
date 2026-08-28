import { isValidDressKind, isValidListingType } from '@/lib/dress-listing';
import { isValidDressLength, isValidDressStyle } from '@/lib/dress-style-length';
import {
  buildEditFormFromDress,
  conditionLabel,
  filterKeptDressImages,
  getAllowedDressImageUrls,
  getDressColorFromRow,
  getLiveDressSnapshot,
  normalizeDressImages,
  normalizePrice,
  type DressEditFormFields,
} from '@/lib/dress-pending-update';
import { MAX_DRESS_IMAGES, uploadDressImages } from '@/lib/dress-images';

export type ParsedDressEditFields = DressEditFormFields;

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

export function parseDressEditBody(raw: Record<string, unknown>) {
  const eventType = String(raw.event_type ?? 'single').trim();
  const listingType = String(raw.listing_type ?? 'rent').trim();
  const dressStyle = String(raw.dress_style ?? '').trim();
  const dressLength = String(raw.dress_length ?? '').trim();

  if (!isValidDressKind(eventType)) {
    return { error: 'נא לבחור סוג פריט — שמלה בודדת או סט' as const };
  }
  if (!isValidListingType(listingType)) {
    return { error: 'נא לבחור השכרה או מכירה' as const };
  }
  if (!dressStyle || !isValidDressStyle(dressStyle)) {
    return { error: 'נא לבחור סגנון — שמרני, קלאסי או מודרני' as const };
  }
  if (!dressLength || !isValidDressLength(dressLength)) {
    return { error: 'נא לבחור אורך — קצר, אמצע או ארוך' as const };
  }

  return {
    fields: {
      name: String(raw.name ?? '').trim(),
      price: String(normalizePrice(raw.price)),
      size: String(raw.size ?? '').trim(),
      city: String(raw.city ?? '').trim(),
      color: String(raw.color ?? '').trim(),
      description: raw.description !== undefined ? String(raw.description).trim() : undefined,
      event_type: eventType,
      listing_type: listingType,
      dress_style: dressStyle,
      dress_length: dressLength,
      condition: String(raw.condition ?? 'new').trim() || 'new',
      deposit: String(normalizePrice(raw.deposit ?? 0)),
      pickup_method: String(raw.pickup_method ?? 'pickup').trim() || 'pickup',
      includes_dry_cleaning: parseBooleanField(raw.includes_dry_cleaning) ? 'yes' as const : 'no' as const,
    },
  };
}

export type DressEditRequestPayload = {
  body: Record<string, unknown>;
  keptImages: string[];
  newFiles: File[];
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
};

export async function parseDressEditRequest(request: Request): Promise<DressEditRequestPayload> {
  const contentType = request.headers.get('content-type') || '';
  const isMultipart = contentType.includes('multipart/form-data');

  let body: Record<string, unknown> = {};
  let keptImages: string[] = [];
  let newFiles: File[] = [];
  let ownerName: string | undefined;
  let ownerPhone: string | undefined;
  let ownerEmail: string | undefined;

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
    ownerName = String(formData.get('owner_name') ?? '').trim() || undefined;
    ownerPhone = String(formData.get('owner_phone') ?? '').trim() || undefined;
    ownerEmail = String(formData.get('owner_email') ?? '').trim() || undefined;
  } else {
    body = await request.json();
    if (Array.isArray(body.images)) {
      keptImages = normalizeDressImages(body.images);
    }
    ownerName = body.owner_name !== undefined ? String(body.owner_name).trim() : undefined;
    ownerPhone = body.owner_phone !== undefined ? String(body.owner_phone).trim() : undefined;
    ownerEmail = body.owner_email !== undefined ? String(body.owner_email).trim() : undefined;
  }

  return { body, keptImages, newFiles, ownerName, ownerPhone, ownerEmail };
}

export async function buildDressUpdatesFromEditRequest(
  dressRow: Record<string, unknown>,
  payload: DressEditRequestPayload,
  opts?: { includeOwnerFields?: boolean }
) {
  const parsed = parseDressEditBody(payload.body);
  if ('error' in parsed) {
    return { error: parsed.error };
  }
  const fields = parsed.fields;

  const live = getLiveDressSnapshot(dressRow);
  const liveColor = getDressColorFromRow({
    color: dressRow.color as string | null,
    description: dressRow.description as string | null,
  });
  const submittedColor = fields.color || liveColor;
  const condition = fields.condition;
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
    price: normalizePrice(fields.price),
    size: fields.size,
    city: fields.city,
    color: submittedColor,
    event_type: fields.event_type,
    listing_type: fields.listing_type,
    dress_style: fields.dress_style,
    dress_length: fields.dress_length,
    condition,
    deposit: normalizePrice(fields.deposit),
    pickup_method: fields.pickup_method,
    includes_dry_cleaning: fields.includes_dry_cleaning === 'yes',
    description: [
      baseDescription,
      submittedColor ? `צבע: ${submittedColor}` : '',
      `מצב: ${conditionLabel(condition)}`,
      fields.includes_dry_cleaning === 'yes' ? 'כולל ניקוי יבש' : '',
    ]
      .filter(Boolean)
      .join(' | '),
  };

  const uploaded = payload.newFiles.length > 0 ? await uploadDressImages(payload.newFiles) : [];
  const allowedImages = getAllowedDressImageUrls(dressRow, live.images);
  const validatedKept = filterKeptDressImages(payload.keptImages, allowedImages);
  const mergedImages = normalizeDressImages([...validatedKept, ...uploaded]);

  if (mergedImages.length === 0) {
    return { error: 'חייבת להישאר לפחות תמונה אחת' as const };
  }
  if (mergedImages.length > MAX_DRESS_IMAGES) {
    return { error: `ניתן לשמור עד ${MAX_DRESS_IMAGES} תמונות` as const };
  }

  updates.images = mergedImages;

  if (opts?.includeOwnerFields) {
    if (payload.ownerName !== undefined) updates.owner_name = payload.ownerName;
    if (payload.ownerPhone !== undefined) updates.owner_phone = payload.ownerPhone;
    if (payload.ownerEmail !== undefined) updates.owner_email = payload.ownerEmail;
  }

  return { updates, fields };
}
