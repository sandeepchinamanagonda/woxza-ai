import { randomUUID } from "node:crypto";
import twilio from "twilio";
import { validatePreferences, validateRegistration, validateSalesInquiry } from "./validation.js";
import { validatePlivoSignature } from "./demo/plivo-signature.js";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

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
    "access-control-allow-methods": "GET, POST, OPTIONS",
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

function signedUrl(req) {
  const protocol = req.headers["x-forwarded-proto"] || "https";
  return `${protocol}://${req.headers.host}${req.url}`;
}

function validTwilioRequest(req, fields, authToken) {
  if (!authToken) return true;
  return twilio.validateRequest(authToken, req.headers["x-twilio-signature"] || "", signedUrl(req), fields);
}

function validPlivoRequest(req, fields, authToken) {
  if (!authToken) return true;
  return validatePlivoSignature({
    url:signedUrl(req), params:fields, nonce:req.headers["x-plivo-signature-v3-nonce"],
    signature:req.headers["x-plivo-signature-v3"], authToken
  });
}

function rejectInvalidSignature(req, res, provider) {
  console.warn("Rejected invalid telephony webhook signature", { provider, url:req.url });
  return sendJson(res, 403, { error:"Invalid signature" });
}

export function createApp({ db, demoService, adminToken = process.env.ADMIN_API_TOKEN, allowedOrigins = ["http://localhost:3456"], twilioAuthToken = process.env.TWILIO_AUTH_TOKEN, plivoAuthToken = process.env.PLIVO_AUTH_TOKEN }) {
  if (!twilioAuthToken) console.warn("TWILIO_AUTH_TOKEN is unset; Twilio webhook signature validation is disabled for local development only.");
  if (!plivoAuthToken) console.warn("PLIVO_AUTH_TOKEN is unset; Plivo webhook signature validation is disabled for local development only.");
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
        if (!validPlivoRequest(req, fields, plivoAuthToken)) return rejectInvalidSignature(req, res, "plivo");
        const xml = demoCallId && demoService ? await demoService.answer(demoCallId, fields) : null;
        if (!xml) return sendJson(res, 404, { error: "Demo call not found" }, cors);
        res.writeHead(200, { "content-type": "application/xml; charset=utf-8" });
        return res.end(xml);
      }

      if (req.method === "POST" && url.pathname === "/webhooks/twilio/voice") {
        const fields = (req.headers["content-type"] || "").includes("application/json") ? await readJson(req) : await readForm(req);
        if (!validTwilioRequest(req, fields, twilioAuthToken)) return rejectInvalidSignature(req, res, "twilio");
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
        const hasTwilioSignature = Boolean(req.headers["x-twilio-signature"]);
        const hasPlivoSignature = Boolean(req.headers["x-plivo-signature-v3"]);
        const valid = (hasTwilioSignature && validTwilioRequest(req, fields, twilioAuthToken)) ||
          (hasPlivoSignature && validPlivoRequest(req, fields, plivoAuthToken));
        if (!valid) return rejectInvalidSignature(req, res, hasTwilioSignature ? "twilio" : hasPlivoSignature ? "plivo" : "unknown");
        if (demoService) await demoService.callback(demoCallback[1], fields);
        return sendJson(res, 200, { status: "ok" }, cors);
      }

      if (req.method === "GET" && url.pathname === "/api/leads/unsubscribe") {
        const leadId = url.searchParams.get("lead");
        const token = url.searchParams.get("token");
        if (!demoService?.verifyUnsubscribe(leadId, token)) return sendJson(res, 400, { error: "Invalid unsubscribe link" }, cors);
        await db.query(`UPDATE leads SET consent_marketing=FALSE,contact_status='unsubscribed' WHERE id=$1`, [leadId]);
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        return res.end("<!doctype html><title>Unsubscribed</title><main style='font:18px system-ui;max-width:620px;margin:15vh auto;padding:24px'><h1>You’re unsubscribed.</h1><p>Voxa will not send you further marketing follow-ups.</p></main>");
      }

      if (req.method === "GET" && url.pathname === "/api/leads") {
        if (!adminToken || req.headers.authorization !== `Bearer ${adminToken}`) return sendJson(res, 401, { error: "Unauthorized" }, cors);
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
          res.writeHead(200, { "content-type":"text/csv; charset=utf-8", "content-disposition":"attachment; filename=voxa-demo-leads.csv", ...cors });
          return res.end(csv);
        }
        return sendJson(res, 200, { items:result.rows.map(({ total_count, ...row }) => row), page, pageSize, total:result.rows[0]?.total_count || 0 }, cors);
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
              input.businessType, JSON.stringify(input.metadata ?? {})]
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
            input.businessType, input.message.trim(), JSON.stringify(input.metadata ?? {})]
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
