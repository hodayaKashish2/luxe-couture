-- תאריך הסרת שמלה מהאתר (לתצוגה 30 יום ואז הסתרה)
alter table public.dresses add column if not exists removed_at timestamptz;

update public.dresses
set removed_at = created_at
where status = 'removed' and removed_at is null;
