-- ============================================================
-- VERLYN — VEIL HARDENING (PHASE 2)
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE public.shadow_sessions 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS manual_lock BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS extension_count SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS system_msgs JSONB NOT NULL DEFAULT '[]',
ADD COLUMN IF NOT EXISTS presence_creator BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS presence_joiner BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS typing_creator BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS typing_joiner BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kicked_joiner BOOLEAN NOT NULL DEFAULT false;

-- Enable Realtime for room state updates
-- Note: You may need to enable these in the Supabase Dashboard UI if these commands fail
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.shadow_sessions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.shadow_messages;
