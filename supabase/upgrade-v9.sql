alter table public.dresses add column if not exists pending_update jsonb;
alter table public.dresses add column if not exists pending_update_submitted_at timestamptz;

create index if not exists dresses_pending_update_idx
  on public.dresses (pending_update_submitted_at desc)
  where pending_update is not null;
