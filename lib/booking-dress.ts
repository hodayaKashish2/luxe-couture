import type { Dress } from '@/lib/types';

export type BookingDressPayload = {
  dressId: number | string;
  dressName: string;
  dressPrice: number;
  dressSize?: string;
  dressCity?: string;
  dressColor?: string;
  dressImages?: string[];
};

export function dressFromBookingPayload(payload: BookingDressPayload): Dress {
  return {
    id: String(payload.dressId),
    name: payload.dressName || 'שמלה',
    price: Number(payload.dressPrice || 0),
    size: payload.dressSize || '—',
    city: payload.dressCity || '',
    color: payload.dressColor || '',
    images: Array.isArray(payload.dressImages) ? payload.dressImages : [],
    event_type: 'single',
    listing_type: 'rent',
    owner_name: '',
    owner_phone: '',
    owner_email: '',
    deposit: 0,
    pickup_method: 'pickup',
    includes_dry_cleaning: false,
    condition: '',
    description: '',
    booked_dates: [],
    rental_count: 0,
    rating_avg: 0,
    rating_count: 0,
  };
}
