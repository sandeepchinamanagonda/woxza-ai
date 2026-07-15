CREATE TABLE IF NOT EXISTS call_transcript_turns (
  id BIGSERIAL PRIMARY KEY,
  demo_call_id UUID NOT NULL REFERENCES demo_calls(id) ON DELETE CASCADE,
  speaker VARCHAR(16) NOT NULL CHECK (speaker IN ('caller','agent','system')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS call_transcript_turns_call_created_idx
  ON call_transcript_turns (demo_call_id, created_at);
