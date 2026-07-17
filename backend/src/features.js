import { randomUUID } from "node:crypto";

const TAXONOMY = ["pharmacy", "restaurant", "booking", "retail", "hr", "events", "insurance", "general"];

export const FEATURE_SEED = [
  ["AI phone agent that talks to customers in real time", "A natural voice agent that handles customer conversations as they happen.", ["general"], 10, "live"],
  ["Inbound and outbound calling", "Answer incoming calls and place follow-up or outreach calls automatically.", ["general"], 20, "live"],
  ["English and Telugu conversations", "Serve callers naturally in English or Telugu.", ["general"], 30, "live"],
  ["Product, stock, and availability answers", "Answer customer questions using the business's current product and availability information.", ["pharmacy", "retail", "restaurant"], 10, "live"],
  ["Real-time stock-aware order taking", "Take orders during a call while checking whether the requested items are available.", ["pharmacy", "retail", "restaurant"], 20, "live"],
  ["Call transcripts and recordings", "Keep searchable records of customer conversations for review and training.", ["general"], 40, "live"],
  ["Customer, supplier, stock, and order management", "Manage the operational records behind everyday customer conversations.", ["pharmacy", "retail", "restaurant"], 30, "live"],
  ["Business list imports", "Import contacts and business lists from CSV, Excel, vCard, PDF, or DOCX files.", ["general"], 50, "live"],
  ["Google Contacts import", "Bring in contacts from Google Contacts when it is connected.", ["general"], 60, "live"],
  ["Multiple specialized agents", "Create different agents for teams and jobs with separate responsibilities.", ["general"], 70, "live"],
  ["Agent assignment controls", "Assign agents to the right contacts, stock, products, languages, call direction, and business hours.", ["general"], 80, "live"],
  ["Business phone number management", "Buy, assign, and manage business numbers for your agents.", ["general"], 90, "live"],
  ["Human call routing", "Route or forward a call to a person whenever human help is needed.", ["general"], 100, "live"],
  ["Missed-call and performance tracking", "Track missed calls and understand agent and call performance.", ["general"], 110, "live"],
  ["Next-action identification", "Identify the best next action automatically after every call.", ["general"], 120, "live"],
  ["Daily priority follow-up queue", "Build a prioritized list of customers to call back each day.", ["general"], 130, "live"],
  ["Watched stock availability calls", "Notify or call customers when watched stock becomes available.", ["pharmacy", "retail"], 40, "live"],
  ["Team accounts, roles, and audit history", "Invite teammates, manage roles, and retain an audit history.", ["general"], 140, "live"],
  ["Call usage and billing tracking", "Track usage and billing for calls and agent activity.", ["general"], 150, "live"],
  ["CRM integrations", "Connect Salesforce, HubSpot, Zoho, and other CRM systems.", ["general"], 160, "roadmap"],
  ["Calendar booking integrations", "Connect Google or Outlook Calendar for appointment booking.", ["booking", "events", "insurance"], 10, "roadmap"],
  ["Confirmation and follow-up emails", "Send Gmail or Outlook confirmations and follow-up emails.", ["booking", "events", "insurance"], 20, "roadmap"],
  ["WhatsApp, Slack, and Teams notifications", "Notify teams and customers through WhatsApp, Slack, or Microsoft Teams.", ["general"], 170, "roadmap"],
  ["Support-ticket creation", "Create Zendesk or Freshdesk support tickets from relevant calls.", ["general"], 180, "roadmap"],
  ["Commerce, accounting, ERP, and custom-system connections", "Connect Shopify, QuickBooks, Xero, ERP, and custom company systems.", ["retail", "pharmacy", "restaurant"], 50, "roadmap"],
  ["MCP connections", "Connect approved tools from the business's own technology stack through MCP.", ["general"], 190, "roadmap"],
  ["Automated business rules", "Run rules such as notifying a manager, updating a calendar, or creating a CRM deal.", ["general"], 200, "roadmap"],
  ["Automatic CRM updates and escalations", "Create CRM summaries, updates, follow-up tasks, and escalations automatically.", ["general"], 210, "roadmap"],
  ["More languages and industry templates", "Expand language support and offer more industry-specific agent templates.", ["general"], 220, "roadmap"]
];

