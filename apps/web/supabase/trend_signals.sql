create table if not exists public.trend_signals (
  id text primary key,
  platform text not null check (platform in ('youtube', 'tiktok', 'instagram', 'pinterest', 'x', 'reddit')),
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

create index if not exists idx_trend_signals_lookup
  on public.trend_signals (platform, niche, query, fetched_at desc);

create index if not exists idx_trend_signals_platform_fetched
  on public.trend_signals (platform, fetched_at desc);

alter table public.trend_signals enable row level security;

-- No anon/authenticated policies are added intentionally.
-- The FastAPI backend writes through DATABASE_URL; customers should not read raw scraped rows directly.
