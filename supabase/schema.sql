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
create policy "Users can view own boards"
  on boards for select
  using (auth.uid() = owner_id);

-- Allow authenticated users to create boards
create policy "Users can create boards"
  on boards for insert
  with check (auth.uid() = owner_id);

-- Allow owners to update their boards
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

create policy "Anyone can view canvas state"
  on canvas_state for select
  using (true);

create policy "Authenticated users can upsert canvas state"
  on canvas_state for insert
  with check (auth.uid() is not null);

create policy "Authenticated users can update canvas state"
  on canvas_state for update
  using (auth.uid() is not null);

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

create policy "Anyone can view cursors"
  on cursors for select
  using (true);

create policy "Users can upsert their cursor"
  on cursors for insert
  with check (auth.uid() = user_id);

create policy "Users can update their cursor"
  on cursors for update
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ENABLE REALTIME
-- ─────────────────────────────────────────────────────────────────────────────
-- Run these in Supabase Dashboard > Database > Replication, or uncomment:
-- alter publication supabase_realtime add table cursors;
-- alter publication supabase_realtime add table canvas_state;

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

create trigger boards_updated_at
  before update on boards
  for each row execute function update_updated_at();

create trigger canvas_state_updated_at
  before update on canvas_state
  for each row execute function update_updated_at();

create trigger cursors_updated_at
  before update on cursors
  for each row execute function update_updated_at();
