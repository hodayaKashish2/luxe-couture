-- ============================================================
-- תיקון טבלת משתמשות (site_users) — הריצי את כל הקובץ בבת אחת
-- Supabase → SQL Editor → New query → הדביקי → Run
-- ============================================================
-- אזהרה: מוחק משתמשות קיימות בטבלה (אם יש) ויוצר מחדש נכון.
-- אחרי ההרצה — הרשמי מחדש באתר.
-- ============================================================

create extension if not exists "pgcrypto";

drop table if exists public.site_users cascade;

create table public.site_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  display_name text not null default '',
  phone text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);

create index site_users_username_idx on public.site_users (username);

create unique index site_users_email_unique
  on public.site_users (lower(trim(email)))
  where email <> '';

create unique index site_users_phone_unique
  on public.site_users (regexp_replace(phone, '\D', '', 'g'))
  where phone <> '';

alter table public.site_users disable row level security;

grant usage on schema public to postgres, service_role, anon, authenticated;
grant all on table public.site_users to postgres, service_role;

-- רענון cache של Supabase API (חשוב!)
notify pgrst, 'reload schema';

-- בדיקה
select 'site_users OK' as status, count(*) as users from public.site_users;
