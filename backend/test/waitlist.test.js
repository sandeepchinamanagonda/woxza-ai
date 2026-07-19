import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import { createApp } from "../src/app.js";

function createTestDatabase() {
  const registrations = new Map();
  const preferences = new Map();
  const completedSubmissions = new Map();
  const inquiries = new Map();

  return {
    async query(sql, values = []) {
      if (sql === "SELECT 1") return { rowCount: 1, rows: [{ "?column?": 1 }] };
      if (sql.includes("INSERT INTO waitlist_registrations")) {
        if ([...registrations.values()].some((item) => item.email === values[3])) {
          throw Object.assign(new Error("duplicate key"), { code: "23505" });
        }
        registrations.set(values[0], { id: values[0], email: values[3], businessName: values[6] });
        if (sql.includes("help_with")) completedSubmissions.set(values[0], values);
        return { rowCount: 1 };
      }
      if (sql.includes("INSERT INTO waitlist_preferences")) {
        if (!registrations.has(values[0])) return { rowCount: 0, rows: [] };
        preferences.set(values[0], values);
        return { rowCount: 1, rows: [{ registration_id: values[0] }] };
      }
      if (sql.includes("INSERT INTO sales_inquiries")) {
        inquiries.set(values[0], values);
        return { rowCount: 1 };
      }
      throw new Error(`Unexpected test query: ${sql}`);
    },
    state: { registrations, preferences, completedSubmissions, inquiries }
  };
}

const db = createTestDatabase();
const server = createServer(createApp({ db, allowedOrigins: ["*"] }));
let baseUrl;

before(async () => {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

async function request(path, body, method = "POST") {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  return { response, body: await response.json() };
}

const registration = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  countryCode: "+1",
  phoneNumber: "312 555 0198",
  businessName: "",
  businessType: "saas",
  metadata: { source: "homepage" }
};

test("reports database health", async () => {
  const health = await request("/health", null, "GET");
  assert.equal(health.response.status, 200);
  assert.equal(health.body.status, "ok");
});

test("creates a registration with optional company and completes preferences", async () => {
  const created = await request("/api/waitlist/registrations", registration);
  assert.equal(created.response.status, 201);
  assert.ok(created.body.registrationId);
  assert.equal(db.state.registrations.get(created.body.registrationId).businessName, null);

  const completed = await request(`/api/waitlist/registrations/${created.body.registrationId}/preferences`, {
    priceRange: "300-999",
    desiredFeatures: ["ai-phone-agent", "crm-integrations", "custom:Delivery tracking"],
    primaryChallenge: "Handling calls after business hours",
    adoptionTimeline: "1-3-months",
    teamSize: "200-plus"
  });
  assert.equal(completed.response.status, 200);
  assert.equal(completed.body.status, "completed");
});

test("accepts the final questionnaire industries, capabilities, timeline, and value ranges", async () => {
  const created = await request("/api/waitlist/registrations", {
    ...registration,
    email: "questionnaire@example.com",
    businessName: "Woxza Test Customer",
    businessType: "recruitment-staffing",
    metadata: { role:"Founder", software:["HubSpot", "Slack"], dailyCalls:"50-100" }
  });
  assert.equal(created.response.status, 201);

  const completed = await request(`/api/waitlist/registrations/${created.body.registrationId}/preferences`, {
    priceRange: "1500-3000",
    desiredFeatures: ["human-like-conversations", "24-7-availability", "call-recording-transcripts", "whatsapp-integration"],
    primaryChallenge: "Answer every incoming call and follow up automatically.",
    adoptionTimeline: "within-30-days",
    teamSize: "251-500"
  });
  assert.equal(completed.response.status, 200);
});

test("saves every waitlist answer in one atomic submission", async () => {
  const completed = await request("/api/waitlist/registrations/complete", {
    ...registration,
    email: "complete@example.com",
    businessName: "Woxza Test Customer",
    businessType: "insurance",
    role: "co-founder",
    priceRange: "700-1500",
    desiredFeatures: ["human-like-conversations", "24-7-availability"],
    primaryChallenge: "Answer every incoming call and follow up automatically.",
    adoptionTimeline: "within-30-days",
    teamSize: "2-10",
    helpWith: ["answer-incoming-calls", "qualify-leads"],
    biggestChallenges: ["high-hiring-and-staffing-costs", "slow-response-times"],
    callHandlings: ["customer-support-team", "ivr-interactive-voice-response"],
    software: ["hubspot", "slack"],
    dailyCalls: ["50-100", "100-300"],
    referralSource: "linkedin"
  });

  assert.equal(completed.response.status, 201);
  assert.equal(completed.body.status, "completed");
  assert.ok(completed.body.registrationId);
  const values = db.state.completedSubmissions.get(completed.body.registrationId);
  assert.equal(values[8], "co-founder");
  assert.equal(values[10], "700-1500");
  assert.deepEqual(JSON.parse(values[15]), ["answer-incoming-calls", "qualify-leads"]);
  assert.deepEqual(JSON.parse(values[17]), ["high-hiring-and-staffing-costs", "slow-response-times"]);
  assert.deepEqual(JSON.parse(values[19]), ["customer-support-team", "ivr-interactive-voice-response"]);
  assert.deepEqual(JSON.parse(values[20]), ["hubspot", "slack"]);
  assert.deepEqual(JSON.parse(values[22]), ["50-100", "100-300"]);
  assert.equal(values[23], "linkedin");
  assert.deepEqual(JSON.parse(values[9]), { source: "homepage" });
});

test("does not store questionnaire answers a second time in metadata", async () => {
  const completed = await request("/api/waitlist/registrations/complete", {
    ...registration,
    email: "deduplicated@example.com",
    role: "ceo",
    priceRange: "300-999",
    desiredFeatures: ["appointment-booking"],
    primaryChallenge: "Avoid repetitive questions.",
    adoptionTimeline: "within-30-days",
    teamSize: "26-50",
    helpWith: ["customer-support"],
    biggestChallenges: ["spending-too-much-time-answering-repetitive-questions"],
    callHandlings: ["receptionist"],
    software: ["freshworks-crm"],
    dailyCalls: ["1000-plus"],
    referralSource: "youtube",
    metadata: {
      source: "website-modal",
      intent: "waitlist",
      role: "CEO",
      biggestChallenge: "Spending too much time answering repetitive questions",
      implementationTimeline: "Within the next 30 days"
    }
  });

  const values = db.state.completedSubmissions.get(completed.body.registrationId);
  assert.deepEqual(JSON.parse(values[9]), { source: "website-modal", intent: "waitlist" });
});

test("rejects duplicate emails", async () => {
  const duplicate = await request("/api/waitlist/registrations", registration);
  assert.equal(duplicate.response.status, 409);
});

test("returns useful validation errors", async () => {
  const invalid = await request("/api/waitlist/registrations", { email: "not-an-email" });
  assert.equal(invalid.response.status, 422);
  assert.ok(invalid.body.details.length >= 1);
});

test("creates a sales inquiry", async () => {
  const created = await request("/api/sales/inquiries", {
    firstName: "Grace",
    lastName: "Hopper",
    email: "grace@example.com",
    countryCode: "+1",
    phoneNumber: "312 555 0199",
    businessName: null,
    businessType: "local-services",
    message: "We want help with after-hours call handling.",
    metadata: { source: "sales-modal" }
  });
  assert.equal(created.response.status, 201);
  assert.ok(created.body.inquiryId);
});
