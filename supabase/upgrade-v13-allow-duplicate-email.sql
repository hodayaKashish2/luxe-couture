-- Allow multiple site_users accounts with the same email (login stays username + password).
drop index if exists public.site_users_email_unique;

-- Optional: non-unique lookup index for emails
create index if not exists site_users_email_idx
  on public.site_users (lower(trim(email)))
  where email is not null and trim(email) <> '';
