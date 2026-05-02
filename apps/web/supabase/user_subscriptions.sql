create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'creator', 'pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_status text not null default 'free',
  analyses_used_this_month integer not null default 0 check (analyses_used_this_month >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_subscriptions
  add column if not exists stripe_subscription_status text not null default 'free';

create unique index if not exists user_subscriptions_stripe_customer_id_idx
  on public.user_subscriptions(stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists user_subscriptions_stripe_subscription_id_idx
  on public.user_subscriptions(stripe_subscription_id)
  where stripe_subscription_id is not null;

create or replace function public.set_user_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_subscriptions_updated_at on public.user_subscriptions;
create trigger set_user_subscriptions_updated_at
before update on public.user_subscriptions
for each row
execute function public.set_user_subscriptions_updated_at();

alter table public.user_subscriptions enable row level security;

drop policy if exists "user_subscriptions_select_own"
  on public.user_subscriptions;

create policy "user_subscriptions_select_own"
  on public.user_subscriptions
  for select
  using (auth.uid() = user_id);

drop policy if exists "user_subscriptions_insert_own"
  on public.user_subscriptions;

create policy "user_subscriptions_insert_own"
  on public.user_subscriptions
  for insert
  with check (
    auth.uid() = user_id
    and plan = 'free'
    and stripe_customer_id is null
    and stripe_subscription_id is null
    and stripe_subscription_status = 'free'
    and analyses_used_this_month = 0
  );

create or replace function public.prevent_user_subscription_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' then
    if new.user_id is distinct from old.user_id
      or new.plan is distinct from old.plan
      or new.stripe_customer_id is distinct from old.stripe_customer_id
      or new.stripe_subscription_id is distinct from old.stripe_subscription_id
      or new.stripe_subscription_status is distinct from old.stripe_subscription_status
    then
      raise exception 'Subscription plan and Stripe fields can only be changed by trusted server code.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_user_subscription_tampering on public.user_subscriptions;
create trigger prevent_user_subscription_tampering
before update on public.user_subscriptions
for each row
execute function public.prevent_user_subscription_tampering();

drop policy if exists "user_subscriptions_update_own"
  on public.user_subscriptions;

drop policy if exists "user_subscriptions_update_own_usage"
  on public.user_subscriptions;

create policy "user_subscriptions_update_own_usage"
  on public.user_subscriptions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional backfill: create a default free subscription row for any existing auth user.
insert into public.user_subscriptions (user_id, plan, analyses_used_this_month)
select id, 'free', 0
from auth.users
on conflict (user_id) do nothing;
