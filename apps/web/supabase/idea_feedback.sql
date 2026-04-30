create table if not exists public.idea_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trend text not null,
  idea_title text not null,
  rating text not null check (rating in ('up', 'down')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, trend, idea_title)
);

create or replace function public.set_idea_feedback_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_idea_feedback_updated_at on public.idea_feedback;
create trigger set_idea_feedback_updated_at
before update on public.idea_feedback
for each row
execute function public.set_idea_feedback_updated_at();

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
