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

if ! $LOCAL_ONLY && $VOICE_SECRETS_READY && command -v ngrok >/dev/null 2>&1; then
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
  note "Starting in local-preview mode (website and API work; real phone calls are disabled until Gemini, Plivo, and ngrok are configured)."
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
WEB_PORT="$(env_value WEB_PORT)"
WEB_PORT="${WEB_PORT:-3456}"

printf '\nWoxza is running.\n'
printf '  Frontend: http://localhost:%s\n' "$WEB_PORT"
printf '  API:      http://localhost:%s/health\n' "$API_PORT"
if [[ -n "$PUBLIC_URL" ]]; then
  printf '  ngrok:    %s\n' "$PUBLIC_URL"
  printf '\nOutbound demo calls need no Plivo Console Answer URL change: Woxza sends the per-call answer URL automatically.\n'
  printf 'For optional direct Twilio inbound tests, manually set: %s/webhooks/twilio/voice\n' "$PUBLIC_URL"
else
  printf '\nTo enable real phone calls, add Gemini, Plivo, and NGROK_AUTHTOKEN values to .env, then run ./setup.sh again.\n'
fi
