-- אישור תשלום ידני (ביט / העברה בנקאית) + שמירת אמצעי תשלום

alter table public.bookings add column if not exists payment_method text;
alter table public.bookings add column if not exists payment_reported_at timestamptz;

alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in ('pending_payment', 'awaiting_admin_approval', 'confirmed', 'cancelled', 'failed'));
