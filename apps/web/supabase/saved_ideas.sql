create table if not exists public.saved_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  niche text not null default '',
  trend text not null default '',
  hook text not null default '',
  angle text not null default '',
  idea text not null default '',
  script text not null default '',
  hashtags jsonb not null default '[]'::jsonb,
  optimized_title text not null default '',
  seo_description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists saved_ideas_user_id_created_at_idx
  on public.saved_ideas(user_id, created_at desc);

alter table public.saved_ideas enable row level security;

create policy if not exists "saved_ideas_select_own"
  on public.saved_ideas
  for select
  using (auth.uid() = user_id);

create policy if not exists "saved_ideas_insert_own"
  on public.saved_ideas
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "saved_ideas_delete_own"
  on public.saved_ideas
  for delete
  using (auth.uid() = user_id);
