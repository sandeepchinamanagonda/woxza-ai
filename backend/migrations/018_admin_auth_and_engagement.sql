CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS page_engagement (
  session_id UUID NOT NULL,
  landing_page VARCHAR(500) NOT NULL,
  referrer VARCHAR(2048),
  total_seconds INTEGER NOT NULL CHECK (total_seconds >= 0 AND total_seconds <= 86400),
  section_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, landing_page)
);

CREATE INDEX IF NOT EXISTS page_engagement_created_at_idx ON page_engagement (created_at DESC);
CREATE INDEX IF NOT EXISTS page_engagement_landing_page_idx ON page_engagement (landing_page, created_at DESC);
