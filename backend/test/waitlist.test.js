import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import { createApp } from "../src/app.js";

function createTestDatabase() {
  const registrations = new Map();
  const preferences = new Map();
  const inquiries = new Map();

  return {
    async query(sql, values = []) {
      if (sql === "SELECT 1") return { rowCount: 1, rows: [{ "?column?": 1 }] };
      if (sql.includes("INSERT INTO waitlist_registrations")) {
        if ([...registrations.values()].some((item) => item.email === values[3])) {
          throw Object.assign(new Error("duplicate key"), { code: "23505" });
        }
        registrations.set(values[0], { id: values[0], email: values[3], businessName: values[6] });
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
    state: { registrations, preferences, inquiries }
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
