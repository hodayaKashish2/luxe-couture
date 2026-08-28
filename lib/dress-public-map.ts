import { normalizeDressKind, normalizeListingType } from '@/lib/dress-listing';
import { normalizeDressLength, normalizeDressStyle } from '@/lib/dress-style-length';
import { getDressColorFromRow, normalizeDressImages } from '@/lib/dress-pending-update';

export function mapPublicDressRow(row: Record<string, unknown>, bookedDates: string[] = []) {
  const ratingCount = Number(row.rating_count || 0);
  const ratingSum = Number(row.rating_sum || 0);
  const ratingAvg = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0;
  const color = getDressColorFromRow({
    color: row.color as string | null,
    description: row.description as string | null,
  });

  return {
    id: String(row.id),
    name: row.name,
    price: Number(row.price),
    size: row.size,
    condition: row.condition,
    description: row.description,
    images: normalizeDressImages(row.images),
    city: row.city || '',
    color,
    event_type: normalizeDressKind(String(row.event_type || '')),
    dress_style: normalizeDressStyle(String(row.dress_style || '')),
    dress_length: normalizeDressLength(String(row.dress_length || '')),
    listing_type: normalizeListingType(String(row.listing_type || 'rent')),
    owner_name: row.owner_name || '',
    owner_phone: row.owner_phone || '',
    owner_email: row.owner_email || '',
    deposit: Number(row.deposit || 0),
    pickup_method: row.pickup_method || 'pickup',
    includes_dry_cleaning: Boolean(row.includes_dry_cleaning),
    booked_dates: bookedDates,
    rental_count: Number(row.rental_count || 0),
    rating_avg: ratingAvg,
    rating_count: ratingCount,
    featured_boost: Number(row.featured_boost || 0),
    featured_until: row.featured_until || null,
    created_at: row.created_at,
  };
}
