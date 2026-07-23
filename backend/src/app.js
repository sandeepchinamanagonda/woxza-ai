import { randomUUID } from "node:crypto";
import { validatePreferences, validateRegistration, validateSalesInquiry, validateWaitlistSubmission } from "./validation.js";
import { listFeatures, listTags, normalizeTags } from "./features.js";
import { debugCallSummary, getDebugCall, growthMetrics, growthRecords, listDebugCalls, searchDebugCalls, websiteMetrics } from "./admin-debug.js";
import { authenticateAdmin, clearSessionCookie, sessionCookie, sessionFor } from "./admin-auth.js";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

// Questionnaire answers belong in the typed registration and preference columns.
// Keeping another copy in metadata made lead exports show the same answer twice.
const LEAD_METADATA_FIELDS_STORED_IN_COLUMNS = new Set([
  "role", "businessTypeLabel", "companySizeLabel", "helpWith", "biggestChallenge",
  "biggestChallenges", "callHandling", "callHandlings", "software", "dailyCalls",
  "onePerfectThing", "selectedCapabilities", "selectedFeatures", "implementationTimeline",
  "investmentPriority", "pricingLabel", "referralSource", "message"
]);

function leadMetadata(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  return Object.fromEntries(
    Object.entries(metadata).filter(([key, value]) =>
      !LEAD_METADATA_FIELDS_STORED_IN_COLUMNS.has(key) && value !== undefined
    )
  );
}

function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, { ...JSON_HEADERS, ...headers });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 25_000) {
      throw Object.assign(new Error("Request body is too large"), { status: 413 });
    }
    chunks.push(chunk);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    if (!body || Array.isArray(body) || typeof body !== "object") {
      throw Object.assign(new Error("Request body must be a JSON object"), { status: 400 });
    }
    return body;
  } catch (error) {
    if (error.status) throw error;
    throw Object.assign(new Error("Request body must be valid JSON"), { status: 400 });
  }
}

function corsHeaders(req, allowedOrigins) {
  const origin = req.headers.origin;
  if (!origin || (!allowedOrigins.includes("*") && !allowedOrigins.includes(origin))) return {};
  return {
    "access-control-allow-origin": allowedOrigins.includes("*") ? "*" : origin,
    "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
    vary: "Origin"
  };
}

async function readForm(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Object.fromEntries(new URLSearchParams(Buffer.concat(chunks).toString("utf8")));
}

const csvCell = value => `"${String(value ?? "").replaceAll('"', '""')}"`;
const hasAdminAccess = (req, adminToken) => Boolean(sessionFor(req, adminToken));

function validateFeature(input) {
  const errors = [];
  if (typeof input.title !== "string" || !input.title.trim() || input.title.trim().length > 160) errors.push("title is required and must be 160 characters or fewer");
  if (typeof input.description !== "string" || !input.description.trim() || input.description.trim().length > 1000) errors.push("description is required and must be 1000 characters or fewer");
  if (!Array.isArray(input.businessTags) || !normalizeTags(input.businessTags).length) errors.push("at least one business tag is required");
  if (!Number.isInteger(Number(input.priority))) errors.push("priority must be an integer");
  if (!["live", "roadmap"].includes(input.status)) errors.push("status must be live or roadmap");
  return errors;
}

