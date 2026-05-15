-- Add T&C agreement tracking to shadow_sessions
ALTER TABLE public.shadow_sessions 
  ADD COLUMN IF NOT EXISTS agreement_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_version TEXT DEFAULT 'v1.0';

-- Dedicated agreement log (for legal audit trail)
CREATE TABLE IF NOT EXISTS public.shadow_agreements (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash          TEXT        NOT NULL,
  session_code     TEXT,
  agreement_version TEXT       NOT NULL DEFAULT 'v1.0',
  agreed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent_hash  TEXT
);

CREATE INDEX IF NOT EXISTS idx_sa_ip_hash ON public.shadow_agreements (ip_hash, agreed_at DESC);
ALTER TABLE public.shadow_agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sa_service_all" ON public.shadow_agreements;
CREATE POLICY "sa_service_all"
  ON public.shadow_agreements FOR ALL TO service_role USING (true) WITH CHECK (true);
