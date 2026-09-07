CREATE TABLE IF NOT EXISTS canonical_caller_turns (
  id UUID PRIMARY KEY,
  demo_call_id UUID NOT NULL REFERENCES demo_calls(id) ON DELETE CASCADE,
  session_epoch INTEGER NOT NULL,
  turn_sequence INTEGER NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('pending','interpreting','accepted','expired','failed')),
  transcript_turn_id BIGINT REFERENCES call_transcript_turns(id) ON DELETE SET NULL,
  authoritative_text TEXT NOT NULL,
  language_code VARCHAR(16),
  confidence NUMERIC,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  interpretation JSONB,
  normalized_interpretation JSONB,
  validation JSONB,
  interpreter_model VARCHAR(120),
  interpreter_version VARCHAR(120),
  interpreted_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT canonical_caller_turns_epoch_sequence_unique UNIQUE (demo_call_id, session_epoch, turn_sequence)
);

CREATE UNIQUE INDEX IF NOT EXISTS canonical_caller_turns_one_active_per_call_idx
  ON canonical_caller_turns (demo_call_id)
  WHERE status IN ('pending', 'interpreting');

CREATE INDEX IF NOT EXISTS canonical_caller_turns_call_created_idx
  ON canonical_caller_turns (demo_call_id, created_at);
