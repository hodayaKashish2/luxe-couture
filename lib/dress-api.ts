import type { Dress } from '@/lib/types';

export function normalizeDress(dress: Dress): Dress {
  return {
    ...dress,
    id: String(dress.id),
    price: Number(dress.price),
    images: Array.isArray(dress.images) ? dress.images : [],
    city: dress.city || '',
    color: dress.color || '',
    event_type: dress.event_type || '',
    owner_name: dress.owner_name || '',
    owner_phone: dress.owner_phone || '',
    deposit: Number(dress.deposit || 0),
    pickup_method: dress.pickup_method || 'pickup',
    includes_dry_cleaning: Boolean(dress.includes_dry_cleaning),
    booked_dates: Array.isArray(dress.booked_dates) ? dress.booked_dates : [],
    rental_count: Number(dress.rental_count || 0),
    rating_avg: Number(dress.rating_avg || 0),
    rating_count: Number(dress.rating_count || 0),
    created_at: dress.created_at,
  };
}

export async function fetchDressById(id: string): Promise<Dress | null> {
  const res = await fetch('/api/dresses');
  if (!res.ok) return null;

  const data: Dress[] = await res.json();
  if (!Array.isArray(data)) return null;

  const dress = data.find((item) => String(item.id) === String(id));
  return dress ? normalizeDress(dress) : null;
}

export function findDressInList(list: Dress[], id: string): Dress | null {
  const dress = list.find((item) => item.id === String(id));
  return dress ?? null;
}
