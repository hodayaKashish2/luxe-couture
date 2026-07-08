create table if not exists public.site_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  display_name text not null default '',
  phone text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists site_users_username_idx on public.site_users (username);
