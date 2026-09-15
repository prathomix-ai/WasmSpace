-- ─────────────────────────────────────────────────────────────────────────────
-- MasmSpace SaaS: Promo Code & Pro Subscription Expiry Schema
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Ensure required columns exist on public.profiles
alter table if exists public.profiles
  add column if not exists used_promo_codes text[] default '{}',
  add column if not exists pro_expiry_date timestamptz default null,
  add column if not exists is_pro boolean default false,
  add column if not exists tier text default 'free';

-- 2. Index for fast expiry checks
create index if not exists idx_profiles_pro_expiry on public.profiles(pro_expiry_date)
  where pro_expiry_date is not null;

-- 3. Stored Procedure for Atomic Promo Code Redemption
create or replace function public.redeem_promo_code(
  p_user_id uuid,
  p_code text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
  v_now timestamptz := now();
  v_expiry timestamptz;
  v_clean_code text := trim(p_code);
begin
  -- Validate code
  if v_clean_code != 'SaNdAk' then
    return json_build_object('success', false, 'error', 'Invalid promo code.');
  end if;

  -- Fetch user profile
  select * into v_profile from public.profiles where id = p_user_id;
  if not found then
    return json_build_object('success', false, 'error', 'User profile not found.');
  end if;

  -- Check if code was already redeemed
  if v_profile.used_promo_codes is not null and v_clean_code = any(v_profile.used_promo_codes) then
    return json_build_object('success', false, 'error', 'This promo code has already been used.');
  end if;

  -- Calculate exactly 2 months expiry
  v_expiry := v_now + interval '2 months';

  -- Update profile atomically
  update public.profiles
  set
    tier = 'pro',
    subscription_status = 'pro',
    is_pro = true,
    used_promo_codes = array_append(coalesce(v_profile.used_promo_codes, '{}'), v_clean_code),
    pro_expiry_date = v_expiry,
    updated_at = v_now
  where id = p_user_id;

  return json_build_object(
    'success', true,
    'message', 'PRO activated for 2 months!',
    'expiry_date', v_expiry
  );
end;
$$;

-- 4. Stored Procedure for Automatic Deactivation of Expired Subscriptions
create or replace function public.deactivate_expired_subscriptions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.profiles
  set
    tier = 'free',
    subscription_status = 'free',
    is_pro = false,
    pro_expiry_date = null,
    updated_at = now()
  where
    pro_expiry_date is not null
    and pro_expiry_date < now()
    and role != 'admin'; -- Never demote superadmins

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
