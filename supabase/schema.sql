-- ============================================================
-- VERLYN — FULL SECURITY SCHEMA v2.0
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. Pre-registrations ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.preregistrations (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email                TEXT         NOT NULL UNIQUE,
  domain               TEXT         NOT NULL,
  agreement_accepted   BOOLEAN      NOT NULL DEFAULT false,
  agreement_timestamp  TIMESTAMPTZ,
  ip_hash              TEXT         NOT NULL,
  session_fingerprint  TEXT,
  user_agent           TEXT,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prereg_domain     ON public.preregistrations (domain);
CREATE INDEX IF NOT EXISTS idx_prereg_created_at ON public.preregistrations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prereg_ip_hash    ON public.preregistrations (ip_hash);

ALTER TABLE public.preregistrations ENABLE ROW LEVEL SECURITY;

-- Public can only INSERT, with strict conditions
CREATE POLICY IF NOT EXISTS "prereg_anon_insert"
  ON public.preregistrations FOR INSERT TO anon
  WITH CHECK (
    agreement_accepted = true
    AND email IS NOT NULL
    AND domain IS NOT NULL
    AND length(email) <= 254
    AND length(ip_hash) = 64
  );

-- Only service role can read
CREATE POLICY IF NOT EXISTS "prereg_service_read"
  ON public.preregistrations FOR SELECT TO service_role USING (true);

-- ── 2. Support Tickets ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id           TEXT         NOT NULL UNIQUE,
  full_name         TEXT         NOT NULL,
  email             TEXT         NOT NULL,
  subject           TEXT         NOT NULL,
  report_type       TEXT         NOT NULL
                    CHECK (report_type IN ('question','account','bug','suggestion','security','other')),
  description       TEXT         NOT NULL,
  status            TEXT         NOT NULL DEFAULT 'Received'
                    CHECK (status IN ('Received','In progress','Awaiting reply','Escalated','Resolved','Completed','Closed')),
  priority          TEXT         NOT NULL DEFAULT 'normal'
                    CHECK (priority IN ('low','normal','high','critical')),
  assigned_to       TEXT,
  admin_reply       TEXT,
  internal_notes    TEXT,
  risk_score        SMALLINT     DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  spam_signals      TEXT[],
  ip_address        TEXT         NOT NULL,
  ip_hash           TEXT,
  user_agent        TEXT,
  session_fp        TEXT,
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_created   ON public.support_tickets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_status    ON public.support_tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_email     ON public.support_tickets (email);
CREATE INDEX IF NOT EXISTS idx_tickets_risk      ON public.support_tickets (risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_case_id   ON public.support_tickets (case_id);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Public: INSERT only (no read of other people's tickets)
CREATE POLICY IF NOT EXISTS "tickets_anon_insert"
  ON public.support_tickets FOR INSERT TO anon
  WITH CHECK (
    status = 'Received'
    AND full_name IS NOT NULL
    AND email IS NOT NULL
    AND length(description) BETWEEN 10 AND 5000
  );

-- Authenticated users can read only their own ticket by case_id
-- (used by ticket-lookup feature)
CREATE POLICY IF NOT EXISTS "tickets_own_read"
  ON public.support_tickets FOR SELECT TO anon
  USING (false); -- Replaced by API layer with case_id lookup via service role

-- Service role: full access
CREATE POLICY IF NOT EXISTS "tickets_service_all"
  ON public.support_tickets FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tickets_updated_at ON public.support_tickets;
CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_ticket_timestamp();

-- ── 3. Audit Logs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT        NOT NULL,
  action      TEXT        NOT NULL,
  actor       TEXT,
  target      TEXT,
  metadata    JSONB,
  severity    TEXT        NOT NULL DEFAULT 'info'
              CHECK (severity IN ('info','warn','critical')),
  success     BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partition-friendly index
CREATE INDEX IF NOT EXISTS idx_audit_created  ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_category ON public.audit_logs (category, action);
CREATE INDEX IF NOT EXISTS idx_audit_actor    ON public.audit_logs (actor);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON public.audit_logs (severity) WHERE severity IN ('warn','critical');

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can write/read audit logs
CREATE POLICY IF NOT EXISTS "audit_service_all"
  ON public.audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anon cannot read audit logs
CREATE POLICY IF NOT EXISTS "audit_no_public"
  ON public.audit_logs FOR SELECT TO anon USING (false);

-- ── 4. Rate Limit Events (persistent tracking) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash     TEXT        NOT NULL,
  endpoint    TEXT        NOT NULL,
  hit_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rl_ip_endpoint ON public.rate_limit_events (ip_hash, endpoint, hit_at DESC);
ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "rl_service_all" ON public.rate_limit_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Auto-delete events older than 24h
CREATE OR REPLACE FUNCTION delete_old_rate_limit_events()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limit_events WHERE hit_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ── 5. System Metrics ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name        TEXT         NOT NULL UNIQUE,
  uptime_percentage   NUMERIC(6,3) NOT NULL DEFAULT 100.000,
  latency_ms          NUMERIC(8,2) NOT NULL DEFAULT 0,
  status              TEXT         NOT NULL DEFAULT 'operational'
                      CHECK (status IN ('operational','degraded','down')),
  incident_message    TEXT,
  last_updated        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "metrics_anon_read"
  ON public.system_metrics FOR SELECT TO anon USING (true);

CREATE POLICY IF NOT EXISTS "metrics_service_write"
  ON public.system_metrics FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 6. Incident Reports ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.incident_reports (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  severity     TEXT        NOT NULL DEFAULT 'minor'
               CHECK (severity IN ('minor','major','critical')),
  status       TEXT        NOT NULL DEFAULT 'investigating'
               CHECK (status IN ('investigating','identified','monitoring','resolved')),
  description  TEXT        NOT NULL,
  services     TEXT[],
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_created ON public.incident_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status  ON public.incident_reports (status);

ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;

-- Public can read incident reports (transparency)
CREATE POLICY IF NOT EXISTS "incidents_anon_read"
  ON public.incident_reports FOR SELECT TO anon USING (true);

CREATE POLICY IF NOT EXISTS "incidents_service_all"
  ON public.incident_reports FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 7. Maintenance Windows ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.maintenance_windows (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT,
  services    TEXT[],
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end   TIMESTAMPTZ NOT NULL,
  actual_end      TIMESTAMPTZ,
  status      TEXT        NOT NULL DEFAULT 'scheduled'
              CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.maintenance_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "maint_anon_read"
  ON public.maintenance_windows FOR SELECT TO anon USING (true);

CREATE POLICY IF NOT EXISTS "maint_service_all"
  ON public.maintenance_windows FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 8. Seed system_metrics ────────────────────────────────────────────────────
INSERT INTO public.system_metrics (service_name, uptime_percentage, latency_ms, status)
VALUES
  ('Pre-Registration API',       99.98, 42.5,  'operational'),
  ('Authentication Subsystem',   99.99, 18.2,  'operational'),
  ('Database Core (PostgreSQL)', 99.97, 9.1,   'operational'),
  ('Edge Routing Network',       99.99, 4.3,   'operational'),
  ('Encrypted Message Queue',   100.00, 11.7,  'operational'),
  ('Rate Limiting Layer',        99.95, 2.8,   'operational'),
  ('Audit Trail System',         99.99, 5.2,   'operational'),
  ('Spam Detection Engine',      99.96, 8.4,   'operational'),
  ('Storage Encryption Layer',  100.00, 3.1,   'operational'),
  ('Session Management',         99.98, 12.6,  'operational')
ON CONFLICT (service_name) DO NOTHING;
