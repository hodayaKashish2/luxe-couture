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
    .find((p) => p.startsWith('צבע:'));

  return part ? part.replace(/^צבע:\s*/, '').trim() : '';
}

export function buildEditFormFromDress(dress: {
  name: string;
  price: number;
  size: string;
  city: string;
  color?: string | null;
  description?: string | null;
}) {
  return {
    name: dress.name,
    price: String(dress.price),
    size: dress.size,
    city: dress.city,
    color: getDressColorFromRow(dress),
    description: getCleanDescription(String(dress.description || '')),
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
    color: pendingUpdate.color ?? String(dress.color ?? ''),
    description: pendingUpdate.description ?? String(dress.description ?? ''),
    images: pendingUpdate.images?.length ? pendingUpdate.images : Array.isArray(dress.images) ? dress.images.map(String) : [],
    isPendingUpdate: true as const,
  };
}

export function buildPendingUpdatePayload(
  dress: Record<string, unknown>,
  updates: Record<string, unknown>
): PendingUpdatePayload {
  return {
    name: String(updates.name ?? dress.name ?? '').trim(),
    price: Number(updates.price ?? dress.price ?? 0),
    size: String(updates.size ?? dress.size ?? '').trim(),
    city: String(updates.city ?? dress.city ?? '').trim(),
    color: String(updates.color ?? dress.color ?? '').trim(),
    description: String(updates.description ?? dress.description ?? '').trim(),
    images: Array.isArray(updates.images)
      ? updates.images.map(String)
      : Array.isArray(dress.images)
        ? dress.images.map(String)
        : [],
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
