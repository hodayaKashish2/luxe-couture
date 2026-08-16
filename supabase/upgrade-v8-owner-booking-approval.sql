-- אישור משכירה לפני תשלום + תזכורות ומועד תגובה

alter table public.bookings add column if not exists owner_response_deadline timestamptz;
alter table public.bookings add column if not exists owner_reminder_sent_at timestamptz;
alter table public.bookings add column if not exists owner_responded_at timestamptz;
alter table public.bookings add column if not exists owner_reject_reason text;

alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status in (
    'pending_owner_approval',
    'pending_payment',
    'awaiting_admin_approval',
    'confirmed',
    'cancelled',
    'failed'
  ));
