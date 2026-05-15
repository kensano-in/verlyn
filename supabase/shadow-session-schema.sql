-- ============================================================
-- VERLYN — SHADOW SESSION SCHEMA
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Shadow Sessions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shadow_sessions (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT          NOT NULL UNIQUE,
  status          TEXT          NOT NULL DEFAULT 'waiting'
                  CHECK (status IN ('waiting','active','expired','destroyed')),
  creator_ip_hash TEXT          NOT NULL,
  joiner_ip_hash  TEXT,
  participant_count SMALLINT    NOT NULL DEFAULT 1 CHECK (participant_count BETWEEN 1 AND 2),
  expires_at      TIMESTAMPTZ   NOT NULL,
  warned_at       TIMESTAMPTZ,
  destroyed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ss_code    ON public.shadow_sessions (code);
CREATE INDEX IF NOT EXISTS idx_ss_expires ON public.shadow_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_ss_status  ON public.shadow_sessions (status);

ALTER TABLE public.shadow_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ss_service_all" ON public.shadow_sessions;
CREATE POLICY "ss_service_all"
  ON public.shadow_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "ss_anon_none" ON public.shadow_sessions;
CREATE POLICY "ss_anon_none"
  ON public.shadow_sessions FOR SELECT TO anon USING (false);

-- ── Shadow Messages (Ephemeral Encrypted) ───────────────────
CREATE TABLE IF NOT EXISTS public.shadow_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL REFERENCES public.shadow_sessions(id) ON DELETE CASCADE,
  sender_role TEXT        NOT NULL CHECK (sender_role IN ('creator','joiner')),
  ciphertext  TEXT        NOT NULL,
  iv          TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sm_session ON public.shadow_messages (session_id, created_at ASC);

ALTER TABLE public.shadow_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sm_service_all" ON public.shadow_messages;
CREATE POLICY "sm_service_all"
  ON public.shadow_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "sm_anon_none" ON public.shadow_messages;
CREATE POLICY "sm_anon_none"
  ON public.shadow_messages FOR SELECT TO anon USING (false);

-- ── Shadow Session Cooldowns ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shadow_cooldowns (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash      TEXT        NOT NULL,
  action       TEXT        NOT NULL CHECK (action IN ('create','join')),
  session_code TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_ip_hash ON public.shadow_cooldowns (ip_hash, created_at DESC);

ALTER TABLE public.shadow_cooldowns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sc_service_all" ON public.shadow_cooldowns;
CREATE POLICY "sc_service_all"
  ON public.shadow_cooldowns FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Auto-destroy expired sessions ────────────────────────────
CREATE OR REPLACE FUNCTION destroy_expired_shadow_sessions()
RETURNS void AS $$
BEGIN
  UPDATE public.shadow_sessions
  SET status = 'expired', destroyed_at = NOW()
  WHERE status IN ('waiting','active') AND expires_at < NOW();

  DELETE FROM public.shadow_messages
  WHERE session_id IN (
    SELECT id FROM public.shadow_sessions WHERE status IN ('expired','destroyed')
  );
END;
$$ LANGUAGE plpgsql;
