-- A profile snapshot exists only for exchanges whose audio actually reached
-- the caller, matching the durable conversation-resume contract.
ALTER TABLE call_conversation_turns
  ADD COLUMN IF NOT EXISTS conversation_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS conversation_objective VARCHAR(48) NOT NULL DEFAULT 'focused_discovery';
