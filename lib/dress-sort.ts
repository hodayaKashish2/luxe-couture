import type { Dress } from '@/lib/types';

/** תמיד קודם לפי מספר השכרות — ואז לפי המיון שנבחר */
export function compareDresses(a: Dress, b: Dress, sortBy: string) {
  const rentalDiff = (b.rental_count || 0) - (a.rental_count || 0);
  if (rentalDiff !== 0) return rentalDiff;

  if (sortBy === 'price-asc') return a.price - b.price;
  if (sortBy === 'price-desc') return b.price - a.price;
  if (sortBy === 'newest') {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  }

  return 0;
}
