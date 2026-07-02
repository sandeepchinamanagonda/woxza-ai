# Voxa lead API

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

The API automatically applies `migrations/001_initial.sql` when it starts. OCI deployment instructions are in `deploy/OCI.md`.

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

The option values live in `src/validation.js` and intentionally match the values in the website modal.

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
