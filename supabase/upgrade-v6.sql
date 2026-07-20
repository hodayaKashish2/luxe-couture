-- חשיפה מועדפת (מנהלת + תגמול אוטומטי אחרי השכרה דרך האתר)
alter table public.dresses add column if not exists featured_boost integer not null default 0 check (featured_boost >= 0 and featured_boost <= 100);
alter table public.dresses add column if not exists featured_until timestamptz;
