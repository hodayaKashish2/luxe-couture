-- Opt-in for marketing / site update emails (broadcast to registered users who agreed).
alter table public.site_users
  add column if not exists marketing_emails_opt_in boolean not null default false;

create index if not exists site_users_marketing_opt_in_idx
  on public.site_users (marketing_emails_opt_in)
  where marketing_emails_opt_in = true;
