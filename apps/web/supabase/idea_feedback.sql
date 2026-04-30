create table if not exists public.idea_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_title text not null,
  feedback text not null check (feedback in ('thumbs_up', 'thumbs_down')),
  created_at timestamptz not null default now(),
  unique (user_id, idea_title)
);

alter table public.idea_feedback enable row level security;

create policy "idea_feedback_select_own"
  on public.idea_feedback
  for select
  using (auth.uid() = user_id);

create policy "idea_feedback_insert_own"
  on public.idea_feedback
  for insert
  with check (auth.uid() = user_id);

create policy "idea_feedback_update_own"
  on public.idea_feedback
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
