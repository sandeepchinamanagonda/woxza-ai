# Woxza lead API

Node.js and PostgreSQL service for the website's waitlist and sales lead flows. Node.js 22 or newer and PostgreSQL 16 are recommended.

## Run locally

The easiest local setup runs the full frontend, API, and PostgreSQL stack:

```bash
cp .env.docker.example .env
docker compose up -d --build
```

For separate development processes, start PostgreSQL, set `DATABASE_URL` from `backend/.env.example`, install the backend package, and use two terminals:

```bash
npm run api:dev
npm run dev
```

Vite proxies `/api` to `http://localhost:8787`. For a separately hosted frontend, set `VITE_API_BASE_URL` to the API origin and include that frontend origin in `CORS_ORIGINS`.

The API automatically applies the waitlist and demo-call migrations when it starts. OCI deployment instructions are in `deploy/OCI.md`.

## Live demo configuration

The live demo uses Plivo for outbound calls. Set `PUBLIC_API_URL` to an HTTPS, publicly reachable address and configure `PLIVO_AUTH_ID`, `PLIVO_AUTH_TOKEN`, and `PLIVO_FROM_NUMBER`. Gemini uses `GEMINI_API_KEY`, `GEMINI_LIVE_MODEL`, and `GEMINI_DEMO_VOICE`.

For an incoming Twilio demo call, configure the Voice webhook as `POST https://your-public-host/webhooks/twilio/voice`. It returns TwiML and opens the bidirectional Media Stream at `wss://your-public-host/ws/twilio`. The bridge receives the selected language for outbound calls, reads the FAQ at call time, gives Gemini an 85-second wrap-up instruction, and applies a 95-second hard limit. Without complete credentials, demo submissions fail safely while waitlist and sales endpoints continue normally.

The public endpoint is `POST /api/demo/call`. It accepts `use_case`, `language`, `name`, `country_code`, `phone_number`, optional `email`, and `consent: true`; the legacy `/api/demo-call` route remains available for the existing site flow. `backend/demo_agent/woxza_faq.md` is read again for each answered call, so content updates do not require redeployment. Phone attempts are stored in PostgreSQL and capped at three in rolling 24 hours; a secondary five-per-hour IP limit and the form honeypot deter automated abuse.

Demo lead review is available at `GET /api/leads` with `Authorization: Bearer $ADMIN_API_TOKEN`. It accepts `page`, `pageSize`, `use_case`, `contact_status`, `from`, `to`, and `format=csv`.

## Feature management

The server creates and seeds the `features` and `agent_prompt_templates` tables on startup. Admin routes use the same bearer token:

- `GET` / `POST` `/api/admin/features`
- `PATCH` / `DELETE` `/api/admin/features/:id` (`?hard=true` permanently deletes; the default disables)
- `GET` `/api/admin/feature-tags`
- `GET` / `PATCH` `/api/admin/prompt-templates/:key`

The public admin screens are `/admin/features` and `/admin/prompts`. The token is held only in the browser session and is never embedded in the frontend build.

### View local data in IntelliJ IDEA

The Docker database is published only on the host loopback interface. This repository includes an IntelliJ data source named **Woxza PostgreSQL** with these settings:

- Host: `localhost`
- Port: `5432`
- Database: `voxa`
- User: `voxa`
- Local development password: `voxa_local_password`

Open the Database tool window, select **Woxza PostgreSQL**, enter the password when prompted, and expand `voxa > public > tables`.

Useful local queries:

```sql
SELECT *
FROM lead_submissions
ORDER BY created_at DESC
LIMIT 50;
```

```sql
SELECT
  registration.email,
  registration.first_name,
  registration.last_name,
  registration.phone_number,
  registration.business_name,
  registration.business_type,
  preference.team_size,
  preference.price_range,
  preference.desired_features,
  preference.primary_challenge,
  preference.adoption_timeline,
  registration.created_at
FROM waitlist_registrations registration
LEFT JOIN waitlist_preferences preference
  ON preference.registration_id = registration.id
ORDER BY registration.created_at DESC;
```

```sql
SELECT *
FROM sales_inquiries
ORDER BY created_at DESC;
```

## Endpoints

### `POST /api/waitlist/registrations`

Creates the basic waitlist record.

```json
{
  "firstName": "Ada",
  "lastName": "Lovelace",
  "email": "ada@example.com",
  "countryCode": "+1",
  "phoneNumber": "312 555 0198",
  "businessName": null,
  "businessType": "saas",
  "metadata": { "source": "homepage" }
}
```

Returns `201` with a `registrationId`. Duplicate email addresses return `409`; invalid data returns `422` with a `details` array.

### `POST /api/waitlist/registrations/:registrationId/preferences`

Completes or updates the research questions for an existing registration.

```json
{
  "priceRange": "300-999",
  "desiredFeatures": ["ai-phone-agent", "crm-integrations"],
  "primaryChallenge": "Handling calls after business hours",
  "adoptionTimeline": "1-3-months",
  "teamSize": "11-50"
}
```

The option values live in `backend/src/validation.js` and intentionally match the values in the website modal.

### `POST /api/sales/inquiries`

Creates a sales lead.

```json
{
  "firstName": "Grace",
  "lastName": "Hopper",
  "email": "grace@example.com",
  "countryCode": "+1",
  "phoneNumber": "312 555 0199",
  "businessName": null,
  "businessType": "local-services",
  "message": "We want help with after-hours call handling.",
  "metadata": { "source": "sales-modal" }
}
```

Returns `201` with an `inquiryId`; invalid data returns `422` with a `details` array.

## Test

```bash
npm run api:test
```
