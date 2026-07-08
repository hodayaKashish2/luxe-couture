-- הריצי את הקובץ הזה ב-Supabase: SQL Editor → New query → Run

create extension if not exists "pgcrypto";

create table if not exists public.dresses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null check (price >= 0),
  size text not null,
  condition text not null default 'new',
  description text not null default '',
  images text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists dresses_status_created_idx
  on public.dresses (status, created_at desc);

alter table public.dresses enable row level security;

drop policy if exists "Public read approved dresses" on public.dresses;
create policy "Public read approved dresses"
  on public.dresses
  for select
  using (status = 'approved');

insert into storage.buckets (id, name, public)
values ('dress-images', 'dress-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read dress images" on storage.objects;
create policy "Public read dress images"
  on storage.objects
  for select
  using (bucket_id = 'dress-images');
