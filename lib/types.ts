export type Dress = {
  id: string;
  name: string;
  price: number;
  size: string;
  condition: string;
  images: string[];
  description: string;
  city: string;
  color: string;
  event_type: string;
  owner_name: string;
  owner_phone: string;
  owner_email?: string;
  deposit: number;
  pickup_method: string;
  booked_dates: string[];
  rental_count: number;
  rating_avg: number;
  rating_count: number;
  featured_boost?: number;
  featured_until?: string | null;
  created_at?: string;
  includes_dry_cleaning: boolean;
};

export type DressRating = {
  id: string;
  dress_id: string;
  customer_name: string;
  stars: number;
  review_text: string;
  created_at: string;
};

export type Review = {
  id: string;
  name: string;
  role: string;
  text: string;
  stars: number;
};

export type SortOption = 'recommended' | 'popular' | 'newest' | 'price-asc' | 'price-desc';

export const EVENT_TYPES = [
  'חתונה',
  'בר/בת מצווה',
  'שבת חתן',
  'ערב משפחתי',
  'אחר',
] as const;

export const PICKUP_METHODS = [
  { value: 'pickup', label: 'איסוף עצמי' },
  { value: 'delivery', label: 'משלוח (בתיאום)' },
  { value: 'both', label: 'איסוף או משלוח' },
] as const;
