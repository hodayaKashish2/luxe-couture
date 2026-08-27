import { getCleanDescription } from '@/lib/dress-display';
import { dressKindLabel, listingTypeLabel, normalizeDressKind, normalizeListingType } from '@/lib/dress-listing';
import {
  DEFAULT_DRESS_LENGTH,
  dressLengthLabel,
  dressStyleLabel,
  normalizeDressLength,
  normalizeDressStyle,
} from '@/lib/dress-style-length';

export type PendingUpdatePayload = {
  name: string;
  price: number;
  size: string;
  city: string;
  color: string;
  description: string;
  images: string[];
  event_type?: string;
  listing_type?: string;
  dress_style?: string;
  dress_length?: string;
  condition?: string;
  deposit?: number;
  pickup_method?: string;
  includes_dry_cleaning?: boolean;
  /** Email used when the update was submitted — for approval notification */
  notify_email?: string;
};

export type DressEditFormFields = {
  name: string;
  price: string;
  size: string;
  city: string;
  color: string;
  description: string;
  event_type: string;
  listing_type: string;
  dress_style: string;
  dress_length: string;
  condition: string;
  deposit: string;
  pickup_method: string;
  includes_dry_cleaning: 'yes' | 'no';
};

export function normalizeDressImages(raw: unknown): string[] {
  let list: string[] = [];

  if (Array.isArray(raw)) {
    list = raw.map(String);
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return [];
    }
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) list = parsed.map(String);
      } catch {
        list = [trimmed];
      }
    } else {
      list = [trimmed];
    }
  }

  const seen = new Set<string>();
  return list
    .map((url) => url.trim())
    .filter((url) => {
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    });
}

export function normalizeImageUrl(url: string) {
  try {
    return decodeURIComponent(url.trim()).replace(/\/$/, '');
  } catch {
    return url.trim().replace(/\/$/, '');
  }
}

