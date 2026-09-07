-- Durable, append-only resume memory for voice calls. This is intentionally
-- separate from the debug transcript: a row exists only after a full caller /
-- agent exchange has completed its audio delivery.
CREATE TABLE IF NOT EXISTS call_conversation_turns (
  id BIGSERIAL PRIMARY KEY,
  turn_id UUID NOT NULL UNIQUE,
  demo_call_id UUID NOT NULL REFERENCES demo_calls(id) ON DELETE CASCADE,
  turn_sequence INTEGER NOT NULL,
  caller_text TEXT NOT NULL,
  agent_text TEXT NOT NULL,
  language VARCHAR(16) NOT NULL,
  language_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  caller_transcript_turn_id BIGINT REFERENCES call_transcript_turns(id) ON DELETE SET NULL,
  agent_transcript_turn_id BIGINT REFERENCES call_transcript_turns(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT call_conversation_turns_call_sequence_unique UNIQUE (demo_call_id, turn_sequence)
);

CREATE INDEX IF NOT EXISTS call_conversation_turns_call_sequence_idx
  ON call_conversation_turns (demo_call_id, turn_sequence DESC);
