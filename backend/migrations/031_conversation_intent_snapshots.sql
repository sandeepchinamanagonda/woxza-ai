ALTER TABLE call_conversation_turns
  ADD COLUMN IF NOT EXISTS conversation_intent JSONB NOT NULL DEFAULT '{}'::jsonb;
