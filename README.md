# Voxa local voice-demo stack

Voxa is a public voice-AI demo site: a Vue frontend requests a demo call, a Node.js API creates the call through Plivo (India) or Twilio (US), and a Gemini Live WebSocket bridge handles the live audio. PostgreSQL stores demo calls and leads, while Redis/BullMQ applies rate limits and processes optional follow-up email jobs.

## Prerequisites

- Docker Desktop with Docker Compose v2 — [install Docker](https://docs.docker.com/get-docker/)
- `curl`, `bash`, `awk`, and `sed` (included on macOS and most Linux distributions)
- ngrok CLI — [install ngrok](https://ngrok.com/download), then either configure it once with `ngrok config add-authtoken ...` or set `NGROK_AUTHTOKEN` in `.env`
- A Google AI Studio Gemini API key — [create one](https://aistudio.google.com/app/apikey)
- A Plivo account with an India-capable voice number — [Plivo Console](https://console.plivo.com/)
- Optional for US tests: Twilio account, API credentials, and a voice number — [Twilio Console](https://console.twilio.com/)

Node.js, PostgreSQL, Redis, frontend dependencies, backend dependencies, and BullMQ do **not** need to be installed on the host: Docker builds and runs them.

## Quick start

```bash
git clone <your-repository-url> voxa-ai
cd voxa-ai
cp .env.example .env
# Fill the Gemini and Plivo values in .env. Add Twilio values for US calls.
./setup.sh
```

The comments in [`.env.example`](.env.example) say where every secret comes from. The script refuses to start the voice stack with placeholder Gemini or Plivo values.

When it finishes, open [http://localhost:3456](http://localhost:3456). The API is available at [http://localhost:8787/health](http://localhost:8787/health).

## What `setup.sh` does

1. Checks Docker Compose, curl, and ngrok are available.
2. Checks that `.env` contains non-placeholder Gemini and Plivo credentials.
3. Starts PostgreSQL and Redis with Docker Compose.
4. Reuses an active ngrok tunnel or starts a new tunnel to port `8787`, then writes its HTTPS URL to `PUBLIC_API_URL` in `.env`.
5. Builds the Node API and Vue/Nginx frontend images. This is also the dependency-install step; both Dockerfiles run `npm install` inside their images.
6. Starts the API, its in-process BullMQ worker, and the frontend.
7. The Node API applies [`001_initial.sql`](backend/migrations/001_initial.sql), [`002_demo_calls.sql`](backend/migrations/002_demo_calls.sql), and [`003_demo_call_v2.sql`](backend/migrations/003_demo_call_v2.sql) automatically before it listens.
8. Waits for API health and prints the frontend, API, and public ngrok URLs.

There is no Alembic, FastAPI, separate BullMQ worker process, or seed script in this repository. The demo has no required org, product-catalog, or agent-scope seed data: the scenario configuration and live FAQ are in [`backend/src/demo/prompt.js`](backend/src/demo/prompt.js) and [`backend/demo_agent/voxa_faq.md`](backend/demo_agent/voxa_faq.md).

## Test a call

### Outbound website demo

Open [http://localhost:3456](http://localhost:3456), choose a scenario, language, and phone number, and select **Try our live demo**. India (`+91`) requests use Plivo; US (`+1`) requests use Twilio when its credentials are configured.

For this outbound flow, there is **no Plivo-console Answer URL step**: Voxa gives Plivo a per-call answer URL such as `https://your-ngrok-url/telephony/plivo/answer?demoCallId=...` when it creates the call. Do not configure a bare `/plivo/answer` URL; this repository has no such route and the per-call ID is required to locate the demo prompt.

### The only manual telephony-console step: direct inbound testing

If you add a separate direct-inbound Plivo flow in the future, a human with Plivo Console access must set its Answer URL to the public ngrok URL printed by `setup.sh` plus that inbound route. This cannot be automated from this repository because it changes an external shared telephony account. The current public demo is outbound, so no console change is required for its standard test path.

For Twilio direct inbound testing, configure the Voice webhook manually as:

```text
POST https://YOUR_NGROK_HOST/webhooks/twilio/voice
```

## Troubleshooting

### Stale ngrok URL or a call answers then disconnects

Each new ngrok tunnel may receive a new public URL. Run `./setup.sh` again; it refreshes `PUBLIC_API_URL` and recreates the API container. If you manually configured an external provider webhook, replace the old URL there too. A provider can bill an outbound call once it is answered even if its answer URL later returns a 404, so check the printed URL before placing a real test call.

### PostgreSQL or Redis connection errors

Check the containers:

```bash
docker compose ps
docker compose logs --tail=100 db redis api
```

For a disposable local reset (this deletes local calls/leads):

```bash
docker compose down -v
./setup.sh
```

### Missing environment variables

`setup.sh` validates Gemini and Plivo credentials. For US calls it also needs `TWILIO_ACCOUNT_SID`, `TWILIO_FROM_NUMBER`, and either `TWILIO_AUTH_TOKEN` or the API-key pair. Keep secrets in `.env` only; never place them in the repository or a browser-exposed `VITE_` variable.

## Stop everything cleanly

```bash
docker compose down
```

This stops PostgreSQL, Redis, API, and frontend while retaining local database volumes. Stop the ngrok process shown in `.runtime/ngrok.pid` if `setup.sh` started it:

```bash
kill "$(cat .runtime/ngrok.pid)"
rm -f .runtime/ngrok.pid
```
