import type { Dress } from '@/lib/types';

export const NEW_DRESS_BOOST_DAYS = 14;
export const FEATURED_REWARD_DAYS = 30;

export type DressFeaturedFields = {
  featured_boost?: number;
  featured_until?: string | null;
};

export type DressRankingFields = Pick<
  Dress,
  'rental_count' | 'rating_avg' | 'rating_count' | 'created_at'
> &
  DressFeaturedFields;

export type CatalogHighlight = 'new' | 'recommended' | 'in_demand';

function parseTime(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

/** פופולריות עם תקרה — אחרי כמה השכרות התוספת קטנה */
export function cappedPopularityScore(rentalCount: number) {
  const count = Math.max(0, rentalCount || 0);
  if (count === 0) return 0;
  return Math.min(15, Math.sqrt(count) * 4.5);
}

export function isNewInCatalog(dress: DressRankingFields, now = Date.now()) {
  const created = parseTime(dress.created_at);
  if (!created) return false;
  const ageDays = (now - created) / (1000 * 60 * 60 * 24);
  return ageDays <= NEW_DRESS_BOOST_DAYS;
}

export function hasActiveFeaturedBoost(dress: DressFeaturedFields, now = Date.now()) {
  if ((dress.featured_boost || 0) > 0) return true;
  const until = parseTime(dress.featured_until);
  return until > now;
}

export function getFeaturedBoostScore(dress: DressFeaturedFields, now = Date.now()) {
  let score = 0;

  const adminBoost = Math.max(0, dress.featured_boost || 0);
  score += Math.min(50, adminBoost * 0.5);

  const until = parseTime(dress.featured_until);
  if (until > now) {
    const daysLeft = (until - now) / (1000 * 60 * 60 * 24);
    score += Math.min(40, 20 + daysLeft);
  }

  return score;
}

export function getNewDressScore(dress: DressRankingFields, now = Date.now()) {
  const created = parseTime(dress.created_at);
  if (!created) return 0;
  const ageDays = (now - created) / (1000 * 60 * 60 * 24);
  if (ageDays > NEW_DRESS_BOOST_DAYS) return 0;
  return 35 * (1 - ageDays / NEW_DRESS_BOOST_DAYS);
}

export function getRatingScore(dress: DressRankingFields) {
  const count = dress.rating_count || 0;
  if (count <= 0) return 0;
  return (dress.rating_avg || 0) * 6;
}

/** ציון מומלצות לקטלוג — לא מבוסס רק על מספר השכרות */
export function getDressRecommendScore(dress: DressRankingFields, now = Date.now()) {
  return (
    getFeaturedBoostScore(dress, now) +
    getNewDressScore(dress, now) +
    getRatingScore(dress) +
    cappedPopularityScore(dress.rental_count || 0)
  );
}

export function getCatalogHighlight(
  dress: DressRankingFields,
  recommendScore?: number,
  now = Date.now()
): CatalogHighlight | null {
  if (isNewInCatalog(dress, now)) return 'new';
  const score = recommendScore ?? getDressRecommendScore(dress, now);
  if (score >= 45) return 'recommended';
  if ((dress.rental_count || 0) >= 2) return 'in_demand';
  return null;
}

export function getCatalogHighlights(
  dresses: Array<DressRankingFields & { id: string }>,
  now = Date.now()
): Map<string, CatalogHighlight> {
  const highlights = new Map<string, CatalogHighlight>();

  for (const dress of dresses) {
    const highlight = getCatalogHighlight(dress, undefined, now);
    if (highlight) highlights.set(dress.id, highlight);
  }

  return highlights;
}

export function formatFeaturedUntilDate(until?: string | null) {
  const time = parseTime(until);
  if (!time) return '';
  try {
    return new Date(time).toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}

/** מאריך חשיפה — מצטבר אם כבר פעילה */
export function extendFeaturedUntil(
  currentUntil?: string | null,
  days = FEATURED_REWARD_DAYS,
  now = Date.now()
) {
  const base = Math.max(now, parseTime(currentUntil));
  return new Date(base + days * 24 * 60 * 60 * 1000).toISOString();
}
