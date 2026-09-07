#!/usr/bin/env bash
# Bring up the complete local Woxza demo stack. It intentionally does not modify
# external Plivo/Twilio console settings.
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

fail() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }
note() { printf '\n==> %s\n' "$*"; }

INSTALL_DEPENDENCIES=false
LOCAL_ONLY=false
for arg in "$@"; do
  case "$arg" in
    --install-dependencies) INSTALL_DEPENDENCIES=true ;;
    --local-only) LOCAL_ONLY=true ;;
    --help)
      printf 'Usage: ./setup.sh [--install-dependencies] [--local-only]\n'
      printf '  --install-dependencies  Install Docker Desktop/Engine, ngrok, and Python if needed.\n'
      printf '  --local-only            Start the website and API without configuring an ngrok tunnel.\n'
      exit 0 ;;
    *) fail "Unknown option: $arg. Run ./setup.sh --help." ;;
  esac
done

if $INSTALL_DEPENDENCIES; then
  note "Checking/installing host dependencies"
  "$ROOT_DIR/bootstrap-local.sh" --yes
fi

for command in docker curl awk sed; do
  command -v "$command" >/dev/null 2>&1 || fail "Missing '$command'. Ask your coding assistant to run: ./setup.sh --install-dependencies"
done
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 is required. Install or update Docker Desktop: https://docs.docker.com/get-docker/"

if [[ ! -f .env ]]; then
  note "Creating local configuration from .env.example"
  cp .env.example .env
fi

env_value() {
  local key="$1" value
  value="$(awk -F= -v key="$key" '$1 == key { value=substr($0, length(key) + 2) } END { print value }' .env)"
  value="${value#\"}"
  value="${value%\"}"
  printf '%s\n' "$value"
}

set_env() {
  local key="$1" value="$2" temporary
  temporary="$(mktemp)"
  awk -v key="$key" -v value="$value" '
    BEGIN { found=0 }
    $0 ~ "^" key "=" { print key "=" value; found=1; next }
    { print }
    END { if (!found) print key "=" value }
  ' .env > "$temporary"
  mv "$temporary" .env
}

# This script is exclusively for a developer's local Docker stack. Keep the
# browser and API in local-admin mode so every branch has the full feature set
# without sharing a production admin token. A random local-only token protects
# the admin endpoints from the public voice tunnel. Production uses
# .env.production and does not run this script.
LOCAL_ADMIN_TOKEN="$(env_value LOCAL_ADMIN_TOKEN)"
if [[ ! "$LOCAL_ADMIN_TOKEN" =~ ^[A-Fa-f0-9]{64}$ ]]; then
  command -v openssl >/dev/null 2>&1 || fail "Missing 'openssl', which is needed to create a local admin token."
  LOCAL_ADMIN_TOKEN="$(openssl rand -hex 32)"
  set_env LOCAL_ADMIN_TOKEN "$LOCAL_ADMIN_TOKEN"
fi
set_env VITE_LOCAL_ADMIN_MODE true
set_env VITE_LOCAL_ADMIN_TOKEN "$LOCAL_ADMIN_TOKEN"
set_env LOCAL_ADMIN_MODE true
RUN_SETUP_TEST_CALL="$(env_value LOCAL_SETUP_TEST_CALL)"

