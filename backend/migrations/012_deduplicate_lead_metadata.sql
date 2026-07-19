-- Answers are stored in the typed lead columns. Remove their historical copies
-- from JSONB metadata so exports have one canonical value per answer.
UPDATE waitlist_registrations
SET metadata = metadata - ARRAY[
  'role', 'businessTypeLabel', 'companySizeLabel', 'helpWith', 'biggestChallenge',
  'biggestChallenges', 'callHandling', 'callHandlings', 'software', 'dailyCalls',
  'onePerfectThing', 'selectedCapabilities', 'selectedFeatures', 'implementationTimeline',
  'investmentPriority', 'pricingLabel', 'referralSource', 'message'
]::TEXT[]
WHERE metadata ?| ARRAY[
  'role', 'businessTypeLabel', 'companySizeLabel', 'helpWith', 'biggestChallenge',
  'biggestChallenges', 'callHandling', 'callHandlings', 'software', 'dailyCalls',
  'onePerfectThing', 'selectedCapabilities', 'selectedFeatures', 'implementationTimeline',
  'investmentPriority', 'pricingLabel', 'referralSource', 'message'
];

UPDATE sales_inquiries
SET metadata = metadata - ARRAY['role', 'businessTypeLabel', 'message']::TEXT[]
WHERE metadata ?| ARRAY['role', 'businessTypeLabel', 'message'];

-- Keep the reporting view complete as the waitlist schema grows.
DROP VIEW IF EXISTS lead_submissions;

CREATE OR REPLACE VIEW lead_submissions AS
SELECT
  registrations.created_at, registrations.updated_at, 'waitlist'::TEXT AS lead_type,
  registrations.id AS lead_id, registrations.first_name, registrations.last_name,
  registrations.email, registrations.country_code, registrations.phone_number,
  registrations.business_name, registrations.business_type, preferences.team_size,
  preferences.price_range, preferences.adoption_timeline, preferences.desired_features,
  preferences.primary_challenge, NULL::TEXT AS message, registrations.metadata,
  registrations.role, preferences.help_with, preferences.biggest_challenge,
  preferences.biggest_challenges, preferences.call_handling, preferences.software,
  preferences.daily_calls, preferences.referral_source, preferences.call_handlings,
  preferences.daily_call_volumes
FROM waitlist_registrations registrations
LEFT JOIN waitlist_preferences preferences ON preferences.registration_id = registrations.id

UNION ALL

SELECT
  inquiries.created_at, inquiries.created_at AS updated_at, 'sales'::TEXT AS lead_type,
  inquiries.id AS lead_id, inquiries.first_name, inquiries.last_name, inquiries.email,
  inquiries.country_code, inquiries.phone_number, inquiries.business_name,
  inquiries.business_type, NULL::VARCHAR(32) AS team_size,
  NULL::VARCHAR(32) AS price_range, NULL::VARCHAR(32) AS adoption_timeline,
  '[]'::JSONB AS desired_features, NULL::TEXT AS primary_challenge, inquiries.message,
  inquiries.metadata, NULL::VARCHAR(80) AS role, '[]'::JSONB AS help_with,
  NULL::VARCHAR(120) AS biggest_challenge, '[]'::JSONB AS biggest_challenges,
  NULL::VARCHAR(120) AS call_handling, '[]'::JSONB AS software,
  NULL::VARCHAR(32) AS daily_calls, NULL::VARCHAR(120) AS referral_source,
  '[]'::JSONB AS call_handlings, '[]'::JSONB AS daily_call_volumes
FROM sales_inquiries inquiries;
