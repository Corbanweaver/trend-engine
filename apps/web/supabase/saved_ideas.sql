create table if not exists public.saved_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  save_key text not null default gen_random_uuid()::text,
  idea_title text not null default '',
  idea_content text not null default '',
  thumbnail_url text not null default '',
  niche text not null default '',
  created_at timestamptz not null default now()
);

alter table public.saved_ideas
  add column if not exists thumbnail_url text not null default '',
  add column if not exists save_key text not null default gen_random_uuid()::text;

create index if not exists saved_ideas_user_id_created_at_idx
  on public.saved_ideas(user_id, created_at desc);

create unique index if not exists saved_ideas_user_id_save_key_idx
  on public.saved_ideas(user_id, save_key);

alter table public.saved_ideas enable row level security;

drop policy if exists "Users can only see their own ideas"
  on public.saved_ideas;

drop policy if exists "saved_ideas_select_own"
  on public.saved_ideas;

create policy "saved_ideas_select_own"
  on public.saved_ideas
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "saved_ideas_insert_own"
  on public.saved_ideas;

create policy "saved_ideas_insert_own"
  on public.saved_ideas
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "saved_ideas_update_own"
  on public.saved_ideas;

create policy "saved_ideas_update_own"
  on public.saved_ideas
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "saved_ideas_delete_own"
  on public.saved_ideas;

create policy "saved_ideas_delete_own"
  on public.saved_ideas
  for delete
  using ((select auth.uid()) = user_id);
