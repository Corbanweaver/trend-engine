create table if not exists public.email_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.email_waitlist enable row level security;

drop policy if exists "email_waitlist_admin_only"
  on public.email_waitlist;

create policy "email_waitlist_admin_only"
  on public.email_waitlist
  for all
  using (false)
  with check (false);
