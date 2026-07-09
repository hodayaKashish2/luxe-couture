-- תיקון כפילויות אימייל/טלפון + אינדקס ייחודי
-- Supabase → SQL Editor → Run (פעם אחת)
--
-- כפילויות קיימות: נשאר החשבון הישן ביותר (created_at),
-- בחשבונות כפולים — האימייל/טלפון מתאפסים (התחברות עדיין עם שם משתמש).

-- 1) איחוד פורמט טלפון ל-0XXXXXXXXX
update public.site_users
set phone = case
  when length(regexp_replace(phone, '\D', '', 'g')) >= 12
    and left(regexp_replace(phone, '\D', '', 'g'), 3) = '972' then
    '0' || substring(regexp_replace(phone, '\D', '', 'g') from 4)
  when left(regexp_replace(phone, '\D', '', 'g'), 1) = '0' then
    regexp_replace(phone, '\D', '', 'g')
  else phone
end
where trim(phone) <> '';

-- 2) ניקוי אימיילים כפולים (שומרים את החשבון הראשון)
with ranked_emails as (
  select
    id,
    row_number() over (
      partition by lower(trim(email))
      order by created_at asc, id asc
    ) as rn
  from public.site_users
  where trim(email) <> ''
)
update public.site_users u
set email = ''
from ranked_emails r
where u.id = r.id
  and r.rn > 1;

-- 3) ניקוי טלפונים כפולים (שומרים את החשבון הראשון)
with ranked_phones as (
  select
    id,
    row_number() over (
      partition by regexp_replace(phone, '\D', '', 'g')
      order by created_at asc, id asc
    ) as rn
  from public.site_users
  where trim(phone) <> ''
)
update public.site_users u
set phone = ''
from ranked_phones r
where u.id = r.id
  and r.rn > 1;

-- 4) אינדקס ייחודי לאימייל
drop index if exists site_users_email_unique;
create unique index site_users_email_unique
  on public.site_users (lower(trim(email)))
  where email <> '';

-- 5) אינדקס ייחודי לטלפון (לפי ספרות בלבד)
drop index if exists site_users_phone_unique;
create unique index site_users_phone_unique
  on public.site_users (regexp_replace(phone, '\D', '', 'g'))
  where phone <> '';

notify pgrst, 'reload schema';

-- 6) דוח: כמה כפילויות נשארו (אמור להיות 0)
select
  (select count(*) from (
    select lower(trim(email)) as e
    from public.site_users
    where trim(email) <> ''
    group by 1 having count(*) > 1
  ) x) as duplicate_emails_left,
  (select count(*) from (
    select regexp_replace(phone, '\D', '', 'g') as p
    from public.site_users
    where trim(phone) <> ''
    group by 1 having count(*) > 1
  ) y) as duplicate_phones_left;