export const normalizeTags = value => [...new Set((Array.isArray(value) ? value : [])
  .map(tag => String(tag).trim().toLowerCase()).filter(Boolean))];

export async function seedFeatures(db) {
  for (const [title, description, tags, priority, status] of FEATURE_SEED) {
    await db.query(`INSERT INTO features (id,title,description,business_tags,priority,status)
      SELECT $1,$2::varchar,$3,$4,$5,$6::feature_status WHERE NOT EXISTS (SELECT 1 FROM features WHERE title=$2::varchar)`,
    [randomUUID(), title, description, tags, priority, status]);
  }
}

export async function listFeatures(db, { tag, search, includeInactive = false } = {}) {
  const values = [tag ? String(tag).trim().toLowerCase() : null, search?.trim() || null, includeInactive];
  return (await db.query(`SELECT id,title,description,business_tags,priority,status,active,created_at,updated_at
    FROM features WHERE TRUE
      AND ($1::text IS NULL OR business_tags @> ARRAY[$1]::text[])
      AND ($2::text IS NULL OR title ILIKE '%' || $2 || '%' OR description ILIKE '%' || $2 || '%')
      AND ($3::boolean OR active=TRUE) ORDER BY priority ASC, created_at ASC`, values)).rows;
}

export async function listTags(db) {
  const result = await db.query(`SELECT DISTINCT unnest(business_tags) AS tag FROM features ORDER BY tag`);
  return [...new Set([...TAXONOMY, ...result.rows.map(row => row.tag)])].sort();
}

export async function getFeaturePrompts(db) {
  const result = await db.query("SELECT key,body FROM agent_prompt_templates WHERE active=TRUE AND key IN ('feature_intro_pitch','feature_response_policy')");
  const prompts = Object.fromEntries(result.rows.map(row => [row.key, row.body]));
  prompts.feature_tags = await listTags(db);
  return prompts;
}

export async function resolveFeatureContext(db, { businessTagCandidate, callerQuestion, limit = 4, excludeFeatureIds = [] } = {}) {
  const candidate = String(businessTagCandidate || "").trim().toLowerCase();
  const requested = String(callerQuestion || "").trim();
  const excluded = [...new Set((excludeFeatureIds || []).map(String).filter(Boolean))];
  let features = candidate ? (await db.query(`SELECT id,title,description,business_tags,priority,status FROM features
    WHERE active=TRUE AND business_tags @> ARRAY[$1]::text[] AND NOT (id = ANY($2::uuid[]))
    ORDER BY priority,created_at LIMIT $3`, [candidate, excluded, limit])).rows : [];
  const usedGeneralFallback = !features.length;
  if (usedGeneralFallback) features = (await db.query(`SELECT id,title,description,business_tags,priority,status FROM features
    WHERE active=TRUE AND business_tags @> ARRAY['general']::text[] AND NOT (id = ANY($1::uuid[]))
    ORDER BY priority,created_at LIMIT $2`, [excluded, limit])).rows;
  const requestedMatch = requested ? (await db.query(`SELECT id,title,description,business_tags,priority,status FROM features
    WHERE active=TRUE AND search_document @@ websearch_to_tsquery('simple',$1) AND NOT (id = ANY($2::uuid[]))
    ORDER BY ts_rank(search_document, websearch_to_tsquery('simple',$1)) DESC LIMIT 1`, [requested, excluded])).rows[0] || null : null;
  return { businessTag: features.some(feature => feature.business_tags.includes(candidate)) ? candidate : "general", usedGeneralFallback, features, requestedMatch };
}

export async function logFeatureMention(db, demoCallId, context, callerQuestion) {
  if (!demoCallId || !context.features.length) return;
  const event = { at:new Date().toISOString(), business_tag:context.businessTag, feature_ids:context.features.map(feature => feature.id), feature_titles:context.features.map(feature => feature.title), caller_question:String(callerQuestion || "").slice(0, 500) };
  await db.query(`UPDATE demo_calls SET feature_mention_log=feature_mention_log || $2::jsonb,updated_at=NOW() WHERE id=$1`, [demoCallId, JSON.stringify([event])]);
}
