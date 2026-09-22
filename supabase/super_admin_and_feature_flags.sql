-- ==============================================================================
-- PRATHOMIX ENTERPRISE MIGRATION: SUPER ADMIN & FEATURE FLAGS
-- Platform: MasmSpace (Powered by PRATHOMIX)
-- ==============================================================================

-- 1. Ensure profiles.role supports 'superadmin'
DO $$
BEGIN
  -- If there is a check constraint on role, drop it so 'superadmin' can be stored
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;
END $$;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin', 'superadmin'));

-- Ensure root admin has superadmin role
UPDATE public.profiles
SET role = 'superadmin'
WHERE email = 'admin@prathomix.tech' OR email ILIKE '%@prathomix.tech';

-- 2. Create Feature Flags (Kill Switches) table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'system',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT DEFAULT 'system'
);

-- Index for fast lookup by category and status
CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON public.feature_flags (category);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON public.feature_flags (enabled);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Allow public read access to feature flags (needed for client-side visibility toggles)
DROP POLICY IF EXISTS "Public can view feature flags" ON public.feature_flags;
CREATE POLICY "Public can view feature flags"
  ON public.feature_flags FOR SELECT
  USING (true);

-- Allow only superadmins to mutate feature flags
DROP POLICY IF EXISTS "Superadmins can update feature flags" ON public.feature_flags;
CREATE POLICY "Superadmins can update feature flags"
  ON public.feature_flags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
    OR auth.jwt() ->> 'email' = 'admin@prathomix.tech'
  );

-- 3. Seed Initial Feature Flags & Kill Switches
INSERT INTO public.feature_flags (id, name, description, category, enabled, updated_by)
VALUES
  (
    'maintenance_mode',
    'Global Maintenance Mode',
    'Emergency kill-switch: redirects all non-admin users to /maintenance and blocks write APIs.',
    'system',
    false,
    'migration_seed'
  ),
  (
    'ai_tools',
    'MIX AI CoPilot & Architecture Generator',
    'Controls availability of MIX AI drawer, canvas blueprint generation, and LLM chat.',
    'ai',
    true,
    'migration_seed'
  ),
  (
    'live_collaboration',
    'Realtime Multiplayer Collaboration',
    'Controls Supabase Realtime multi-cursor sync and live room collaboration.',
    'collaboration',
    true,
    'migration_seed'
  ),
  (
    'code_runner',
    'WebAssembly Python & Universal Code Runner',
    'Controls in-browser Pyodide execution and code execution widget on canvas.',
    'tools',
    true,
    'migration_seed'
  ),
  (
    'pricing_checkout',
    'Pro Membership & Razorpay Checkout',
    'Controls pricing page upgrades, coupon validation, and payment gateways.',
    'billing',
    true,
    'migration_seed'
  ),
  (
    'document_importer',
    'Document Dropzone & OCR Converter',
    'Controls PDF and image document parsing onto canvas nodes.',
    'tools',
    true,
    'migration_seed'
  ),
  (
    'export_features',
    'Canvas Vector & PDF Export',
    'Controls high-resolution PDF, PNG, and JSON canvas export tools.',
    'tools',
    true,
    'migration_seed'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = NOW();
