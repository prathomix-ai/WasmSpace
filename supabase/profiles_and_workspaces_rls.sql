-- ─────────────────────────────────────────────────────────────────────────────
-- MasmSpace / PRATHOMIX — Strict Row Level Security (RLS) Migration
-- Enforces: auth.uid() = id on profiles, and auth.uid() = user_id on workspaces
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Ensure Table Exists: profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user',
  tier text not null default 'free',
  subscription_status text not null default 'free',
  is_pro boolean default false,
  pro_expiry_date timestamptz default null,
  used_promo_codes text[] default '{}',
  avatar_url text,
  full_name text,
  ai_usage_count int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure column exists on already created tables
alter table public.profiles add column if not exists ai_usage_count int not null default 0;

-- Atomic increment RPC function
create or replace function public.increment_ai_usage(p_user_id uuid)
returns int
language plpgsql
security definer
as $$
declare
  v_new_count int;
begin
  update public.profiles
  set ai_usage_count = coalesce(ai_usage_count, 0) + 1,
      updated_at = now()
  where id = p_user_id
  returning ai_usage_count into v_new_count;
  
  return coalesce(v_new_count, 1);
end;
$$;

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Drop existing overlapping policies to prevent conflicts
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;

-- Strict Profile Policies
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2. Ensure Table Exists: workspaces
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Workspace',
  description text,
  data jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on workspaces
alter table public.workspaces enable row level security;

-- Drop existing overlapping policies on workspaces
drop policy if exists "Users can view own workspaces" on public.workspaces;
drop policy if exists "Users can insert own workspaces" on public.workspaces;
drop policy if exists "Users can update own workspaces" on public.workspaces;
drop policy if exists "Users can delete own workspaces" on public.workspaces;

-- Strict Workspace Policies
create policy "Users can view own workspaces"
  on public.workspaces for select
  using (auth.uid() = user_id);

create policy "Users can insert own workspaces"
  on public.workspaces for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workspaces"
  on public.workspaces for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own workspaces"
  on public.workspaces for delete
  using (auth.uid() = user_id);
