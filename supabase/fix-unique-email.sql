-- אימייל ייחודי לכל משתמשת (case-insensitive)
-- Supabase → SQL Editor → Run

create unique index if not exists site_users_email_unique
  on public.site_users (lower(trim(email)))
  where email <> '';

notify pgrst, 'reload schema';

select 'site_users email unique index created' as status;
