import type { DressUpdateDiff } from '@/lib/dress-pending-update';

export type AdminDressRow = {
  id: number;
  name: string;
  price: number;
  size: string;
  city: string;
  color?: string;
  description?: string;
  condition?: string;
  event_type?: string;
  listing_type?: string;
  deposit?: number;
  pickup_method?: string;
  includes_dry_cleaning?: boolean;
  owner_name: string;
  owner_phone?: string;
  owner_email?: string;
  images: string[];
  created_at: string;
  featured_boost?: number;
  featured_until?: string | null;
  rental_count?: number;
  rating_count?: number;
  pending_update_kind?: 'new' | 'update';
  update_diff?: DressUpdateDiff;
};

export type AdminSiteReview = {
  id: number;
  name: string;
  role: string;
  text: string;
  stars: number;
  status: string;
  created_at: string;
};

export type AdminPendingReview = AdminSiteReview;

export type AdminDressRatingRow = {
  id: number;
  dress_id: number;
  dress_name: string;
  customer_name: string;
  stars: number;
  review_text: string;
  status: string;
  created_at: string;
};

export type AdminBookingRow = {
  id: number;
  dress_id: number;
  dress_name?: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  event_date: string;
  status: string;
  amount_total?: number;
  payment_method?: string | null;
  created_at: string;
};

export type AdminOverview = {
  stats: {
    published: number;
    pendingDresses: number;
    featured: number;
    pendingReviews: number;
    pendingRatings: number;
    pendingPayments: number;
    approvedReviews: number;
    confirmedBookings: number;
  };
  pendingDresses: AdminDressRow[];
  pendingReviews: AdminPendingReview[];
  pendingRatings: AdminDressRatingRow[];
  pendingPayments: AdminBookingRow[];
  recentBookings: AdminBookingRow[];
  cities: string[];
};

export type AdminPaginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AdminDressSort =
  | 'newest'
  | 'oldest'
  | 'price_asc'
  | 'price_desc'
  | 'name'
  | 'rentals';

export type AdminTab =
  | 'overview'
  | 'catalog'
  | 'pending'
  | 'pending_payments'
  | 'pending_comments'
  | 'bookings'
  | 'emails';

export type AdminDressAction =
  | 'approve'
  | 'reject'
  | 'delete'
  | 'toggle_featured'
  | 'extend_featured';

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending_owner_approval: 'ממתין לאישור משכירה',
  pending_payment: 'ממתין לתשלום',
  awaiting_admin_approval: 'ממתין לאישור תשלום',
  confirmed: 'אושר',
  cancelled: 'בוטל',
  failed: 'נכשל',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bit: 'ביט',
  credit: 'אשראי',
  bank: 'העברה בנקאית',
};
