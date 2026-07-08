CREATE TABLE IF NOT EXISTS demo_calls (
  id UUID PRIMARY KEY,
  use_case VARCHAR(32) NOT NULL CHECK (use_case IN ('appointment','restaurant','distribution','payments')),
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  email VARCHAR(254),
  ip INET NOT NULL,
  consent_marketing BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ringing','connected','completed','no_answer','failed')),
  call_duration_seconds INTEGER,
  provider_call_id VARCHAR(128),
  followup_enqueued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS demo_calls_created_at_idx ON demo_calls (created_at DESC);
CREATE INDEX IF NOT EXISTS demo_calls_phone_created_idx ON demo_calls (phone, created_at DESC);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  email VARCHAR(254),
  use_case VARCHAR(32) NOT NULL,
  source VARCHAR(32) NOT NULL DEFAULT 'demo_call',
  demo_call_id UUID NOT NULL UNIQUE REFERENCES demo_calls(id) ON DELETE CASCADE,
  call_outcome VARCHAR(24) NOT NULL CHECK (call_outcome IN ('connected','no_answer','declined','failed')),
  call_duration_seconds INTEGER,
  consent_marketing BOOLEAN NOT NULL DEFAULT TRUE,
  contact_status VARCHAR(24) NOT NULL DEFAULT 'new' CHECK (contact_status IN ('new','emailed','sms_sent','converted','unsubscribed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS leads_review_idx ON leads (created_at DESC, use_case, contact_status);
