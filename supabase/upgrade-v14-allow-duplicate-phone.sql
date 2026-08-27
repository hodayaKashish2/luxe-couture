-- Allow multiple site_users accounts with the same phone (login stays username + password).
drop index if exists public.site_users_phone_unique;

create index if not exists site_users_phone_idx
  on public.site_users (regexp_replace(phone, '\D', '', 'g'))
  where phone is not null and trim(phone) <> '';
