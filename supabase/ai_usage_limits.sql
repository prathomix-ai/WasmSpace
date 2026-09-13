-- ═══════════════════════════════════════════════════════════════════════════
-- MasmSpace SaaS: AI Usage Limits, Quota Management & Midnight IST pg_cron
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create ai_usage_limits Table
create table if not exists public.ai_usage_limits (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid unique references auth.users(id) on delete cascade,
  user_email          text unique,
  tier                text not null default 'free' check (tier in ('free', 'pro', 'enterprise')),
  actions_used        int not null default 0,
  action_limit        int not null default 15,
  reset_at            timestamptz not null default ((now() at time zone 'Asia/Kolkata')::date + interval '1 day'),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Index for fast lookup by user_id and email
create index if not exists idx_ai_usage_limits_user_id on public.ai_usage_limits(user_id);
create index if not exists idx_ai_usage_limits_user_email on public.ai_usage_limits(user_email);

-- 2. Row Level Security (RLS)
alter table public.ai_usage_limits enable row level security;

-- Users can read their own limits
create policy "Users can read own ai_usage_limits"
  on public.ai_usage_limits
  for select
  using (
    auth.uid() = user_id or 
    lower(auth.email()) = lower(user_email) or
    lower(user_email) = 'admin@prathomix.tech'
  );

-- Service role & Admin bypass
create policy "Service role and admin full management"
  on public.ai_usage_limits
  for all
  using (true)
  with check (true);

-- 3. Pre-seed admin@prathomix.tech with Enterprise Unlimited Quota
insert into public.ai_usage_limits (
  user_email,
  tier,
  actions_used,
  action_limit,
  reset_at
) values (
  'admin@prathomix.tech',
  'enterprise',
  0,
  99999,
  (now() at time zone 'Asia/Kolkata')::date + interval '100 years'
) on conflict (user_email) do update set
  tier = 'enterprise',
  action_limit = 99999;

-- 4. Automatic Midnight IST Quota Reset Function
create or replace function public.reset_ai_usage_midnight_ist()
returns void
language plpgsql
security definer
as $$
begin
  -- Reset actions_used to 0 for all standard accounts
  update public.ai_usage_limits
  set actions_used = 0,
      reset_at = (now() at time zone 'Asia/Kolkata')::date + interval '1 day',
      updated_at = now()
  where tier != 'enterprise';
end;
$$;

-- 5. pg_cron Scheduled Job at Midnight IST
-- Note: IST is UTC+5:30. Midnight IST (00:00) corresponds to 18:30 UTC daily.
create extension if not exists pg_cron;

-- Unschedule existing job if already created to prevent duplication
do $$
begin
  if exists (select 1 from cron.job where jobname = 'reset_ai_usage_midnight_ist') then
    perform cron.unschedule('reset_ai_usage_midnight_ist');
  end if;
end $$;

-- Schedule daily at 18:30 UTC (00:00 IST)
select cron.schedule(
  'reset_ai_usage_midnight_ist',
  '30 18 * * *',
  $$ select public.reset_ai_usage_midnight_ist(); $$
);
