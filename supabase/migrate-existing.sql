-- הריצי ב-Supabase SQL Editor על הפרויקט הקיים שלך

alter table public.dresses
  add column if not exists condition text not null default 'new';

alter table public.dresses
  add column if not exists status text not null default 'pending';

alter table public.dresses
  drop constraint if exists dresses_status_check;

alter table public.dresses
  add constraint dresses_status_check
  check (status in ('pending', 'approved', 'rejected'));

-- שמלות קיימות יוצגו באתר
update public.dresses
set status = 'approved'
where status is null or status = 'pending';

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
