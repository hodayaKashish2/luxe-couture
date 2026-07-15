-- דירוגי שמלות דורשים אישור מנהלת לפני פרסום

alter table public.dress_ratings add column if not exists status text;

update public.dress_ratings
set status = 'approved'
where status is null;

alter table public.dress_ratings alter column status set default 'pending';
alter table public.dress_ratings alter column status set not null;

alter table public.dress_ratings drop constraint if exists dress_ratings_status_check;
alter table public.dress_ratings add constraint dress_ratings_status_check
  check (status in ('pending', 'approved'));
