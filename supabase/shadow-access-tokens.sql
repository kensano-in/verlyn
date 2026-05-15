-- Shadow Session Access Token Table
-- Issued server-side on successful pre-registration, validated on every shadow API call

CREATE TABLE IF NOT EXISTS public.shadow_access_tokens (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash    TEXT          NOT NULL UNIQUE,      -- SHA-256(raw_token + SECRET_SALT)
  email_hash    TEXT          NOT NULL,             -- SHA-256(email)
  ip_hash       TEXT          NOT NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ   NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  revoked       BOOLEAN       NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_sat_token ON public.shadow_access_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_sat_email ON public.shadow_access_tokens (email_hash, revoked);

ALTER TABLE public.shadow_access_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sat_service_only" ON public.shadow_access_tokens;
CREATE POLICY "sat_service_only"
  ON public.shadow_access_tokens FOR ALL TO service_role
  USING (true) WITH CHECK (true);
