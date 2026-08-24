-- סגנון: conservative | classic | modern
-- אורך: short | medium | long
alter table public.dresses add column if not exists dress_style text not null default 'classic';
alter table public.dresses add column if not exists dress_length text not null default 'long';

update public.dresses
set dress_style = 'classic', dress_length = 'long'
where dress_style is null
   or dress_length is null
   or trim(dress_style) = ''
   or trim(dress_length) = ''
   or dress_style not in ('conservative', 'classic', 'modern')
   or dress_length not in ('short', 'medium', 'long');

-- אורך: קצר (כל השאר — ארוך)
update public.dresses set dress_length = 'short'
where trim(name) in (
  'שמלת סאטן שחורה',
  'שמלת ערב אנגלס',
  'שמלת נקודות שושי יגודיוב',
  'שמלת קומות שושי יגודיוב'
);

-- סגנון: מודרני
update public.dresses set dress_style = 'modern'
where trim(name) in (
  'שמלת סאטן שחורה',
  'שמלת קורל',
  'שמלת אמילי'
);

-- סגנון: שמרני
update public.dresses set dress_style = 'conservative'
where trim(name) in (
  'שמלת טול',
  'טול',
  'שמלת ערב',
  'שמלת פרחים רייצל'
);
