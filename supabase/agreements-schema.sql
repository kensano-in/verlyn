-- ═══════════════════════════════════════════════════════════════════════════
-- VERLYN — Legal Agreements Schema
-- Handles immutable audit logs of legal agreement acceptances
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Alter invite_stage enum to support agreements_accepted ────────────────
-- Note: PostgreSQL doesn't support easy ALTER TYPE ADD VALUE inside transactions or IF NOT EXISTS
-- without workarounds. We use a helper function to add the value if it's missing.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_stage') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'invite_stage'::regtype AND enumlabel = 'agreements_accepted') THEN
      ALTER TYPE invite_stage ADD VALUE 'agreements_accepted' BEFORE 'code_verified';
    END IF;
  END IF;
END$$;

-- Allow invitation_id to be NULL in invitation_sessions so that the session can be started
-- during the legal Agreement Gateway stage before the code is submitted.
ALTER TABLE invitation_sessions ALTER COLUMN invitation_id DROP NOT NULL;

-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: agreement_acceptances
-- Stores cryptographic, immutable legal acceptance records for compliance auditing.
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS agreement_acceptances (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID          NOT NULL,
  
  -- Nullable initially, populated once invitation code is verified
  invitation_id       UUID          REFERENCES invitations(id) ON DELETE SET NULL,
  email               TEXT,
  email_hash          TEXT,

  accepted_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  
  -- Security Audit Metadata
  ip_hash             TEXT          NOT NULL,
  user_agent          TEXT          NOT NULL,
  country             TEXT,
  region              TEXT,
  
  -- Agreement Version Control
  agreement_version   TEXT          NOT NULL DEFAULT '1.0.0',
  agreement_hash      TEXT          NOT NULL, -- SHA-256 hash of the complete legal text accepted
  
  -- Cryptographic verification fields
  signature_hash      TEXT          NOT NULL, -- Hash of signature string + scrypt salt
  verification_chain  JSONB         NOT NULL, -- Fully populated server-side signature chain for court evidence
  
  -- Localization
  language_accepted   VARCHAR(5)    NOT NULL DEFAULT 'en'
);

-- Indexes for compliance audits and data deletion requests (GDPR/DPDP)
CREATE INDEX IF NOT EXISTS idx_agreement_acceptances_email_hash ON agreement_acceptances(email_hash);
CREATE INDEX IF NOT EXISTS idx_agreement_acceptances_session_id ON agreement_acceptances(session_id);
CREATE INDEX IF NOT EXISTS idx_agreement_acceptances_invitation_id ON agreement_acceptances(invitation_id);

-- ── RLS: service role only ───────────────────────────────────────────────────
ALTER TABLE agreement_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agreements_deny_all" ON agreement_acceptances AS RESTRICTIVE
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
