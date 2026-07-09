-- מחיקת חשבונות בלבד (ללא שמלות/שריונות)
-- לאיפוס מלא השתמשי ב-reset-all-site-data.sql

delete from public.site_users;

drop index if exists site_users_email_unique;
create unique index site_users_email_unique
  on public.site_users (lower(trim(email)))
  where email <> '';

drop index if exists site_users_phone_unique;
create unique index site_users_phone_unique
  on public.site_users (regexp_replace(phone, '\D', '', 'g'))
  where phone <> '';

notify pgrst, 'reload schema';

select 'חשבונות נמחקו' as status, count(*) as users_left from public.site_users;
