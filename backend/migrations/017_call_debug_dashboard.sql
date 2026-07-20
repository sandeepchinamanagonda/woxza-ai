CREATE TABLE IF NOT EXISTS calls (
  call_id TEXT PRIMARY KEY,
  demo_call_id UUID REFERENCES demo_calls(id) ON DELETE SET NULL,
  org_id VARCHAR(120) NOT NULL DEFAULT 'woxza',
  phone_number_masked VARCHAR(32),
  provider VARCHAR(16) NOT NULL DEFAULT 'plivo' CHECK (provider IN ('plivo', 'twilio', 'unknown')),
  status VARCHAR(24) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_latency_ms INTEGER,
  turn_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  agent_id VARCHAR(120),
  trace_id VARCHAR(120),
  deploy_version VARCHAR(120),
  instance_id VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS calls_org_started_idx ON calls (org_id, started_at DESC);
CREATE INDEX IF NOT EXISTS calls_status_started_idx ON calls (status, started_at DESC);
CREATE INDEX IF NOT EXISTS calls_trace_id_idx ON calls (trace_id);

CREATE TABLE IF NOT EXISTS call_events (
  id UUID PRIMARY KEY,
  call_id TEXT NOT NULL,
  demo_call_id UUID REFERENCES demo_calls(id) ON DELETE SET NULL,
  org_id VARCHAR(120) NOT NULL DEFAULT 'woxza',
  event_type VARCHAR(32) NOT NULL CHECK (event_type IN (
    'call_started', 'call_ended', 'turn_start', 'turn_end', 'stt_result',
    'llm_response', 'tts_start', 'tool_call', 'gemini_reconnect', 'error',
    'warning', 'redis_lookup', 'db_query'
  )),
  severity VARCHAR(16) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  latency_ms INTEGER,
  trace_id VARCHAR(120),
  deploy_version VARCHAR(120),
  instance_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS call_events_call_created_idx ON call_events (call_id, created_at);
CREATE INDEX IF NOT EXISTS call_events_trace_created_idx ON call_events (trace_id, created_at);
CREATE INDEX IF NOT EXISTS call_events_org_created_idx ON call_events (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS call_events_type_created_idx ON call_events (event_type, created_at DESC);

INSERT INTO calls (call_id, demo_call_id, org_id, phone_number_masked, provider, status, started_at, ended_at, turn_count, error_count, trace_id)
SELECT
  d.id::TEXT, d.id, 'woxza',
  CASE WHEN length(d.phone) <= 4 THEN '••••' ELSE '••••' || right(d.phone, 4) END,
  CASE WHEN d.provider_call_id LIKE 'CA%' THEN 'twilio' ELSE 'plivo' END,
  CASE WHEN d.status IN ('failed', 'no_answer') THEN 'failed' WHEN d.status = 'completed' THEN 'completed' ELSE 'in_progress' END,
  d.created_at, d.ended_at,
  COALESCE((SELECT count(*) FROM call_transcript_turns t WHERE t.demo_call_id = d.id), 0),
  0, d.id::TEXT
FROM demo_calls d
ON CONFLICT (call_id) DO NOTHING;
