import { getCleanDescription } from '@/lib/dress-display';

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
  condition?: string;
  deposit?: number;
  pickup_method?: string;
  includes_dry_cleaning?: boolean;
  /** Email used when the update was submitted — for approval notification */
  notify_email?: string;
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
  };

  for (const key of ['name', 'size', 'city', 'color'] as const) {
    const prev = String(before[key] ?? '').trim();
    const next = String(after[key] ?? '').trim();
    if (prev !== next) {
      changes.push({ field: key, label: labels[key], before: prev || '—', after: next || '—' });
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
  const form = buildEditFormFromDress({
    name: String(row.name ?? snapshot.name),
    price: Number(row.price ?? snapshot.price),
    size: String(row.size ?? snapshot.size),
    city: String(row.city ?? snapshot.city),
    color: row.color as string | null,
    description: row.description as string | null,
  });

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
    event_type: String(updates.event_type ?? dress.event_type ?? 'single').trim() || 'single',
    listing_type: String(updates.listing_type ?? dress.listing_type ?? 'rent').trim() || 'rent',
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
