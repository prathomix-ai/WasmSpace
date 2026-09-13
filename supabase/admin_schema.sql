-- ─────────────────────────────────────────────────────────────────────────────
-- MasmSpace SaaS: Admin Panel, Profiles & CMS Site Settings Schema
-- Execute in Supabase SQL Editor: Dashboard > SQL Editor > New Query
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null,
  role                text not null default 'user' check (role in ('user', 'admin')),
  subscription_status text not null default 'free' check (subscription_status in ('free', 'pro', 'enterprise')),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Helper security function to check if current authenticated user is an admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

-- RLS Policies for Profiles
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (public.is_admin() or auth.uid() = id);

-- Trigger: Automatically create public.profiles entry on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, subscription_status)
  values (
    new.id,
    coalesce(new.email, ''),
    'user',
    'free'
  )
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now();
  return new;
end;
$$;

-- Attach trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. DYNAMIC CMS: SITE SETTINGS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.site_settings (
  id                  text primary key default 'landing_page',
  hero_headline       text not null default 'The Infinite AI Canvas for Modern Teams & Thinkers.',
  hero_subheadline    text not null default 'Draw, code, present, and brainstorm. Let our AI auto-correct your shapes, generate code from text, and summarize your meetings in real-time.',
  cta_text            text not null default 'Start Your Free Canvas',
  pro_price_monthly   numeric not null default 19,
  pro_price_yearly    numeric not null default 190,
  announcement_banner text default '⚡ MasmSpace 2.0 with WebAssembly Python & Excalidraw Engine is Live!',
  updated_at          timestamptz default now(),
  updated_by          uuid references auth.users(id)
);

-- Enable RLS
alter table public.site_settings enable row level security;

-- Public can read site settings (for dynamic landing page rendering)
create policy "Anyone can read site settings"
  on public.site_settings for select
  using (true);

-- Only Admins can modify site settings
create policy "Admins can insert or update site settings"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- Seed default site settings if row does not exist
insert into public.site_settings (
  id,
  hero_headline,
  hero_subheadline,
  cta_text,
  pro_price_monthly,
  pro_price_yearly,
  announcement_banner
)
values (
  'landing_page',
  'The Infinite AI Canvas for Modern Teams & Thinkers.',
  'Draw, code, present, and brainstorm. Let our AI auto-correct your shapes, generate code from text, and summarize your meetings in real-time.',
  'Start Your Free Canvas',
  19,
  190,
  '⚡ MasmSpace 2.0 with WebAssembly Python & Excalidraw Engine is Live!'
)
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PROMOTION COMMAND HELPER (Run this to grant yourself initial Admin)
-- ─────────────────────────────────────────────────────────────────────────────
-- Promote admin@prathomix.tech to Admin and Pro subscriber:
update public.profiles
set role = 'admin', subscription_status = 'pro'
where email = 'admin@prathomix.tech';

-- Auto-grant Admin in security check function for admin@prathomix.tech
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.role = 'admin' or p.email = 'admin@prathomix.tech')
  );
$$;