export function createApp({
  db,
  demoService,
  debugRuntime,
  adminToken = process.env.ADMIN_SESSION_SECRET,
  allowedOrigins = ["http://localhost:3456"]
}) {
  const loginAttempts = new Map();
  return async function app(req, res) {
    const cors = corsHeaders(req, allowedOrigins);
    if (req.method === "OPTIONS") {
      res.writeHead(204, cors);
      return res.end();
    }

    try {
      const url = new URL(req.url, "http://localhost");

      if (req.method === "GET" && url.pathname === "/health") {
        await db.query("SELECT 1");
        return sendJson(res, 200, { status: "ok" }, cors);
      }

      if (url.pathname === "/api/admin/login" && req.method === "POST") {
        const input = await readJson(req); const email=String(input.email || "").trim().toLowerCase(); const now=Date.now();
        const attempt=loginAttempts.get(email); if(attempt?.count >= 5 && now-attempt.started < 900000) return sendJson(res,429,{error:"Too many failed attempts. Try again later."},cors);
        const user = await authenticateAdmin(db, email, input.password);
        if (!user) { const next=(!attempt || now-attempt.started>=900000)?{count:1,started:now}:{...attempt,count:attempt.count+1}; loginAttempts.set(email,next); return sendJson(res,401,{error:"Invalid email or password"},cors); }
        loginAttempts.delete(email); return sendJson(res,200,{email:user.email},{...cors,"set-cookie":sessionCookie(user,adminToken,process.env.NODE_ENV === "production")});
      }
      if (url.pathname === "/api/admin/logout" && req.method === "POST") return sendJson(res,200,{ok:true},{...cors,"set-cookie":clearSessionCookie(process.env.NODE_ENV === "production")});
      if (url.pathname === "/api/admin/session" && req.method === "GET") { const session=sessionFor(req,adminToken); return session ? sendJson(res,200,{email:session.email},cors) : sendJson(res,401,{error:"Unauthorized"},cors); }

      if (url.pathname === "/api/admin/debug/calls" && req.method === "GET") {
        if (!hasAdminAccess(req, adminToken)) return sendJson(res, 401, { error:"Unauthorized" }, cors);
        return sendJson(res, 200, await listDebugCalls(db, url), cors);
      }
      if (url.pathname === "/api/admin/debug/summary" && req.method === "GET") {
        if (!hasAdminAccess(req, adminToken)) return sendJson(res, 401, { error:"Unauthorized" }, cors);
        return sendJson(res, 200, await debugCallSummary(db, url), cors);
      }
      if (url.pathname === "/api/admin/debug/errors" && req.method === "GET") {
        if (!hasAdminAccess(req, adminToken)) return sendJson(res, 401, { error:"Unauthorized" }, cors);
        return sendJson(res, 200, await listDebugCalls(db, url, { errorsOnly:true }), cors);
      }
      if (url.pathname === "/api/admin/debug/search" && req.method === "GET") {
        if (!hasAdminAccess(req, adminToken)) return sendJson(res, 401, { error:"Unauthorized" }, cors);
        return sendJson(res, 200, await searchDebugCalls(db, url.searchParams.get("q")), cors);
      }
      if (url.pathname === "/api/admin/debug/health" && req.method === "GET") {
        if (!hasAdminAccess(req, adminToken)) return sendJson(res, 401, { error:"Unauthorized" }, cors);
        const inProgress = await db.query("SELECT count(*)::int AS count FROM calls WHERE status='in_progress'");
        return sendJson(res, 200, { inProgressCalls:inProgress.rows[0].count, postgres:{ total:db.totalCount, idle:db.idleCount, waiting:db.waitingCount }, ...(await debugRuntime?.health?.() || { redis:{ available:false }, queues:{} }) }, cors);
      }
      const debugCallPath = url.pathname.match(/^\/api\/admin\/debug\/calls\/([^/]+)$/);
      if (debugCallPath && req.method === "GET") {
        if (!hasAdminAccess(req, adminToken)) return sendJson(res, 401, { error:"Unauthorized" }, cors);
        const call = await getDebugCall(db, decodeURIComponent(debugCallPath[1]));
        return call ? sendJson(res, 200, call, cors) : sendJson(res, 404, { error:"Call not found" }, cors);
      }
      if (url.pathname === "/api/admin/growth" && req.method === "GET") {
        if (!hasAdminAccess(req, adminToken)) return sendJson(res, 401, { error:"Unauthorized" }, cors);
        return sendJson(res, 200, await growthMetrics(db, url), cors);
      }
      if (url.pathname === "/api/admin/growth/records" && req.method === "GET") {
        if (!hasAdminAccess(req, adminToken)) return sendJson(res, 401, { error:"Unauthorized" }, cors);
        const records = await growthRecords(db, url);
        return records ? sendJson(res, 200, records, cors) : sendJson(res, 422, { error:"Unknown growth record type" }, cors);
      }
      if (url.pathname === "/api/admin/website" && req.method === "GET") {
        if (!hasAdminAccess(req, adminToken)) return sendJson(res, 401, { error:"Unauthorized" }, cors);
        return sendJson(res, 200, await websiteMetrics(db, url), cors);
      }

      if (url.pathname === "/api/track/engagement" && req.method === "POST") {
        const input=await readJson(req); const sections=Array.isArray(input.sections) ? input.sections : [];
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(input.session_id||"")) || typeof input.landing_page!=="string" || input.landing_page.length>500 || sections.length>40 || !Number.isInteger(input.total_seconds) || input.total_seconds<0 || input.total_seconds>86400 || sections.some(item=>!item || typeof item.name!=="string" || item.name.length>80 || !Number.isFinite(item.seconds) || item.seconds<0 || item.seconds>86400)) return sendJson(res,422,{error:"Invalid engagement payload"},cors);
        const ip=String(req.headers["x-forwarded-for"]||req.socket.remoteAddress||"").split(",")[0].trim(); const key=`${ip}:${new Date().toISOString().slice(0,16)}`; const count=(loginAttempts.get(key)?.count||0)+1; loginAttempts.set(key,{count,started:Date.now()}); if(count>30)return sendJson(res,429,{error:"Rate limited"},cors);
        await db.query("INSERT INTO page_engagement (session_id,landing_page,referrer,total_seconds,section_breakdown) VALUES ($1,$2,$3,$4,$5::jsonb) ON CONFLICT (session_id,landing_page) DO UPDATE SET total_seconds=GREATEST(page_engagement.total_seconds,EXCLUDED.total_seconds), section_breakdown=CASE WHEN jsonb_array_length(EXCLUDED.section_breakdown)>0 THEN EXCLUDED.section_breakdown ELSE page_engagement.section_breakdown END, referrer=COALESCE(NULLIF(EXCLUDED.referrer,''),page_engagement.referrer)",[input.session_id,input.landing_page,String(input.referrer||"").slice(0,2048),input.total_seconds,JSON.stringify(sections)]);
        return sendJson(res,202,{ok:true},cors);
      }

      if (req.method === "POST" && (url.pathname === "/api/demo-call" || url.pathname === "/api/demo/call")) {
        const input = await readJson(req);
        if (input.website) return sendJson(res, 202, { status: "accepted" }, cors);
        if (!demoService) return sendJson(res, 503, { error: "Live demo is not configured" }, cors);
        const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "0.0.0.0").split(",")[0].trim();
        const result = await demoService.create(input, ip);
        if (result.silent) return sendJson(res, 202, { status: "accepted" }, cors);
        if (result.error) return sendJson(res, result.status, { error: result.error, reason: result.reason }, cors);
        return sendJson(res, result.httpStatus || 201, { status: result.status, callId: result.callId }, cors);
      }

      const demoStatus = url.pathname.match(/^\/api\/demo(?:-call|\/call)\/([0-9a-f-]+)\/status$/i);
      if (req.method === "GET" && demoStatus) {
        const result = demoService ? await demoService.status(demoStatus[1]) : null;
        return result ? sendJson(res, 200, result, cors) : sendJson(res, 404, { error: "Demo call not found" }, cors);
      }

      const demoAnswer = url.pathname.match(/^\/api\/demo-call\/([0-9a-f-]+)\/answer$/i);
      if ((req.method === "GET" || req.method === "POST") && demoAnswer) {
        const xml = demoService ? await demoService.answer(demoAnswer[1], Object.fromEntries(url.searchParams)) : null;
        if (!xml) return sendJson(res, 404, { error: "Demo call not found" }, cors);
        res.writeHead(200, { "content-type": "application/xml; charset=utf-8" });
        return res.end(xml);
      }

      if ((req.method === "GET" || req.method === "POST") && url.pathname === "/telephony/plivo/answer") {
        const demoCallId = url.searchParams.get("demoCallId");
        const fields = req.method === "POST" ? ((req.headers["content-type"] || "").includes("application/json") ? await readJson(req) : await readForm(req)) : {};
        const xml = demoCallId && demoService ? await demoService.answer(demoCallId, fields) : null;
        if (!xml) return sendJson(res, 404, { error: "Demo call not found" }, cors);
        res.writeHead(200, { "content-type": "application/xml; charset=utf-8" });
        return res.end(xml);
      }

      if (req.method === "POST" && url.pathname === "/webhooks/twilio/voice") {
        const fields = (req.headers["content-type"] || "").includes("application/json") ? await readJson(req) : await readForm(req);
        // Outbound US demo calls include demoCallId. A direct call to the US
        // number gets a short, isolated demo record with the default scenario.
        const demoCallId = url.searchParams.get("demoCallId") || await demoService?.createInboundTwilioCall(fields);
        const xml = demoCallId && demoService ? await demoService.twilioAnswer(demoCallId, fields) : null;
        if (!xml) return sendJson(res, 404, { error: "Demo call not found" }, cors);
        res.writeHead(200, { "content-type": "text/xml; charset=utf-8" });
        return res.end(xml);
      }

      const demoCallback = url.pathname.match(/^\/api\/demo-call\/([0-9a-f-]+)\/status-callback$/i);
      if (req.method === "POST" && demoCallback) {
        const fields = (req.headers["content-type"] || "").includes("application/json") ? await readJson(req) : await readForm(req);
        if (demoService) await demoService.callback(demoCallback[1], fields);
        return sendJson(res, 200, { status: "ok" }, cors);
      }

      if (req.method === "GET" && url.pathname === "/api/leads/unsubscribe") {
        const leadId = url.searchParams.get("lead");
        const token = url.searchParams.get("token");
        if (!demoService?.verifyUnsubscribe(leadId, token)) return sendJson(res, 400, { error: "Invalid unsubscribe link" }, cors);
        await db.query(`UPDATE leads SET consent_marketing=FALSE,contact_status='unsubscribed' WHERE id=$1`, [leadId]);
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        return res.end("<!doctype html><title>Unsubscribed</title><main style='font:18px system-ui;max-width:620px;margin:15vh auto;padding:24px'><h1>You’re unsubscribed.</h1><p>Woxza will not send you further marketing follow-ups.</p></main>");
      }

      if (req.method === "GET" && url.pathname === "/api/leads") {
        if (!hasAdminAccess(req, adminToken)) return sendJson(res, 401, { error: "Unauthorized" }, cors);
        const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10));
        const pageSize = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get("pageSize") || "25", 10)));
        const filters = [url.searchParams.get("use_case"), url.searchParams.get("contact_status"), url.searchParams.get("from"), url.searchParams.get("to")];
        const result = await db.query(
          `SELECT *,COUNT(*) OVER()::int AS total_count FROM leads
           WHERE ($1::text IS NULL OR use_case=$1) AND ($2::text IS NULL OR contact_status=$2)
             AND ($3::timestamptz IS NULL OR created_at >= $3) AND ($4::timestamptz IS NULL OR created_at < $4)
           ORDER BY created_at DESC LIMIT $5 OFFSET $6`, [...filters,pageSize,(page-1)*pageSize]);
        if (url.searchParams.get("format") === "csv") {
          const columns = ["id","name","phone","email","use_case","call_outcome","call_duration_seconds","contact_status","created_at"];
          const csv = [columns.join(","), ...result.rows.map(row => columns.map(column => csvCell(row[column])).join(","))].join("\n");
          res.writeHead(200, { "content-type":"text/csv; charset=utf-8", "content-disposition":"attachment; filename=woxza-demo-leads.csv", ...cors });
          return res.end(csv);
        }
        return sendJson(res, 200, { items:result.rows.map(({ total_count, ...row }) => row), page, pageSize, total:result.rows[0]?.total_count || 0 }, cors);
      }

      if (url.pathname === "/api/admin/features" && req.method === "GET") {
        if (!hasAdminAccess(req, adminToken)) return sendJson(res, 401, { error:"Unauthorized" }, cors);
        const items = await listFeatures(db, { tag:url.searchParams.get("tag"), search:url.searchParams.get("search"), includeInactive:url.searchParams.get("includeInactive") === "true" });
        return sendJson(res, 200, { items }, cors);
      }

      if (url.pathname === "/api/admin/feature-tags" && req.method === "GET") {
        if (!hasAdminAccess(req, adminToken)) return sendJson(res, 401, { error:"Unauthorized" }, cors);
        return sendJson(res, 200, { items:await listTags(db) }, cors);
      }

      if (url.pathname === "/api/admin/features" && req.method === "POST") {
        if (!hasAdminAccess(req, adminToken)) return sendJson(res, 401, { error:"Unauthorized" }, cors);
        const input = await readJson(req); const errors = validateFeature(input);
        if (errors.length) return sendJson(res, 422, { error:"Validation failed", details:errors }, cors);
        const result = await db.query(`INSERT INTO features (id,title,description,business_tags,priority,status,active) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [randomUUID(), input.title.trim(), input.description.trim(), normalizeTags(input.businessTags), Number(input.priority), input.status, input.active !== false]);
        return sendJson(res, 201, result.rows[0], cors);
      }

      const featurePath = url.pathname.match(/^\/api\/admin\/features\/([0-9a-f-]+)$/i);
      if (featurePath && req.method === "PATCH") {
        if (!hasAdminAccess(req, adminToken)) return sendJson(res, 401, { error:"Unauthorized" }, cors);
        const input = await readJson(req); const errors = validateFeature(input);
        if (errors.length) return sendJson(res, 422, { error:"Validation failed", details:errors }, cors);
        const result = await db.query(`UPDATE features SET title=$2,description=$3,business_tags=$4,priority=$5,status=$6,active=$7,updated_at=NOW() WHERE id=$1 RETURNING *`, [featurePath[1], input.title.trim(), input.description.trim(), normalizeTags(input.businessTags), Number(input.priority), input.status, input.active !== false]);
        return result.rowCount ? sendJson(res, 200, result.rows[0], cors) : sendJson(res, 404, { error:"Feature not found" }, cors);
      }
      if (featurePath && req.method === "DELETE") {
        if (!hasAdminAccess(req, adminToken)) return sendJson(res, 401, { error:"Unauthorized" }, cors);
        if (url.searchParams.get("hard") === "true") {
          const result = await db.query("DELETE FROM features WHERE id=$1 RETURNING id", [featurePath[1]]);
          return result.rowCount ? sendJson(res, 200, { deleted:true, hard:true }, cors) : sendJson(res, 404, { error:"Feature not found" }, cors);
        }
        const result = await db.query("UPDATE features SET active=FALSE,updated_at=NOW() WHERE id=$1 RETURNING id", [featurePath[1]]);
        return result.rowCount ? sendJson(res, 200, { deleted:true, hard:false }, cors) : sendJson(res, 404, { error:"Feature not found" }, cors);
      }

      const promptPath = url.pathname.match(/^\/api\/admin\/prompt-templates\/([a-z0-9_-]+)$/i);
      if (promptPath && req.method === "GET") {
        if (!hasAdminAccess(req, adminToken)) return sendJson(res, 401, { error:"Unauthorized" }, cors);
        const result = await db.query("SELECT key,title,body,active,created_at,updated_at FROM agent_prompt_templates WHERE key=$1", [promptPath[1]]);
        return result.rowCount ? sendJson(res, 200, result.rows[0], cors) : sendJson(res, 404, { error:"Prompt not found" }, cors);
      }
      if (promptPath && req.method === "PATCH") {
        if (!hasAdminAccess(req, adminToken)) return sendJson(res, 401, { error:"Unauthorized" }, cors);
        const input = await readJson(req);
        if (typeof input.body !== "string" || !input.body.trim() || input.body.length > 6000) return sendJson(res, 422, { error:"body is required and must be 6000 characters or fewer" }, cors);
        const result = await db.query("UPDATE agent_prompt_templates SET body=$2,active=$3,updated_at=NOW() WHERE key=$1 RETURNING key,title,body,active,created_at,updated_at", [promptPath[1], input.body.trim(), input.active !== false]);
        return result.rowCount ? sendJson(res, 200, result.rows[0], cors) : sendJson(res, 404, { error:"Prompt not found" }, cors);
      }

      if (req.method === "POST" && url.pathname === "/api/waitlist/registrations/complete") {
        const input = await readJson(req);
        const errors = validateWaitlistSubmission(input);
        if (errors.length) return sendJson(res, 422, { error: "Validation failed", details: errors }, cors);

        const id = randomUUID();
        try {
          await db.query(
            `WITH registration AS (
              INSERT INTO waitlist_registrations
                (id, first_name, last_name, email, country_code, phone_number, business_name, business_type, role, metadata)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
              RETURNING id
            )
            INSERT INTO waitlist_preferences
              (registration_id, price_range, desired_features, primary_challenge, adoption_timeline, team_size, help_with, biggest_challenge, biggest_challenges, call_handling, call_handlings, software, daily_calls, daily_call_volumes, referral_source)
            SELECT id, $11, $12::jsonb, $13, $14, $15, $16::jsonb, $17, $18::jsonb, $19, $20::jsonb, $21::jsonb, $22, $23::jsonb, $24
            FROM registration`,
            [id, input.firstName.trim(), input.lastName.trim(), input.email.trim().toLowerCase(),
              input.countryCode.trim(), input.phoneNumber.trim(), input.businessName?.trim() || null,
              input.businessType, input.role, JSON.stringify(leadMetadata(input.metadata)), input.priceRange,
              JSON.stringify([...new Set(input.desiredFeatures)]), input.primaryChallenge.trim(), input.adoptionTimeline,
              input.teamSize, JSON.stringify([...new Set(input.helpWith)]), input.biggestChallenges[0],
              JSON.stringify([...new Set(input.biggestChallenges)]), input.callHandlings[0],
              JSON.stringify([...new Set(input.callHandlings)]), JSON.stringify([...new Set(input.software)]),
              input.dailyCalls[0], JSON.stringify([...new Set(input.dailyCalls)]), input.referralSource]
          );
        } catch (error) {
          if (error.code === "23505") return sendJson(res, 409, { error: "This email is already on the waitlist" }, cors);
          throw error;
        }
        return sendJson(res, 201, { registrationId: id, status: "completed" }, cors);
      }

      if (req.method === "POST" && url.pathname === "/api/waitlist/registrations") {
        const input = await readJson(req);
        const errors = validateRegistration(input);
        if (errors.length) return sendJson(res, 422, { error: "Validation failed", details: errors }, cors);

        const id = randomUUID();
        try {
          await db.query(
            `INSERT INTO waitlist_registrations
              (id, first_name, last_name, email, country_code, phone_number, business_name, business_type, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
            [id, input.firstName.trim(), input.lastName.trim(), input.email.trim().toLowerCase(),
              input.countryCode.trim(), input.phoneNumber.trim(), input.businessName?.trim() || null,
              input.businessType, JSON.stringify(leadMetadata(input.metadata))]
          );
        } catch (error) {
          if (error.code === "23505") {
            return sendJson(res, 409, { error: "This email is already on the waitlist" }, cors);
          }
          throw error;
        }
        return sendJson(res, 201, { registrationId: id, nextStep: "preferences" }, cors);
      }

      if (req.method === "POST" && url.pathname === "/api/sales/inquiries") {
        const input = await readJson(req);
        const errors = validateSalesInquiry(input);
        if (errors.length) return sendJson(res, 422, { error: "Validation failed", details: errors }, cors);
        const id = randomUUID();
        await db.query(
          `INSERT INTO sales_inquiries
            (id, first_name, last_name, email, country_code, phone_number, business_name, business_type, message, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)`,
          [id, input.firstName.trim(), input.lastName.trim(), input.email.trim().toLowerCase(),
            input.countryCode.trim(), input.phoneNumber.trim(), input.businessName?.trim() || null,
            input.businessType, input.message.trim(), JSON.stringify(leadMetadata(input.metadata))]
        );
        return sendJson(res, 201, { inquiryId: id, status: "received" }, cors);
      }

      const match = url.pathname.match(/^\/api\/waitlist\/registrations\/([0-9a-f-]+)\/preferences$/i);
      if (req.method === "POST" && match) {
        const input = await readJson(req);
        const errors = validatePreferences(input);
        if (errors.length) return sendJson(res, 422, { error: "Validation failed", details: errors }, cors);

        const result = await db.query(
          `INSERT INTO waitlist_preferences
            (registration_id, price_range, desired_features, primary_challenge, adoption_timeline, team_size)
           SELECT $1, $2, $3::jsonb, $4, $5, $6
           WHERE EXISTS (SELECT 1 FROM waitlist_registrations WHERE id = $1)
           ON CONFLICT (registration_id) DO UPDATE SET
             price_range = EXCLUDED.price_range, desired_features = EXCLUDED.desired_features,
             primary_challenge = EXCLUDED.primary_challenge, adoption_timeline = EXCLUDED.adoption_timeline,
             team_size = EXCLUDED.team_size, updated_at = NOW()
           RETURNING registration_id`,
          [match[1], input.priceRange, JSON.stringify([...new Set(input.desiredFeatures)]),
            input.primaryChallenge.trim(), input.adoptionTimeline, input.teamSize]
        );
        if (!result.rowCount) return sendJson(res, 404, { error: "Waitlist registration not found" }, cors);
        return sendJson(res, 200, { registrationId: match[1], status: "completed" }, cors);
      }

      return sendJson(res, 404, { error: "Not found" }, cors);
    } catch (error) {
      if (!error.status) console.error(error);
      return sendJson(res, error.status ?? 500, { error: error.status ? error.message : "Internal server error" }, cors);
    }
  };
}
