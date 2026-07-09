-- שדות ליצירת קשר עם משכירה (לאחר אישור שמלה)
alter table public.dresses add column if not exists owner_email text not null default '';
alter table public.dresses add column if not exists submitter_user_id uuid references public.site_users(id) on delete set null;

create index if not exists dresses_submitter_user_idx on public.dresses (submitter_user_id);

notify pgrst, 'reload schema';
