create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'creator', 'pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_status text not null default 'free',
  stripe_cancel_at_period_end boolean not null default false,
  stripe_current_period_end timestamptz,
  analyses_used_this_month integer not null default 0 check (analyses_used_this_month >= 0),
  credits_used_this_month integer not null default 0 check (credits_used_this_month >= 0),
  credits_reset_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_subscriptions
  add column if not exists stripe_subscription_status text not null default 'free';

alter table public.user_subscriptions
  add column if not exists stripe_cancel_at_period_end boolean not null default false,
  add column if not exists stripe_current_period_end timestamptz;

alter table public.user_subscriptions
  add column if not exists credits_used_this_month integer not null default 0
    check (credits_used_this_month >= 0),
  add column if not exists credits_reset_at timestamptz not null default now();

create unique index if not exists user_subscriptions_stripe_customer_id_idx
  on public.user_subscriptions(stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists user_subscriptions_stripe_subscription_id_idx
  on public.user_subscriptions(stripe_subscription_id)
  where stripe_subscription_id is not null;

create or replace function public.set_user_subscriptions_updated_at()
returns trigger
language plpgsql
set search_path = public
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
  using ((select auth.uid()) = user_id);

drop policy if exists "user_subscriptions_insert_own"
  on public.user_subscriptions;

create policy "user_subscriptions_insert_own"
  on public.user_subscriptions
  for insert
  with check (
    (select auth.uid()) = user_id
    and plan = 'free'
    and stripe_customer_id is null
    and stripe_subscription_id is null
    and stripe_subscription_status = 'free'
    and stripe_cancel_at_period_end = false
    and stripe_current_period_end is null
    and analyses_used_this_month = 0
    and credits_used_this_month = 0
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
      or new.stripe_cancel_at_period_end is distinct from old.stripe_cancel_at_period_end
      or new.stripe_current_period_end is distinct from old.stripe_current_period_end
      or new.analyses_used_this_month is distinct from old.analyses_used_this_month
      or new.credits_used_this_month is distinct from old.credits_used_this_month
      or new.credits_reset_at is distinct from old.credits_reset_at
    then
      raise exception 'Subscription plan, Stripe fields, cancellation state, and usage can only be changed by trusted server code.';
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

revoke execute on function public.prevent_user_subscription_tampering() from public, anon, authenticated;

-- Optional backfill: create a default free subscription row for any existing auth user.
insert into public.user_subscriptions (user_id, plan, analyses_used_this_month)
select id, 'free', 0
from auth.users
on conflict (user_id) do nothing;

create or replace function public.credit_limit_for_plan(p_plan text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case
    when p_plan = 'pro' then 1800
    when p_plan = 'creator' then 600
    else 30
  end;
$$;

create or replace function public.effective_subscription_plan(
  p_plan text,
  p_stripe_subscription_id text,
  p_stripe_subscription_status text
)
returns text
language sql
stable
set search_path = public
as $$
  select case
    when p_plan not in ('creator', 'pro') then 'free'
    when p_stripe_subscription_id is null then p_plan
    when p_stripe_subscription_status in ('active', 'trialing', 'past_due') then p_plan
    else 'free'
  end;
$$;

create or replace function public.spend_user_credits(
  p_user_id uuid,
  p_cost integer,
  p_count_analysis boolean default false
)
returns table (
  plan text,
  credits_used integer,
  credits_limit integer,
  credits_remaining integer,
  analyses_used integer
)
language plpgsql
set search_path = public
as $$
declare
  v_row public.user_subscriptions%rowtype;
  v_plan text;
  v_limit integer;
begin
  if p_cost <= 0 then
    raise exception 'credit cost must be positive';
  end if;

  insert into public.user_subscriptions (
    user_id,
    plan,
    analyses_used_this_month,
    credits_used_this_month
  )
  values (p_user_id, 'free', 0, 0)
  on conflict (user_id) do nothing;

  select *
    into v_row
  from public.user_subscriptions
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'subscription row not found';
  end if;

  if date_trunc('month', v_row.credits_reset_at at time zone 'UTC')
    <> date_trunc('month', now() at time zone 'UTC') then
    update public.user_subscriptions
      set analyses_used_this_month = 0,
          credits_used_this_month = 0,
          credits_reset_at = now()
      where user_id = p_user_id
      returning * into v_row;
  end if;

  v_plan := public.effective_subscription_plan(
    v_row.plan,
    v_row.stripe_subscription_id,
    v_row.stripe_subscription_status
  );
  v_limit := public.credit_limit_for_plan(v_plan);

  if v_row.credits_used_this_month + p_cost > v_limit then
    raise exception 'insufficient_credits'
      using detail = format(
        'required=%s remaining=%s',
        p_cost,
        greatest(0, v_limit - v_row.credits_used_this_month)
      );
  end if;

  update public.user_subscriptions
    set credits_used_this_month = credits_used_this_month + p_cost,
        analyses_used_this_month =
          analyses_used_this_month + case when p_count_analysis then 1 else 0 end
    where user_id = p_user_id
    returning * into v_row;

  return query select
    v_plan,
    v_row.credits_used_this_month,
    v_limit,
    greatest(0, v_limit - v_row.credits_used_this_month),
    v_row.analyses_used_this_month;
end;
$$;

create or replace function public.refund_user_credits(
  p_user_id uuid,
  p_cost integer,
  p_count_analysis boolean default false
)
returns table (
  plan text,
  credits_used integer,
  credits_limit integer,
  credits_remaining integer,
  analyses_used integer
)
language plpgsql
set search_path = public
as $$
declare
  v_row public.user_subscriptions%rowtype;
  v_plan text;
  v_limit integer;
begin
  if p_cost <= 0 then
    raise exception 'credit cost must be positive';
  end if;

  update public.user_subscriptions
    set credits_used_this_month = greatest(0, credits_used_this_month - p_cost),
        analyses_used_this_month =
          greatest(0, analyses_used_this_month - case when p_count_analysis then 1 else 0 end)
    where user_id = p_user_id
    returning * into v_row;

  if not found then
    raise exception 'subscription row not found';
  end if;

  v_plan := public.effective_subscription_plan(
    v_row.plan,
    v_row.stripe_subscription_id,
    v_row.stripe_subscription_status
  );
  v_limit := public.credit_limit_for_plan(v_plan);

  return query select
    v_plan,
    v_row.credits_used_this_month,
    v_limit,
    greatest(0, v_limit - v_row.credits_used_this_month),
    v_row.analyses_used_this_month;
end;
$$;

revoke execute on function public.credit_limit_for_plan(text) from public, anon, authenticated;
revoke execute on function public.effective_subscription_plan(text, text, text) from public, anon, authenticated;
revoke execute on function public.spend_user_credits(uuid, integer, boolean) from public, anon, authenticated;
revoke execute on function public.refund_user_credits(uuid, integer, boolean) from public, anon, authenticated;

grant execute on function public.credit_limit_for_plan(text) to service_role;
grant execute on function public.effective_subscription_plan(text, text, text) to service_role;
grant execute on function public.spend_user_credits(uuid, integer, boolean) to service_role;
grant execute on function public.refund_user_credits(uuid, integer, boolean) to service_role;
