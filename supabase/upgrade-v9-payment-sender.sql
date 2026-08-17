-- upgrade-v9: פרטי מבצעת ההעברה בדיווח תשלום
alter table public.bookings add column if not exists payment_sender_name text;
alter table public.bookings add column if not exists payment_sender_phone text;
