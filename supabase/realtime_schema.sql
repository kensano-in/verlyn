-- ============================================================
-- VERLYN — REALTIME MESSAGING SCHEMA
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. Chat Messages table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         TEXT         NOT NULL,
  sender          TEXT         NOT NULL CHECK (sender IN ('user', 'agent')),
  content         TEXT         NOT NULL,
  message_type    TEXT         NOT NULL DEFAULT 'text'
                  CHECK (message_type IN ('text','image','video','audio','document','system')),
  media_url       TEXT,
  media_name      TEXT,
  media_size      INTEGER,
  reply_to_id     UUID         REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  reactions       JSONB        NOT NULL DEFAULT '{}',
  seen_at         TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  idempotency_key TEXT         UNIQUE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_case_id      ON public.chat_messages (case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender        ON public.chat_messages (sender);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at    ON public.chat_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_idempotency   ON public.chat_messages (idempotency_key);

-- ── 2. Typing Indicators table ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         TEXT         NOT NULL,
  sender          TEXT         NOT NULL,
  is_typing       BOOLEAN      NOT NULL DEFAULT false,
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (case_id, sender)
);

CREATE INDEX IF NOT EXISTS idx_typing_case_id ON public.typing_indicators (case_id);

-- ── 3. Presence / Online Status table ──────────────────────
CREATE TABLE IF NOT EXISTS public.user_presence (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         TEXT         NOT NULL,
  sender          TEXT         NOT NULL,
  status          TEXT         NOT NULL DEFAULT 'online' CHECK (status IN ('online','away','offline')),
  last_seen       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (case_id, sender)
);

CREATE INDEX IF NOT EXISTS idx_presence_case_id ON public.user_presence (case_id);

-- ── 4. Enable Row Level Security ────────────────────────────
ALTER TABLE public.chat_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence      ENABLE ROW LEVEL SECURITY;

-- ── 5. RLS Policies ─────────────────────────────────────────
-- chat_messages: anyone can read/write (case_id is the security boundary)
CREATE POLICY "allow_all_chat_messages"
  ON public.chat_messages FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_typing"
  ON public.typing_indicators FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_presence"
  ON public.user_presence FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── 6. Enable Realtime on tables ────────────────────────────
-- Run these in the Supabase Dashboard → Database → Replication:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- ── 7. Migrate existing support_tickets descriptions ─────────
-- This function migrates old [USER_REPLY] format to new messages table
CREATE OR REPLACE FUNCTION migrate_ticket_to_messages(p_case_id TEXT)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_desc TEXT;
  v_blocks TEXT[];
  v_block TEXT;
  v_is_user_reply BOOLEAN;
BEGIN
  SELECT description INTO v_desc FROM public.support_tickets WHERE case_id = p_case_id;
  IF v_desc IS NULL THEN RETURN; END IF;
  
  v_blocks := string_to_array(v_desc, '[USER_REPLY]');
  v_is_user_reply := false;
  
  FOREACH v_block IN ARRAY v_blocks LOOP
    v_block := trim(v_block);
    IF length(v_block) > 0 THEN
      INSERT INTO public.chat_messages (case_id, sender, content, message_type)
      VALUES (p_case_id, CASE WHEN v_is_user_reply THEN 'user' ELSE 'user' END, v_block, 'text')
      ON CONFLICT DO NOTHING;
    END IF;
    v_is_user_reply := true;
  END LOOP;
END;
$$;
