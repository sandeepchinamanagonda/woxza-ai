import { randomUUID } from "node:crypto";
import { validatePreferences, validateRegistration, validateSalesInquiry } from "./validation.js";

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
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    vary: "Origin"
  };
}

export function createApp({ db, allowedOrigins = ["http://localhost:3000"] }) {
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
