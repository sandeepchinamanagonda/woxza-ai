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

CREATE OR REPLACE VIEW lead_submissions AS
SELECT
  registrations.created_at,
  registrations.updated_at,
  'waitlist'::TEXT AS lead_type,
  registrations.id AS lead_id,
  registrations.first_name,
  registrations.last_name,
  registrations.email,
  registrations.country_code,
  registrations.phone_number,
  registrations.business_name,
  registrations.business_type,
  preferences.team_size,
  preferences.price_range,
  preferences.adoption_timeline,
  preferences.desired_features,
  preferences.primary_challenge,
  NULL::TEXT AS message,
  registrations.metadata
FROM waitlist_registrations registrations
LEFT JOIN waitlist_preferences preferences
  ON preferences.registration_id = registrations.id

UNION ALL

SELECT
  inquiries.created_at,
  inquiries.created_at AS updated_at,
  'sales'::TEXT AS lead_type,
  inquiries.id AS lead_id,
  inquiries.first_name,
  inquiries.last_name,
  inquiries.email,
  inquiries.country_code,
  inquiries.phone_number,
  inquiries.business_name,
  inquiries.business_type,
  NULL::VARCHAR(32) AS team_size,
  NULL::VARCHAR(32) AS price_range,
  NULL::VARCHAR(32) AS adoption_timeline,
  '[]'::JSONB AS desired_features,
  NULL::TEXT AS primary_challenge,
  inquiries.message,
  inquiries.metadata
FROM sales_inquiries inquiries;
