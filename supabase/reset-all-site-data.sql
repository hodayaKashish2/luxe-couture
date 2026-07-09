-- ============================================================
-- איפוס מלא לפני פרסום האתר
-- Supabase → SQL Editor → הדביקי הכל → Run
-- ============================================================
-- מוחק: חשבונות, שמלות, שריונות, דירוגים, תגובות
-- תמונות: לא ניתן למחוק ב-SQL — ראי שלב 2 למטה
-- ============================================================

do $reset$
begin
  if to_regclass('public.dress_ratings') is not null then
    delete from public.dress_ratings;
  end if;
  if to_regclass('public.bookings') is not null then
    delete from public.bookings;
  end if;
  if to_regclass('public.reviews') is not null then
    delete from public.reviews;
  end if;
  if to_regclass('public.dresses') is not null then
    delete from public.dresses;
  end if;
  if to_regclass('public.site_users') is not null then
    delete from public.site_users;
  end if;
end $reset$;

drop index if exists site_users_email_unique;
create unique index site_users_email_unique
  on public.site_users (lower(trim(email)))
  where email <> '';

drop index if exists site_users_phone_unique;
create unique index site_users_phone_unique
  on public.site_users (regexp_replace(phone, '\D', '', 'g'))
  where phone <> '';

notify pgrst, 'reload schema';

select
  (select count(*) from public.site_users) as users_left,
  (select count(*) from public.dresses) as dresses_left,
  (select count(*) from public.bookings) as bookings_left;
