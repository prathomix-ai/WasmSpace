-- ─────────────────────────────────────────────────────────────────────────────
-- MasmSpace / PRATHOMIX — Enterprise Payments & Webhook Audit Schema
-- Run this in your Supabase SQL Editor to enable payments audit & idempotency
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text not null,
  razorpay_order_id text not null,
  razorpay_payment_id text unique,
  amount numeric not null,
  currency text not null default 'USD',
  plan text not null,
  coupon_code text,
  discount_percent numeric default 0,
  status text not null default 'captured',
  event_type text not null default 'payment.captured',
  raw_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unique index for idempotent payment deduplication
create unique index if not exists idx_payments_razorpay_payment_id
  on public.payments(razorpay_payment_id)
  where razorpay_payment_id is not null;

create index if not exists idx_payments_order_id on public.payments(razorpay_order_id);
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_user_email on public.payments(user_email);
create index if not exists idx_payments_created_at on public.payments(created_at desc);

-- Enable RLS
alter table public.payments enable row level security;

-- Policies: Users can view their own payment history
drop policy if exists "Users can view own payments" on public.payments;
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- Service role (used by webhook with admin client) bypasses RLS automatically
