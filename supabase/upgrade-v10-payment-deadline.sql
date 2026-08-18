-- מועד אחרון לתשלום אחרי אישור משכירה (7 ימים)

alter table public.bookings add column if not exists payment_deadline timestamptz;

update public.bookings
set payment_deadline = owner_responded_at + interval '7 days'
where status = 'pending_payment'
  and payment_deadline is null
  and owner_responded_at is not null;
