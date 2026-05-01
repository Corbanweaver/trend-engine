create table if not exists public.saved_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_title text not null default '',
  idea_content text not null default '',
  thumbnail_url text not null default '',
  niche text not null default '',
  created_at timestamptz not null default now()
);

alter table public.saved_ideas
  add column if not exists thumbnail_url text not null default '';

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
