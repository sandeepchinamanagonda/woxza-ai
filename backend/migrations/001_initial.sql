CREATE TABLE IF NOT EXISTS waitlist_registrations (
  id UUID PRIMARY KEY,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL,
  country_code VARCHAR(8) NOT NULL,
  phone_number VARCHAR(24) NOT NULL,
  business_name VARCHAR(160),
  business_type VARCHAR(64) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_registrations_email_lower_idx
  ON waitlist_registrations (LOWER(email));

CREATE INDEX IF NOT EXISTS waitlist_registrations_created_at_idx
  ON waitlist_registrations (created_at DESC);

CREATE TABLE IF NOT EXISTS waitlist_preferences (
  registration_id UUID PRIMARY KEY REFERENCES waitlist_registrations(id) ON DELETE CASCADE,
  price_range VARCHAR(32) NOT NULL,
  desired_features JSONB NOT NULL DEFAULT '[]'::jsonb,
  primary_challenge TEXT NOT NULL,
  adoption_timeline VARCHAR(32) NOT NULL,
  team_size VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_inquiries (
  id UUID PRIMARY KEY,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL,
  country_code VARCHAR(8) NOT NULL,
  phone_number VARCHAR(24) NOT NULL,
  business_name VARCHAR(160),
  business_type VARCHAR(64) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sales_inquiries_created_at_idx
  ON sales_inquiries (created_at DESC);
