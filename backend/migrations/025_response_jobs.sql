CREATE TABLE IF NOT EXISTS call_response_jobs (
  id UUID PRIMARY KEY,
  demo_call_id UUID NOT NULL REFERENCES demo_calls(id) ON DELETE CASCADE,
  canonical_turn_id UUID REFERENCES canonical_caller_turns(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  response_text TEXT NOT NULL,
  language_code TEXT NOT NULL,
  text_source TEXT NOT NULL CHECK (text_source IN ('template','text_renderer')),
  status TEXT NOT NULL CHECK (status IN ('created','rendering','locked_playing','completed','interrupted','cancelled','failed')),
  render_epoch INTEGER NOT NULL DEFAULT 1,
  tts_provider TEXT,
  tts_model TEXT,
  transcript_turn_id BIGINT REFERENCES call_transcript_turns(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_audio_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  failure_reason TEXT
);

CREATE INDEX IF NOT EXISTS call_response_jobs_call_created_idx
  ON call_response_jobs (demo_call_id, created_at DESC);

ALTER TABLE call_transcript_turns
  ADD COLUMN IF NOT EXISTS response_job_id UUID REFERENCES call_response_jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_status TEXT;

CREATE INDEX IF NOT EXISTS call_transcript_turns_response_job_idx
  ON call_transcript_turns (response_job_id) WHERE response_job_id IS NOT NULL;
