-- listing_type: rent | sale (כל השמלות הקיימות — השכרה)
alter table public.dresses add column if not exists listing_type text not null default 'rent';

update public.dresses set listing_type = 'rent' where coalesce(listing_type, '') = '';

-- event_type משמש כעת לסוג פריט: single | set
update public.dresses
set event_type = 'single'
where event_type is null
   or trim(event_type) = ''
   or event_type not in ('single', 'set');
