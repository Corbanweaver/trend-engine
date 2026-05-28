create table if not exists public.trend_signals (
  id text primary key,
  platform text not null check (platform in ('youtube', 'tiktok', 'instagram', 'pinterest', 'x', 'bluesky', 'threads', 'reddit')),
  niche text not null,
  query text not null,
  title text not null default '',
  text text not null default '',
  url text not null default '',
  thumbnail_url text not null default '',
  author text not null default '',
  engagement integer not null default 0,
  source text not null default 'live',
  raw_json jsonb not null,
  fetched_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'trend_signals_platform_check'
      and conrelid = 'public.trend_signals'::regclass
  ) then
    alter table public.trend_signals drop constraint trend_signals_platform_check;
  end if;

  alter table public.trend_signals
    add constraint trend_signals_platform_check
    check (platform in ('youtube', 'tiktok', 'instagram', 'pinterest', 'x', 'bluesky', 'threads', 'reddit'));
exception
  when duplicate_object then null;
end $$;

create index if not exists idx_trend_signals_lookup
  on public.trend_signals (platform, niche, query, fetched_at desc);

create index if not exists idx_trend_signals_platform_fetched
  on public.trend_signals (platform, fetched_at desc);

alter table public.trend_signals enable row level security;

-- No anon/authenticated policies are added intentionally.
-- The FastAPI backend writes through DATABASE_URL; customers should not read raw scraped rows directly.
