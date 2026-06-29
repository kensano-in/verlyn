-- ═══════════════════════════════════════════════════════════════════════════
-- VERLYN — Invitation System Schema
-- Enterprise-grade invitation-only access control
-- Run this in the Supabase SQL editor (service role required).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Enum: invitation status ───────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invitation_status') THEN
    CREATE TYPE invitation_status AS ENUM ('active', 'used', 'revoked', 'expired');
  END IF;
END$$;

-- ── Enum: invite session stage ────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_stage') THEN
    CREATE TYPE invite_stage AS ENUM ('code_verified', 'email_verified', 'otp_verified');
  END IF;
END$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: invitations
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS invitations (
  id                  UUID              PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The 12-char display code (stored for admin display only; lookup always uses hash)
  code                CHAR(12)          NOT NULL,
  -- SHA-256 of code — used for constant-time lookup
  code_hash           TEXT              NOT NULL UNIQUE,

  -- Bound email address (stored for sending OTP; lookup uses hash)
  email               TEXT              NOT NULL,
  -- SHA-256 of lower(trim(email)) — used for verification comparison
  email_hash          TEXT              NOT NULL,

  status              invitation_status NOT NULL DEFAULT 'active',

  issued_by           TEXT              NOT NULL,           -- admin identifier
  issued_at           TIMESTAMPTZ       NOT NULL DEFAULT now(),
  expires_at          TIMESTAMPTZ       NOT NULL,

  redeemed_at         TIMESTAMPTZ,
  redeemed_ip_hash    TEXT,                                 -- hashed IP of redeemer

  notes               TEXT,

  -- Audit: full history is stored in audit_logs; this tracks last change
  revoked_at          TIMESTAMPTZ,
  revoked_by          TEXT
);

-- Indexes for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_code_hash  ON invitations (code_hash);
CREATE        INDEX IF NOT EXISTS idx_invitations_email_hash ON invitations (email_hash);
CREATE        INDEX IF NOT EXISTS idx_invitations_status     ON invitations (status);

-- ── RLS: no direct anon/authenticated access — service role only ──────────────
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
-- Explicitly deny all roles except service_role (service_role bypasses RLS)
CREATE POLICY "invitations_deny_all" ON invitations AS RESTRICTIVE
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);


-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: invitation_otps
-- Short-lived OTP records (10 min TTL, single-use, hashed)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS invitation_otps (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id   UUID        NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,

  -- scrypt/bcrypt hash of the 6-digit OTP — raw value never stored
  otp_hash        TEXT        NOT NULL,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,

  used            BOOLEAN     NOT NULL DEFAULT false,
  used_at         TIMESTAMPTZ,

  -- Brute-force tracking: invalidate after MAX_ATTEMPTS
  attempt_count   INTEGER     NOT NULL DEFAULT 0,

  -- Hashed IP that requested the OTP
  ip_hash         TEXT
);

CREATE INDEX IF NOT EXISTS idx_invitation_otps_inv_id    ON invitation_otps (invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_otps_expires   ON invitation_otps (expires_at);

ALTER TABLE invitation_otps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "otps_deny_all" ON invitation_otps AS RESTRICTIVE
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);


-- ══════════════════════════════════════════════════════════════════════════════
-- TABLE: invitation_sessions
-- Tracks server-side verification progress; JWT jti replay protection
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS invitation_sessions (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id   UUID         NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,

  stage           invite_stage NOT NULL,

  -- JWT nonce — stored so replay of a stolen token is rejected
  jti             TEXT         NOT NULL UNIQUE,

  ip_hash         TEXT,
  ua_hash         TEXT,        -- hashed user-agent fingerprint

  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ  NOT NULL,
  advanced_at     TIMESTAMPTZ           -- timestamp when stage was last advanced
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inv_sessions_jti     ON invitation_sessions (jti);
CREATE        INDEX IF NOT EXISTS idx_inv_sessions_inv_id  ON invitation_sessions (invitation_id);
CREATE        INDEX IF NOT EXISTS idx_inv_sessions_expires ON invitation_sessions (expires_at);

ALTER TABLE invitation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_deny_all" ON invitation_sessions AS RESTRICTIVE
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);


-- ══════════════════════════════════════════════════════════════════════════════
-- Housekeeping: auto-expire stale sessions + OTPs
-- Schedule this via pg_cron or a Supabase Edge Function cron.
-- ══════════════════════════════════════════════════════════════════════════════
-- Example (run manually or via cron):
-- DELETE FROM invitation_sessions WHERE expires_at < now();
-- DELETE FROM invitation_otps     WHERE expires_at < now() AND used = false;

-- ══════════════════════════════════════════════════════════════════════════════
-- audit_logs: already exists from main schema — no changes needed.
-- Invitation events use category='auth', action prefixed with 'invite.'
-- ══════════════════════════════════════════════════════════════════════════════