ngrok_url() {
  local ports="$(env_value NGROK_INSPECTOR_PORTS)" port body url
  ports="${ports:-4040 4041}"
  for port in $ports; do
    body="$(curl -fsS --max-time 2 "http://127.0.0.1:${port}/api/tunnels" 2>/dev/null || true)"
    # Ignore tunnels from other local projects. A matching public URL must
    # belong to a tunnel that forwards to this API's local port, 8787.
    url="$(printf '%s' "$body" | sed -nE 's/.*"public_url":"(https:[^"]+)".*"addr":"[^"]*:8787".*/\1/p' | head -n 1)"
    [[ -n "$url" ]] && { printf '%s\n' "$url"; return 0; }
  done
  return 1
}

wait_for_ngrok() {
  local attempt url
  for attempt in $(seq 1 20); do
    url="$(ngrok_url || true)"
    [[ -n "$url" ]] && { printf '%s\n' "$url"; return 0; }
    sleep 1
  done
  return 1
}

note "Starting PostgreSQL and Redis"
docker compose up -d db redis

PUBLIC_URL=""
VOICE_SECRETS_READY=true
for key in GEMINI_API_KEY PLIVO_AUTH_ID PLIVO_AUTH_TOKEN PLIVO_FROM_NUMBER; do
  value="$(env_value "$key")"
  [[ -n "$value" && "$value" != replace-with-* && "$value" != +910000000000 ]] || VOICE_SECRETS_READY=false
done

if [[ "$RUN_SETUP_TEST_CALL" == "true" ]] && ! $VOICE_SECRETS_READY; then
  fail "LOCAL_SETUP_TEST_CALL requires valid Gemini and Plivo credentials in .env."
fi

if { ! $LOCAL_ONLY || [[ "$RUN_SETUP_TEST_CALL" == "true" ]]; } && $VOICE_SECRETS_READY && command -v ngrok >/dev/null 2>&1; then
  note "Obtaining a public ngrok URL for voice calls"
  PUBLIC_URL="$(ngrok_url || true)"
  if [[ -z "$PUBLIC_URL" ]]; then
    AUTHTOKEN="$(env_value NGROK_AUTHTOKEN)"
    if [[ -n "$AUTHTOKEN" ]]; then ngrok config add-authtoken "$AUTHTOKEN" >/dev/null; fi
    RUNTIME_DIR="$ROOT_DIR/.runtime"
    mkdir -p "$RUNTIME_DIR"
    DOMAIN="$(env_value NGROK_DOMAIN)"
    if [[ -n "$DOMAIN" ]]; then nohup ngrok http --url="$DOMAIN" 8787 > "$RUNTIME_DIR/ngrok.log" 2>&1 &
    else nohup ngrok http 8787 > "$RUNTIME_DIR/ngrok.log" 2>&1 &
    fi
    echo $! > "$RUNTIME_DIR/ngrok.pid"
    PUBLIC_URL="$(wait_for_ngrok || true)"
    [[ -n "$PUBLIC_URL" ]] || fail "ngrok did not expose a tunnel. Add NGROK_AUTHTOKEN to .env or inspect .runtime/ngrok.log."
  fi
  set_env PUBLIC_API_URL "$PUBLIC_URL"
  note "Using public API URL: $PUBLIC_URL"
else
  note "Starting in local test mode (all demo controls are enabled; a real phone call still needs valid Gemini, carrier, and public-tunnel credentials)."
fi

note "Building dependencies and starting API, BullMQ worker, and frontend"
docker compose build --quiet api web
docker compose up -d api web

note "Waiting for API migrations and health check"
API_PORT="$(env_value API_PORT)"
API_PORT="${API_PORT:-8787}"
for attempt in $(seq 1 30); do
  if curl -fsS --max-time 2 "http://127.0.0.1:${API_PORT}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl -fsS --max-time 5 "http://127.0.0.1:${API_PORT}/health" >/dev/null || fail "API did not become healthy. Run: docker compose logs --tail=100 api"

run_setup_test_call() {
  local phone name language timeout attempt response call_id status
  phone="$(env_value LOCAL_SETUP_TEST_PHONE)"
  [[ -n "$phone" ]] || phone="$(env_value DEMO_TEST_PHONE)"
  name="$(env_value LOCAL_SETUP_TEST_NAME)"
  language="$(env_value LOCAL_SETUP_TEST_LANGUAGE)"
  timeout="$(env_value LOCAL_SETUP_TEST_TIMEOUT_SECONDS)"
  name="${name:-Sabdeep}"
  language="${language:-en}"
  timeout="${timeout:-90}"

  [[ "$phone" =~ ^\+[1-9][0-9]{7,14}$ ]] || fail "LOCAL_SETUP_TEST_PHONE must be a valid E.164 number, for example +918125869888."
  [[ "$language" =~ ^(en|te)$ ]] || fail "LOCAL_SETUP_TEST_LANGUAGE must be en or te."
  [[ "$timeout" =~ ^[1-9][0-9]*$ ]] || fail "LOCAL_SETUP_TEST_TIMEOUT_SECONDS must be a positive number."
  [[ -n "$PUBLIC_URL" ]] || fail "LOCAL_SETUP_TEST_CALL requires a public callback tunnel."
  curl -fsS --max-time 8 "$PUBLIC_URL/health" >/dev/null || fail "The public callback URL is not reachable: $PUBLIC_URL/health"

  note "Placing the configured local setup test call"
  response="$(curl -fsS --max-time 15 -X POST "http://127.0.0.1:${API_PORT}/api/demo/call" \
    -H 'content-type: application/json' \
    --data "{\"name\":\"${name}\",\"country_code\":\"${phone%%[0-9]*}\",\"phone_number\":\"${phone#${phone%%[0-9]*}}\",\"language\":\"${language}\",\"entry_hint\":null,\"consent\":true}")" \
    || fail "The setup test call could not be created."
  call_id="$(printf '%s' "$response" | sed -nE 's/.*"callId":"([^"]+)".*/\1/p')"
  [[ -n "$call_id" ]] || fail "The setup test call was rejected: $response"

  for attempt in $(seq 1 "$timeout"); do
    status="$(curl -fsS --max-time 3 "http://127.0.0.1:${API_PORT}/api/demo-call/${call_id}/status" | sed -nE 's/.*"status":"([^"]+)".*/\1/p' || true)"
    case "$status" in
      connected) note "Local setup test call connected."; return 0 ;;
      failed|no_answer|completed) fail "Local setup test call ended with status: $status" ;;
    esac
    sleep 1
  done
  fail "Local setup test call did not connect within ${timeout} seconds."
}

if [[ "$RUN_SETUP_TEST_CALL" == "true" ]]; then
  run_setup_test_call
fi

WEB_PORT="$(env_value WEB_PORT)"
WEB_PORT="${WEB_PORT:-3456}"

printf '\nWoxza is running.\n'
printf '  Frontend: http://localhost:%s\n' "$WEB_PORT"
printf '  API:      http://localhost:%s/health\n' "$API_PORT"
printf '  Admin:    http://localhost:%s/admin/features\n' "$WEB_PORT"
if [[ -n "$PUBLIC_URL" ]]; then
  printf '  ngrok:    %s\n' "$PUBLIC_URL"
  printf '\nOutbound demo calls need no Plivo Console Answer URL change: Woxza sends the per-call answer URL automatically.\n'
  printf 'For optional direct Twilio inbound tests, manually set: %s/webhooks/twilio/voice\n' "$PUBLIC_URL"
else
  printf '\nTo enable real phone calls, add Gemini, Plivo, and NGROK_AUTHTOKEN values to .env, then run ./setup.sh again.\n'
fi
