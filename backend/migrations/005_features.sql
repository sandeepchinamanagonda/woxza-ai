DO $$ BEGIN
  CREATE TYPE feature_status AS ENUM ('live', 'roadmap');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  business_tags TEXT[] NOT NULL DEFAULT '{}',
  priority INTEGER NOT NULL DEFAULT 100,
  status feature_status NOT NULL DEFAULT 'live',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  search_document TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS features_active_tags_gin_idx
  ON features USING GIN (business_tags)
  WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS features_active_priority_idx
  ON features (priority ASC, created_at ASC)
  WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS features_search_document_gin_idx
  ON features USING GIN (search_document);

CREATE TABLE IF NOT EXISTS agent_prompt_templates (
  key TEXT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  body TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE demo_calls ADD COLUMN IF NOT EXISTS feature_mention_log JSONB NOT NULL DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS demo_calls_feature_mention_log_gin_idx ON demo_calls USING GIN (feature_mention_log);

INSERT INTO agent_prompt_templates (key, title, body) VALUES
('feature_intro_pitch', 'Feature introduction pitch', 'Woxza answers your calls and makes calls on your behalf, handles orders and follow-ups automatically, and works directly with your own customer and stock data — so it''s not guessing, it actually knows your business. And it does all this at a fraction of the cost of hiring extra staff. Soon it''ll also connect directly to your CRM, calendar, WhatsApp, and other tools you already use, so every call turns into action automatically.'),
('feature_response_policy', 'Tailored feature response policy', 'Speak naturally and concisely for a phone call. Explain why each feature matters to the caller''s business and end with a concrete outcome. Never present a roadmap feature as available today: say it is coming soon. Do not invent capabilities. If a capability exists for another business tag, say it exists but is not usually the primary fit for this business.')
ON CONFLICT (key) DO NOTHING;
