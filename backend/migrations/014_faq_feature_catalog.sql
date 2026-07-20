-- FAQ-backed product catalog. These claims are safe for the live voice experience.
UPDATE features SET
  description = 'Answer incoming calls and place follow-up, appointment, or lead-reengagement calls.',
  status = 'live', updated_at = NOW()
WHERE title = 'Inbound and outbound calling';

UPDATE features SET
  title = 'Natural multilingual conversations',
  description = 'Serve callers in English, Hindi, Telugu, Tamil, Kannada, and more, including natural language switching.',
  status = 'live', updated_at = NOW()
WHERE title = 'English and Telugu conversations';

UPDATE features SET
  description = 'Record and transcribe calls, with summaries and a dashboard for review, coaching, and improvement.',
  status = 'live', updated_at = NOW()
WHERE title = 'Call transcripts and recordings';

UPDATE features SET
  description = 'Connect CRM, calendar, and database systems so agents can use current business context and record actions.',
  status = 'live', updated_at = NOW()
WHERE title = 'CRM integrations';

UPDATE features SET
  description = 'Book appointments in a connected calendar and update the CRM during the call.',
  status = 'live', updated_at = NOW()
WHERE title = 'Calendar booking integrations';

UPDATE features SET
  description = 'Update connected CRM records and hand complex or high-value calls to the right team member with context.',
  status = 'live', updated_at = NOW()
WHERE title = 'Automatic CRM updates and escalations';

INSERT INTO features (id, title, description, business_tags, priority, status)
SELECT 'cbb5dd1e-d42a-4904-b3c4-15cfdcc6b513', 'Self-serve no-code setup in minutes',
  'Customers can create and launch their own Woxza voice agent, upload business information, and make changes without writing code or waiting for a vendor.',
  ARRAY['general'], 15, 'live'::feature_status
WHERE NOT EXISTS (SELECT 1 FROM features WHERE title = 'Self-serve no-code setup in minutes');

INSERT INTO features (id, title, description, business_tags, priority, status)
SELECT '18427956-ecd8-44a6-b32f-b8b3e2c238dd', 'Business-controlled knowledge',
  'Connect live systems or upload catalog, pricing, and FAQ information, then update product availability and agent behavior yourself.',
  ARRAY['pharmacy','retail','restaurant','general'], 25, 'live'::feature_status
WHERE NOT EXISTS (SELECT 1 FROM features WHERE title = 'Business-controlled knowledge');

INSERT INTO features (id, title, description, business_tags, priority, status)
SELECT '26ecaf68-8d9e-45b4-9a48-5122eb78786f', 'Data privacy and access control',
  'Business data, transcripts, and calls are encrypted in transit and at rest, isolated by account, and protected with role-based access controls. Woxza is built with India''s DPDP Act in mind.',
  ARRAY['general'], 35, 'live'::feature_status
WHERE NOT EXISTS (SELECT 1 FROM features WHERE title = 'Data privacy and access control');

UPDATE agent_prompt_templates SET
  body = 'Use only FAQ-backed Woxza facts. First learn the caller''s business. Then lead with the most relevant capability, not a feature tour. For general product value, emphasize self-serve no-code setup in minutes and the customer''s ability to manage agent behavior and business knowledge. Describe connected data and operational actions as configurable in a real deployment, never as actions already performed in this public demo. For data privacy, state encryption in transit and at rest, account isolation, role-based access, and that Woxza is built with India''s DPDP Act in mind; do not claim certification or legal compliance. Do not invent ROI, staffing savings, integrations, stock, pricing, or outcomes.',
  updated_at = NOW()
WHERE key = 'feature_response_policy';

UPDATE agent_prompt_templates SET
  body = 'After learning the caller''s business, explain one relevant verified Woxza capability concisely. Emphasize that a customer can create and manage agents themselves without code and launch in minutes when that answers the caller''s question. Do not promise live actions in this public demo.',
  updated_at = NOW()
WHERE key = 'feature_intro_pitch';
