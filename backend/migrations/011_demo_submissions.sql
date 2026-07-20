-- Captures a submitted live-demo form independently of the call lifecycle.
-- A submission is retained even when the request is rate-limited or the call
-- provider is unavailable.
CREATE TABLE IF NOT EXISTS demo_submissions (
  id UUID PRIMARY KEY,
  demo_call_id UUID UNIQUE REFERENCES demo_calls(id) ON DELETE SET NULL,
  name VARCHAR(160) NOT NULL,
  country_code VARCHAR(8) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  email VARCHAR(254),
  language VARCHAR(8) NOT NULL,
  use_case VARCHAR(64) NOT NULL,
  consent_marketing BOOLEAN NOT NULL,
  ip INET NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'calling', 'rate_limited', 'failed')),
  failure_reason VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS demo_submissions_created_at_idx
  ON demo_submissions (created_at DESC);

CREATE INDEX IF NOT EXISTS demo_submissions_phone_created_idx
  ON demo_submissions (phone, created_at DESC);
