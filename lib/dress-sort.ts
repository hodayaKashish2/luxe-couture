import type { Dress } from '@/lib/types';

const TOP_TIERS = 3;

/** דירוג TOP לפי מספר השכרות — TOP 1 = הכי הרבה השכרות */
export function getTopRentalRanks(dresses: Dress[]): Map<number, number> {
  const ranks = new Map<number, number>();
  const withRentals = dresses
    .filter((d) => (d.rental_count || 0) > 0)
    .sort((a, b) => (b.rental_count || 0) - (a.rental_count || 0));

  let tier = 0;
  let prevCount: number | null = null;

  for (const dress of withRentals) {
    const count = dress.rental_count || 0;
    if (count !== prevCount) {
      tier += 1;
      prevCount = count;
      if (tier > TOP_TIERS) break;
    }
    if (tier <= TOP_TIERS) {
      ranks.set(dress.id, tier);
    }
  }

  return ranks;
}

/** מיון קטלוג — מחיר קודם כשממיינים לפי מחיר, אחרת הכי מושכרות / חדש */
export function compareDresses(a: Dress, b: Dress, sortBy: string) {
  if (sortBy === 'price-asc') {
    const priceDiff = a.price - b.price;
    if (priceDiff !== 0) return priceDiff;
    return (b.rental_count || 0) - (a.rental_count || 0);
  }

  if (sortBy === 'price-desc') {
    const priceDiff = b.price - a.price;
    if (priceDiff !== 0) return priceDiff;
    return (b.rental_count || 0) - (a.rental_count || 0);
  }

  if (sortBy === 'newest') {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    const timeDiff = bTime - aTime;
    if (timeDiff !== 0) return timeDiff;
    return (b.rental_count || 0) - (a.rental_count || 0);
  }

  const rentalDiff = (b.rental_count || 0) - (a.rental_count || 0);
  if (rentalDiff !== 0) return rentalDiff;
  return 0;
}

export function toggleFilterValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}
