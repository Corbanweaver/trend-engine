create table if not exists public.api_rate_limits (
  rate_key text not null,
  action text not null,
  window_start timestamptz not null,
  window_seconds integer not null check (window_seconds > 0),
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now(),
  primary key (rate_key, action, window_start, window_seconds)
);

alter table public.api_rate_limits enable row level security;

drop policy if exists "api_rate_limits_no_client_access"
  on public.api_rate_limits;

create policy "api_rate_limits_no_client_access"
  on public.api_rate_limits
  for all
  to anon, authenticated
  using (false)
  with check (false);

revoke all on table public.api_rate_limits from anon, authenticated;
grant select, insert, update, delete on table public.api_rate_limits to service_role;

create or replace function public.consume_api_rate_limit(
  p_rate_key text,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz,
  used integer
)
language plpgsql
set search_path = public
as $$
declare
  v_now timestamptz := statement_timestamp();
  v_window_start timestamptz;
  v_used integer;
begin
  if p_rate_key is null or btrim(p_rate_key) = '' then
    raise exception 'rate key is required';
  end if;
  if p_action is null or btrim(p_action) = '' then
    raise exception 'rate action is required';
  end if;
  if p_limit <= 0 then
    raise exception 'rate limit must be positive';
  end if;
  if p_window_seconds <= 0 then
    raise exception 'rate window must be positive';
  end if;

  delete from public.api_rate_limits
    where window_start < v_now - interval '7 days';

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  insert into public.api_rate_limits (
    rate_key,
    action,
    window_start,
    window_seconds,
    count,
    updated_at
  )
  values (
    left(p_rate_key, 256),
    left(p_action, 128),
    v_window_start,
    p_window_seconds,
    1,
    v_now
  )
  on conflict (rate_key, action, window_start, window_seconds)
  do update
    set count = public.api_rate_limits.count + 1,
        updated_at = excluded.updated_at
  returning count into v_used;

  return query select
    v_used <= p_limit,
    greatest(0, p_limit - v_used),
    v_window_start + make_interval(secs => p_window_seconds),
    v_used;
end;
$$;

create or replace function public.consume_api_rate_limit_weighted(
  p_rate_key text,
  p_action text,
  p_cost integer,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz,
  used integer
)
language plpgsql
set search_path = public
as $$
declare
  v_now timestamptz := statement_timestamp();
  v_window_start timestamptz;
  v_used integer;
  v_cost integer;
begin
  if p_rate_key is null or btrim(p_rate_key) = '' then
    raise exception 'rate key is required';
  end if;

  if p_action is null or btrim(p_action) = '' then
    raise exception 'rate action is required';
  end if;

  if p_cost is null or p_cost <= 0 then
    raise exception 'rate cost must be positive';
  end if;

  if p_limit <= 0 then
    raise exception 'rate limit must be positive';
  end if;

  if p_window_seconds <= 0 then
    raise exception 'rate window must be positive';
  end if;

  v_cost := p_cost;
  delete from public.api_rate_limits
    where window_start < v_now - interval '7 days';

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  insert into public.api_rate_limits (
    rate_key,
    action,
    window_start,
    window_seconds,
    count,
    updated_at
  )
  values (
    left(p_rate_key, 256),
    left(p_action, 128),
    v_window_start,
    p_window_seconds,
    v_cost,
    v_now
  )
  on conflict (rate_key, action, window_start, window_seconds)
  do update
    set count = public.api_rate_limits.count + v_cost,
        updated_at = excluded.updated_at
  returning count into v_used;

  if v_used > p_limit then
    return query select
      false,
      greatest(0, p_limit - (v_used - v_cost)),
      v_window_start + make_interval(secs => p_window_seconds),
      v_used;
  end if;

  return query select
    true,
    greatest(0, p_limit - v_used),
    v_window_start + make_interval(secs => p_window_seconds),
    v_used;
end;
$$;

revoke execute on function public.consume_api_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
revoke execute on function public.consume_api_rate_limit_weighted(
  text,
  text,
  integer,
  integer,
  integer
) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, text, integer, integer)
  to service_role;
grant execute on function public.consume_api_rate_limit_weighted(
  text,
  text,
  integer,
  integer,
  integer
) to service_role;
