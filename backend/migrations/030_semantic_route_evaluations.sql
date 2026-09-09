CREATE TABLE IF NOT EXISTS semantic_route_evaluations (
  id UUID PRIMARY KEY,
  demo_call_id UUID NOT NULL REFERENCES demo_calls(id) ON DELETE CASCADE,
  caller_transcript_turn_id BIGINT NULL REFERENCES call_transcript_turns(id) ON DELETE SET NULL,
  route_id VARCHAR(96) NOT NULL,
  call_stage VARCHAR(96) NOT NULL,
  active_language VARCHAR(16) NOT NULL,
  deterministic_action VARCHAR(96) NULL,
  semantic_decision VARCHAR(32) NOT NULL,
  semantic_action VARCHAR(96) NULL,
  semantic_outcome_id VARCHAR(96) NULL,
  decision_reason VARCHAR(128) NOT NULL,
  positive_score NUMERIC(7,4) NULL,
  negative_score NUMERIC(7,4) NULL,
  competing_score NUMERIC(7,4) NULL,
  negative_margin NUMERIC(7,4) NULL,
  competing_margin NUMERIC(7,4) NULL,
  latency_ms INTEGER NULL,
  catalog_version VARCHAR(128) NOT NULL,
  expected_action VARCHAR(96) NULL,
  reviewer_id VARCHAR(160) NULL,
  reviewed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT semantic_route_evaluations_expected_action_check CHECK (expected_action IS NULL OR expected_action IN ('ask_permission','grant_permission','reassure_permission','close_declined','no_decision'))
);

CREATE INDEX IF NOT EXISTS semantic_route_evaluations_review_queue_idx
  ON semantic_route_evaluations (route_id, expected_action, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS semantic_route_evaluations_turn_route_idx
  ON semantic_route_evaluations (demo_call_id, caller_transcript_turn_id, route_id);
