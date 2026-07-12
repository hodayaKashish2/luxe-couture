import type { Dress } from '@/lib/types';

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
