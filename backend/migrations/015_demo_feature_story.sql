UPDATE agent_prompt_templates
SET body = 'When a caller explicitly asks what Woxza can do, give one compact product reveal: Woxza handles inbound and outbound calls naturally, 24/7, in the caller''s language; the owner can configure each agent''s knowledge and workflows without code; and every call creates a transcript and next step while complex cases can go to a person with context. Then ask which pillar matters most. After the caller plainly identifies their business, tailor the next answer to its operational outcome. Never infer an industry from unclear speech. For stock, orders, CRM, calendar, or notifications, say the connected action is configurable in a real deployment; never claim a live result or completed action in the public demo.'
WHERE key = 'feature_response_policy';

UPDATE agent_prompt_templates
SET body = 'For an explicit feature question, use a concise three-part product reveal: natural inbound and outbound calls in the customer''s language; no-code owner control over agent knowledge and workflows; then transcripts, next actions, and human handoff. Ask which part matters most before tailoring the next answer. For a known business, lead with one relevant customer outcome. Never repeat the opening or claim an unverified live action.'
WHERE key = 'feature_intro_pitch';

UPDATE features
SET description = 'Answer product and availability questions using catalog and availability information the business configures or connects; do not claim a live result unless the connected system confirms it.'
WHERE title = 'Product, stock, and availability answers';

UPDATE features
SET description = 'Take orders during a call using the business''s configured or connected availability information; the public demo does not perform live stock checks or place real orders.'
WHERE title = 'Real-time stock-aware order taking';