export function normalizePrice(value: unknown) {
  const cleaned = String(value ?? '')
    .trim()
    .replace(/[^\d.]/g, '');
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

/** URLs the owner may keep when editing (live catalog + any pending draft). */
export function getAllowedDressImageUrls(dress: Record<string, unknown>, liveImages: string[]) {
  const pending = dress.pending_update as PendingUpdatePayload | null | undefined;
  const pendingImages =
    pending && typeof pending === 'object' && Array.isArray(pending.images)
      ? normalizeDressImages(pending.images)
      : [];
  return normalizeDressImages([...liveImages, ...pendingImages]);
}

/** Keep only URLs the client explicitly kept and that belong to this dress. */
export function filterKeptDressImages(kept: string[], allowedImages: string[]) {
  const allowedSet = new Set(allowedImages.map(normalizeImageUrl));
  return normalizeDressImages(kept).filter((url) => allowedSet.has(normalizeImageUrl(url)));
}

export function filterKeptLiveImages(kept: string[], liveImages: string[]) {
  return filterKeptDressImages(kept, liveImages);
}

export type DressFieldChange = {
  field: string;
  label: string;
  before: string;
  after: string;
};

export type DressUpdateDiff = {
  changes: DressFieldChange[];
  imageChanges: {
    removed: string[];
    added: string[];
  };
};

export function computeDressUpdateDiff(
  before: ReturnType<typeof getLiveDressSnapshot>,
  after: PendingUpdatePayload
): DressUpdateDiff {
  const changes: DressFieldChange[] = [];
  const labels: Record<string, string> = {
    name: 'שם',
    price: 'מחיר',
    size: 'מידה',
    city: 'עיר',
    color: 'צבע',
    description: 'תיאור',
    event_type: 'סוג פריט',
    listing_type: 'השכרה/מכירה',
    dress_style: 'סגנון',
    dress_length: 'אורך',
    condition: 'מצב',
    deposit: 'פיקדון',
    pickup_method: 'קבלת השמלה',
    includes_dry_cleaning: 'ניקוי יבש',
  };

  const formatFieldValue = (field: string, value: unknown) => {
    if (field === 'event_type') return dressKindLabel(String(value || ''));
    if (field === 'listing_type') return listingTypeLabel(String(value || ''));
    if (field === 'dress_style') return dressStyleLabel(String(value || ''));
    if (field === 'dress_length') return dressLengthLabel(String(value || ''));
    if (field === 'includes_dry_cleaning') return value ? 'כולל' : 'לא כולל';
    if (field === 'deposit') return `₪${normalizePrice(value)}`;
    return String(value ?? '').trim() || '—';
  };

  for (const key of ['name', 'size', 'city', 'color', 'event_type', 'listing_type', 'dress_style', 'dress_length', 'condition', 'pickup_method'] as const) {
    const prev = formatFieldValue(key, before[key as keyof typeof before]);
    const next = formatFieldValue(key, after[key as keyof PendingUpdatePayload]);
    if (prev !== next) {
      changes.push({ field: key, label: labels[key], before: prev, after: next });
    }
  }

  if (normalizePrice(before.price) !== normalizePrice(after.price)) {
    changes.push({
      field: 'price',
      label: labels.price,
      before: `₪${normalizePrice(before.price)}`,
      after: `₪${normalizePrice(after.price)}`,
    });
  }

  const beforeDesc = getCleanDescription(String(before.description || ''));
  const afterDesc = getCleanDescription(String(after.description || ''));
  if (beforeDesc !== afterDesc) {
    changes.push({
      field: 'description',
      label: labels.description,
      before: beforeDesc || '—',
      after: afterDesc || '—',
    });
  }

  if (Boolean(before.includes_dry_cleaning) !== Boolean(after.includes_dry_cleaning)) {
    changes.push({
      field: 'includes_dry_cleaning',
      label: labels.includes_dry_cleaning,
      before: formatFieldValue('includes_dry_cleaning', before.includes_dry_cleaning),
      after: formatFieldValue('includes_dry_cleaning', after.includes_dry_cleaning),
    });
  }

  if (normalizePrice(before.deposit) !== normalizePrice(after.deposit)) {
    changes.push({
      field: 'deposit',
      label: labels.deposit,
      before: formatFieldValue('deposit', before.deposit),
      after: formatFieldValue('deposit', after.deposit),
    });
  }

  const beforeImages = normalizeDressImages(before.images);
  const afterImages = normalizeDressImages(after.images);
  const afterSet = new Set(afterImages.map(normalizeImageUrl));
  const beforeSet = new Set(beforeImages.map(normalizeImageUrl));

  return {
    changes,
    imageChanges: {
      removed: beforeImages.filter((url) => !afterSet.has(normalizeImageUrl(url))),
      added: afterImages.filter((url) => !beforeSet.has(normalizeImageUrl(url))),
    },
  };
}

export function getDressColorFromRow(dress: { color?: string | null; description?: string | null }) {
  const direct = String(dress.color || '').trim();
  if (direct) return direct;

  const description = String(dress.description || '');
  const parts = description
    .split(/[|·\n]/)
    .map((p) => p.trim())
    .filter(Boolean);

  const pipePart = parts.find((p) => /^צבע\s*:/i.test(p) || /^color\s*:/i.test(p));

  if (pipePart) {
    return pipePart.replace(/^(?:צבע|color)\s*:\s*/i, '').trim();
  }

  const inlineMatch = description.match(/(?:צבע|color)\s*[:\-–]\s*([^|·\n]+)/i);
  if (inlineMatch?.[1]) return inlineMatch[1].trim();

  return '';
}

/** Published row as shown in the catalog (ignores pending_update drafts). */
export function getLiveDressSnapshot(dress: Record<string, unknown>) {
  const liveImages = normalizeDressImages(dress.images);
  const liveColor = getDressColorFromRow({
    color: dress.color as string | null,
    description: dress.description as string | null,
  });

  return {
    name: String(dress.name ?? ''),
    price: normalizePrice(dress.price ?? 0),
    size: String(dress.size ?? ''),
    city: String(dress.city ?? ''),
    color: liveColor,
    description: String(dress.description ?? ''),
    images: liveImages,
    event_type: normalizeDressKind(String(dress.event_type || '')),
    listing_type: normalizeListingType(String(dress.listing_type || '')),
    dress_style: normalizeDressStyle(String(dress.dress_style || '')),
    dress_length: normalizeDressLength(String(dress.dress_length || '')),
    condition: String(dress.condition || 'new'),
    deposit: normalizePrice(dress.deposit ?? 0),
    pickup_method: String(dress.pickup_method || 'pickup'),
    includes_dry_cleaning: Boolean(dress.includes_dry_cleaning),
  };
}

export function buildEditFormFromDress(dress: {
  name: string;
  price: number;
  size: string;
  city: string;
  color?: string | null;
  description?: string | null;
}) {
  const resolvedColor = String(dress.color || '').trim() || getDressColorFromRow(dress);
  return {
    name: dress.name,
    price: String(dress.price),
    size: dress.size,
    city: dress.city,
    color: resolvedColor,
    description: getCleanDescription(String(dress.description || '')),
  };
}

function conditionLabel(condition: string) {
  if (condition === 'new') return 'חדש עם תווית';
  if (condition === 'like-new') return 'כמו חדש';
  return 'יד שנייה';
}

export function buildEditFormFromDressRow(row: Record<string, unknown>): DressEditFormFields {
  const pending = row.pending_update as PendingUpdatePayload | null | undefined;
  const source =
    pending && typeof pending === 'object' && String(row.status || '') === 'approved'
      ? { ...row, ...pending }
      : row;
  const snapshot = getLiveDressSnapshot(row);
  const base = buildEditFormFromDress({
    name: String(source.name ?? snapshot.name),
    price: Number(source.price ?? snapshot.price),
    size: String(source.size ?? snapshot.size),
    city: String(source.city ?? snapshot.city),
    color: source.color as string | null,
    description: source.description as string | null,
  });

  const dressStyleRaw = String(source.dress_style ?? row.dress_style ?? '').trim();

  return {
    ...base,
    event_type: normalizeDressKind(String(source.event_type ?? row.event_type ?? 'single')),
    listing_type: normalizeListingType(String(source.listing_type ?? row.listing_type ?? 'rent')),
    dress_style: dressStyleRaw,
    dress_length: normalizeDressLength(String(source.dress_length ?? row.dress_length ?? DEFAULT_DRESS_LENGTH)),
    condition: String(source.condition ?? row.condition ?? 'new'),
    deposit: String(Number(source.deposit ?? row.deposit ?? 0) || ''),
    pickup_method: String(source.pickup_method ?? row.pickup_method ?? 'pickup'),
    includes_dry_cleaning:
      Boolean(source.includes_dry_cleaning ?? row.includes_dry_cleaning) ? 'yes' : 'no',
  };
}

export { conditionLabel };

export function getEffectiveDressSnapshot(dress: Record<string, unknown>) {
  const pending = dress.pending_update as PendingUpdatePayload | null | undefined;
  const liveImages = normalizeDressImages(dress.images);
  const liveColor = getDressColorFromRow({
    color: dress.color as string | null,
    description: dress.description as string | null,
  });

  if (!pending || typeof pending !== 'object') {
    return {
      name: String(dress.name ?? ''),
      price: normalizePrice(dress.price ?? 0),
      size: String(dress.size ?? ''),
      city: String(dress.city ?? ''),
      color: liveColor,
      description: String(dress.description ?? ''),
      images: liveImages,
    };
  }

  const pendingColor =
    String(pending.color || '').trim() ||
    getDressColorFromRow({ color: pending.color, description: pending.description });

  return {
    name: pending.name || String(dress.name ?? ''),
    price: pending.price ?? Number(dress.price ?? 0),
    size: pending.size || String(dress.size ?? ''),
    city: pending.city || String(dress.city ?? ''),
    color: pendingColor || liveColor,
    description: pending.description || String(dress.description ?? ''),
    images: pending.images?.length ? normalizeDressImages(pending.images) : liveImages,
  };
}

export function mapOwnedDressForEdit(row: Record<string, unknown>) {
  const pending = row.pending_update as PendingUpdatePayload | null | undefined;
  const snapshot = getLiveDressSnapshot(row);
  const form = buildEditFormFromDressRow(row);

  return {
    id: String(row.id),
    name: snapshot.name,
    price: snapshot.price,
    size: snapshot.size,
    city: snapshot.city,
    color: form.color,
    description: snapshot.description,
    status: String(row.status),
    images: snapshot.images,
    rental_count: Number(row.rental_count || 0),
    has_pending_update: Boolean(pending),
    booked_dates: [] as string[],
    form,
  };
}

export function mergeDressWithPendingUpdate<T extends Record<string, unknown>>(
  dress: T,
  pendingUpdate: PendingUpdatePayload | null | undefined
): T & Partial<PendingUpdatePayload> & { isPendingUpdate?: boolean } {
  if (!pendingUpdate || typeof pendingUpdate !== 'object') {
    return dress;
  }

  return {
    ...dress,
    name: pendingUpdate.name ?? String(dress.name ?? ''),
    price: pendingUpdate.price ?? Number(dress.price ?? 0),
    size: pendingUpdate.size ?? String(dress.size ?? ''),
    city: pendingUpdate.city ?? String(dress.city ?? ''),
    color: pendingUpdate.color?.trim() || getDressColorFromRow({
      color: pendingUpdate.color,
      description: pendingUpdate.description,
    }) || getDressColorFromRow({
      color: dress.color as string | null,
      description: dress.description as string | null,
    }),
    description: pendingUpdate.description ?? String(dress.description ?? ''),
    images: pendingUpdate.images?.length ? pendingUpdate.images : Array.isArray(dress.images) ? dress.images.map(String) : [],
    isPendingUpdate: true as const,
  };
}

export function buildPendingUpdatePayload(
  dress: Record<string, unknown>,
  updates: Record<string, unknown>
): PendingUpdatePayload {
  const isApprovedLive = String(dress.status || '') === 'approved';
  const base = isApprovedLive ? getLiveDressSnapshot(dress) : getEffectiveDressSnapshot(dress);
  const submittedColor =
    updates.color !== undefined ? String(updates.color).trim() : undefined;

  return {
    name: String(updates.name ?? base.name ?? '').trim(),
    price: normalizePrice(updates.price ?? base.price ?? 0),
    size: String(updates.size ?? base.size ?? '').trim(),
    city: String(updates.city ?? base.city ?? '').trim(),
    color: submittedColor !== undefined ? submittedColor : base.color || '',
    description: String(updates.description ?? base.description ?? '').trim(),
    images: Array.isArray(updates.images)
      ? normalizeDressImages(updates.images)
      : base.images,
    event_type: normalizeDressKind(String(updates.event_type ?? dress.event_type ?? 'single')),
    listing_type: normalizeListingType(String(updates.listing_type ?? dress.listing_type ?? 'rent')),
    dress_style: normalizeDressStyle(String(updates.dress_style ?? dress.dress_style ?? '')),
    dress_length: normalizeDressLength(String(updates.dress_length ?? dress.dress_length ?? DEFAULT_DRESS_LENGTH)),
    condition: String(updates.condition ?? dress.condition ?? 'new').trim(),
    deposit: Number(updates.deposit ?? dress.deposit ?? 0) || 0,
    pickup_method: String(updates.pickup_method ?? dress.pickup_method ?? 'pickup'),
    includes_dry_cleaning: Boolean(
      updates.includes_dry_cleaning ?? dress.includes_dry_cleaning ?? false
    ),
  };
}

export function pendingUpdateToDressPatch(payload: PendingUpdatePayload) {
  return {
    name: payload.name,
    price: normalizePrice(payload.price),
    size: payload.size,
    city: payload.city,
    color: payload.color,
    description: payload.description,
    images: normalizeDressImages(payload.images),
    event_type: payload.event_type || 'single',
    listing_type: payload.listing_type || 'rent',
    dress_style: payload.dress_style || normalizeDressStyle(''),
    dress_length: payload.dress_length || DEFAULT_DRESS_LENGTH,
    condition: payload.condition || 'new',
    deposit: payload.deposit ?? 0,
    pickup_method: payload.pickup_method || 'pickup',
    includes_dry_cleaning: payload.includes_dry_cleaning ?? false,
    pending_update: null,
    pending_update_submitted_at: null,
  };
}

export function isSchemaMissingPendingUpdate(message: string) {
  return message.includes('pending_update');
}
