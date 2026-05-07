-- ============================================================
-- VERLYN — SUPABASE DATABASE SCHEMA
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. Pre-registrations table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.preregistrations (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email                TEXT         NOT NULL UNIQUE,
  domain               TEXT         NOT NULL,
  agreement_accepted   BOOLEAN      NOT NULL DEFAULT false,
  agreement_timestamp  TIMESTAMPTZ,
  ip_hash              TEXT         NOT NULL,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prereg_domain     ON public.preregistrations (domain);
CREATE INDEX IF NOT EXISTS idx_prereg_created_at ON public.preregistrations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prereg_ip_hash    ON public.preregistrations (ip_hash);

-- ── 2. Enable Row Level Security ──────────────────────────────────────────────
ALTER TABLE public.preregistrations ENABLE ROW LEVEL SECURITY;

-- ── 3. Public INSERT-only policy (no SELECT, no UPDATE, no DELETE for anon) ──
CREATE POLICY "anon_insert_only"
  ON public.preregistrations
  FOR INSERT
  TO anon
  WITH CHECK (
    agreement_accepted = true
    AND email IS NOT NULL
    AND domain IS NOT NULL
  );

-- No SELECT policy for anon — public cannot read the list
-- No UPDATE / DELETE policy for anon

-- ── 4. System metrics table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name        TEXT         NOT NULL UNIQUE,
  uptime_percentage   NUMERIC(6,3) NOT NULL DEFAULT 100.000,
  latency_ms          NUMERIC(8,2) NOT NULL DEFAULT 0,
  status              TEXT         NOT NULL DEFAULT 'operational'
                      CHECK (status IN ('operational', 'degraded', 'down')),
  last_updated        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- Allow public SELECT (status page needs to read this)
CREATE POLICY "anon_read_metrics"
  ON public.system_metrics
  FOR SELECT
  TO anon
  USING (true);

-- Only service role can update (used by edge function heartbeat)
CREATE POLICY "service_update_metrics"
  ON public.system_metrics
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── 5. Seed initial system_metrics data ──────────────────────────────────────
INSERT INTO public.system_metrics (service_name, uptime_percentage, latency_ms, status)
VALUES
  ('Pre-Registration API',       99.98, 42.5,  'operational'),
  ('Authentication Subsystem',   99.99, 18.2,  'operational'),
  ('Database Core (PostgreSQL)', 99.97, 9.1,   'operational'),
  ('Edge Routing Network',       99.99, 4.3,   'operational'),
  ('Encrypted Message Queue',   100.00, 11.7,  'operational'),
  ('Rate Limiting Layer',        99.95, 2.8,   'operational')
ON CONFLICT (service_name) DO NOTHING;


-- ============================================================
-- OPTIONAL: Edge Function to simulate heartbeat metric updates
-- Deploy via: supabase functions deploy update-metrics
-- Schedule via: Supabase Dashboard → Database → Scheduled Hooks
-- (Run every 30 seconds)
-- ============================================================
-- The Edge Function code is in: supabase/functions/update-metrics/index.ts
-- See that file for implementation.
