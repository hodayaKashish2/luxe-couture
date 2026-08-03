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
  condition?: string;
  deposit?: number;
  pickup_method?: string;
  includes_dry_cleaning?: boolean;
};

export function getDressColorFromRow(dress: { color?: string | null; description?: string | null }) {
  const direct = String(dress.color || '').trim();
  if (direct) return direct;

  const part = String(dress.description || '')
    .split('|')
    .map((p) => p.trim())
    .find((p) => /^צבע\s*:/i.test(p));

  return part ? part.replace(/^צבע\s*:\s*/i, '').trim() : '';
}

/** Published row as shown in the catalog (ignores pending_update drafts). */
export function getLiveDressSnapshot(dress: Record<string, unknown>) {
  const liveImages = Array.isArray(dress.images) ? dress.images.map(String) : [];
  const liveColor = getDressColorFromRow({
    color: dress.color as string | null,
    description: dress.description as string | null,
  });

  return {
    name: String(dress.name ?? ''),
    price: Number(dress.price ?? 0),
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
  const liveImages = Array.isArray(dress.images) ? dress.images.map(String) : [];
  const liveColor = getDressColorFromRow({
    color: dress.color as string | null,
    description: dress.description as string | null,
  });

  if (!pending || typeof pending !== 'object') {
    return {
      name: String(dress.name ?? ''),
      price: Number(dress.price ?? 0),
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
    images: pending.images?.length ? pending.images.map(String) : liveImages,
  };
}

export function mapOwnedDressForEdit(row: Record<string, unknown>) {
  const pending = row.pending_update as PendingUpdatePayload | null | undefined;
  const snapshot = getLiveDressSnapshot(row);

  return {
    id: String(row.id),
    name: snapshot.name,
    price: snapshot.price,
    size: snapshot.size,
    city: snapshot.city,
    color: snapshot.color,
    description: snapshot.description,
    status: String(row.status),
    images: snapshot.images,
    rental_count: Number(row.rental_count || 0),
    has_pending_update: Boolean(pending),
    booked_dates: [] as string[],
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
    price: Number(updates.price ?? base.price ?? 0),
    size: String(updates.size ?? base.size ?? '').trim(),
    city: String(updates.city ?? base.city ?? '').trim(),
    color: submittedColor || base.color || '',
    description: String(updates.description ?? base.description ?? '').trim(),
    images: Array.isArray(updates.images)
      ? updates.images.map(String)
      : base.images,
    event_type: String(updates.event_type ?? dress.event_type ?? '').trim() || undefined,
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
    price: payload.price,
    size: payload.size,
    city: payload.city,
    color: payload.color,
    description: payload.description,
    images: payload.images,
    event_type: payload.event_type || '',
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
