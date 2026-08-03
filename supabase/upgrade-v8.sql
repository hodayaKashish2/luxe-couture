-- דירוג אחד לכל משתמשת לכל שמלה
alter table public.dress_ratings add column if not exists rater_user_id uuid references public.site_users(id) on delete set null;

create unique index if not exists dress_ratings_one_per_user_idx
  on public.dress_ratings (dress_id, rater_user_id)
  where rater_user_id is not null;

create index if not exists dress_ratings_rater_user_idx
  on public.dress_ratings (rater_user_id, dress_id);
