-- תיקון site_user_id בטבלת bookings (uuid במקום bigint)
-- Supabase → SQL Editor → Run

alter table public.bookings drop column if exists site_user_id;

alter table public.bookings
  add column site_user_id uuid references public.site_users(id) on delete set null;

create index if not exists bookings_site_user_idx on public.bookings (site_user_id);

notify pgrst, 'reload schema';

select 'bookings.site_user_id fixed to uuid' as status;
