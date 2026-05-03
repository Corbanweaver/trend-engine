create table if not exists public.operational_events (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('info', 'warn', 'error')),
  source text not null,
  message text not null,
  user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists operational_events_created_at_idx
  on public.operational_events(created_at desc);

create index if not exists operational_events_level_created_at_idx
  on public.operational_events(level, created_at desc);

create index if not exists operational_events_user_id_idx
  on public.operational_events(user_id);

alter table public.operational_events enable row level security;

drop policy if exists "operational_events_no_client_access"
  on public.operational_events;

create policy "operational_events_no_client_access"
  on public.operational_events
  for all
  to anon, authenticated
  using (false)
  with check (false);

revoke all on table public.operational_events from anon, authenticated;
grant select, insert, update, delete on table public.operational_events to service_role;
