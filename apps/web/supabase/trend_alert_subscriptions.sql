create table if not exists public.trend_alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  niche text not null,
  created_at timestamptz not null default now(),
  unique (user_id, niche)
);

create index if not exists trend_alert_subscriptions_user_id_idx
  on public.trend_alert_subscriptions(user_id);

alter table public.trend_alert_subscriptions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'trend_alert_subscriptions'
      and policyname = 'trend_alert_subscriptions_select_own'
  ) then
    create policy "trend_alert_subscriptions_select_own"
      on public.trend_alert_subscriptions
      for select
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'trend_alert_subscriptions'
      and policyname = 'trend_alert_subscriptions_insert_own'
  ) then
    create policy "trend_alert_subscriptions_insert_own"
      on public.trend_alert_subscriptions
      for insert
      to authenticated
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'trend_alert_subscriptions'
      and policyname = 'trend_alert_subscriptions_delete_own'
  ) then
    create policy "trend_alert_subscriptions_delete_own"
      on public.trend_alert_subscriptions
      for delete
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end $$;
