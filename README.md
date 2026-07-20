# Run Woxza locally — no engineering setup required

Woxza is a local demo website with a Vue frontend, Node.js API, PostgreSQL, and Redis. Once it starts, open **http://localhost:3456**. The API health check is at **http://localhost:8787/health**.

You do not need to install Node, PostgreSQL, Redis, npm packages, or Python to use the app. Docker runs all of those for you. The one-command setup can also install the few host tools it needs.

## The easiest route: give this to Codex or Claude

Open this folder in Codex or Claude Code and paste the following exactly:

> Read `README.md`, then get this project running locally. You are authorized to install any missing local prerequisites, including Homebrew (if needed), Docker Desktop, Docker Compose, ngrok, and Python 3; approve the required system-permission prompts. Run `./setup.sh --install-dependencies`, wait until Docker is ready, and verify both `http://localhost:3456` and `http://localhost:8787/health`. Do not stop at instructions—start the services and report the local URLs. Use local-preview mode if no voice-provider credentials are available.

That assistant should take care of the installation, permissions, service startup, and verification. On macOS, Docker Desktop may show a one-time system prompt—approve it, then let the assistant continue.

## One command if you are running it yourself

In Terminal, from this project folder:

```bash
./setup.sh --install-dependencies
```

This is safe to re-run, including after switching branches. It will:

1. Install missing Docker Desktop/Engine, ngrok, and Python 3 (macOS or Debian/Ubuntu Linux).
2. Create a local `.env` file if one does not exist.
3. Build all frontend and backend dependencies inside Docker.
4. Start the database, Redis, API, and website.
5. Wait until the backend health check succeeds.

Every local run is automatically in **local-admin mode**. Use the printed Admin URL (or open `http://localhost:3456/admin/features`) to manage features and prompts without entering a token. The setup command generates a private local token so that this access is not exposed through the public voice tunnel. Production uses its separate `.env.production` configuration and keeps admin authentication enabled.

Then open [http://localhost:3456](http://localhost:3456). Leave the Terminal window open only while the setup command is working; after it prints “Woxza is running”, Docker keeps the app running in the background.

### What works without any accounts or keys

The full website, forms, database, Redis, API, and local demo experience run with no external accounts. This is called **local-preview mode**.

### What needs your own credentials

Actual phone calls need a Google Gemini key, Plivo credentials, and an ngrok account/token. This is unavoidable because those providers charge or authenticate calls under an account. Add these values to `.env`, then run:

```bash
./setup.sh
```

The script opens an ngrok tunnel automatically, records its public URL, then starts the voice-ready stack. It does not make any changes in Plivo, Twilio, Google, or ngrok beyond configuring the ngrok token on your own computer.

After creating or switching to a branch, start it with `./setup.sh` (or `npm run local`) instead of `docker compose up`. That refreshes the local voice callback URL before the API starts, so phone calls do not inherit a stale tunnel URL.

## Start, check, and stop

```bash
# Start the local site and backend without setting up a public voice tunnel
./setup.sh --local-only

# Check whether every service is healthy
docker compose ps
curl http://localhost:8787/health

# Stop the website, backend, database, and Redis
docker compose down
```

Stopping the stack keeps local database data. To completely erase local demo data, run `docker compose down -v`.

## If something gets stuck

First, ask your coding assistant to run this diagnostic and fix the result:

> Inspect the Woxza Docker containers and logs, fix only the local startup problem, restart the stack, and verify `http://localhost:3456` plus `http://localhost:8787/health` before you finish.

For manual diagnosis:

```bash
docker compose ps
docker compose logs --tail=100 api web db redis
```

The most common first-run issue is Docker Desktop still starting. Wait for its menu-bar icon to show it is running, then run `./setup.sh --local-only` again.

## For engineers: project details

- Frontend: Vue/Vite, served by Nginx on port `3456`.
- API: Node.js on port `8787`; migrations run automatically during startup.
- Data: PostgreSQL and Redis, both managed by Docker Compose.
- Dependencies: installed during the Docker image builds, so no host `npm install` is needed.
- Real voice calls: India routes through Plivo; US calls can route through Twilio when configured. Woxza sends Plivo a per-call answer URL itself—there is no standard outbound Plivo-console Answer URL to configure.

Use [`.env.example`](.env.example) for the full list of optional configuration values. Keep `.env` private; it contains secrets and is intentionally ignored by Git.
