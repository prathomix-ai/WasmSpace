-- ─────────────────────────────────────────────────────────────────────────────
-- MasmSpace — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- BOARDS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists boards (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null default 'Untitled Board',
  owner_id    uuid references auth.users(id) on delete cascade,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table boards enable row level security;

-- Allow authenticated users to read boards they own
drop policy if exists "Users can view own boards" on boards;
create policy "Users can view own boards"
  on boards for select
  using (auth.uid() = owner_id);

-- Allow authenticated users to create boards
drop policy if exists "Users can create boards" on boards;
create policy "Users can create boards"
  on boards for insert
  with check (auth.uid() = owner_id);

-- Allow owners to update their boards
drop policy if exists "Users can update own boards" on boards;
create policy "Users can update own boards"
  on boards for update
  using (auth.uid() = owner_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- CANVAS STATE
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists canvas_state (
  id          uuid primary key default uuid_generate_v4(),
  board_id    uuid references boards(id) on delete cascade unique,
  state       jsonb not null default '{}',
  updated_at  timestamptz default now()
);

alter table canvas_state enable row level security;

drop policy if exists "Anyone can view canvas state" on canvas_state;
create policy "Anyone can view canvas state"
  on canvas_state for select
  using (true);

drop policy if exists "Authenticated users can upsert canvas state" on canvas_state;
create policy "Authenticated users can upsert canvas state"
  on canvas_state for insert
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update canvas state" on canvas_state;
create policy "Authenticated users can update canvas state"
  on canvas_state for update
  using (auth.uid() is not null);

-- ─────────────────────────────────────────────────────────────────────────────
-- WORKSPACES (Auto-save canvas state table)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists workspaces (
  id           uuid primary key default uuid_generate_v4(),
  host_id      uuid references auth.users(id) on delete cascade,
  title        text default 'Untitled Workspace',
  canvas_state jsonb not null default '{}'::jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table workspaces enable row level security;

-- RLS: Users can select their own workspaces
drop policy if exists "Users can view own workspaces" on workspaces;
create policy "Users can view own workspaces"
  on workspaces for select
  using (auth.uid() = host_id);

-- RLS: Users can create their own workspaces
drop policy if exists "Users can create own workspaces" on workspaces;
create policy "Users can create own workspaces"
  on workspaces for insert
  with check (auth.uid() = host_id);

-- RLS: Users can update their own workspaces
drop policy if exists "Users can update own workspaces" on workspaces;
create policy "Users can update own workspaces"
  on workspaces for update
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

-- RLS: Users can delete their own workspaces
drop policy if exists "Users can delete own workspaces" on workspaces;
create policy "Users can delete own workspaces"
  on workspaces for delete
  using (auth.uid() = host_id);

create index if not exists idx_workspaces_host_id on workspaces(host_id);
create index if not exists idx_workspaces_updated_at on workspaces(updated_at desc);


-- ─────────────────────────────────────────────────────────────────────────────
-- CURSORS (ephemeral — real-time only, not persisted long-term)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists cursors (
  id          uuid primary key default uuid_generate_v4(),
  board_id    uuid references boards(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  x           float8 not null default 0,
  y           float8 not null default 0,
  color       text not null default '#00f5ff',
  name        text not null default 'Anonymous',
  updated_at  timestamptz default now(),
  unique(board_id, user_id)
);

alter table cursors enable row level security;

drop policy if exists "Anyone can view cursors" on cursors;
create policy "Anyone can view cursors"
  on cursors for select
  using (true);

drop policy if exists "Users can upsert their cursor" on cursors;
create policy "Users can upsert their cursor"
  on cursors for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their cursor" on cursors;
create policy "Users can update their cursor"
  on cursors for update
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- HELPER: auto-update updated_at
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists boards_updated_at on boards;
create trigger boards_updated_at
  before update on boards
  for each row execute function update_updated_at();

drop trigger if exists canvas_state_updated_at on canvas_state;
create trigger canvas_state_updated_at
  before update on canvas_state
  for each row execute function update_updated_at();

drop trigger if exists workspaces_updated_at on workspaces;
create trigger workspaces_updated_at
  before update on workspaces
  for each row execute function update_updated_at();

drop trigger if exists cursors_updated_at on cursors;
create trigger cursors_updated_at
  before update on cursors
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- REALTIME REPLICATION (Safe block)
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  alter publication supabase_realtime add table cursors;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table canvas_state;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table workspaces;
exception when others then null;
end $$;

