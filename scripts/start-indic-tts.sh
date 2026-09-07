#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "$0")/.." && pwd)"
service_root="$project_root/third_party/Indic-TTS"
service_url="${INDIC_TTS_URL:-http://127.0.0.1:5050}"
session_name="woxza_indic_tts"

if curl -fsS --max-time 2 "$service_url/health" >/dev/null 2>&1; then
  echo "Indic-TTS is already healthy at $service_url"
  exit 0
fi

if [[ ! -x "$service_root/.venv-benchmark/bin/python" || ! -d "$service_root/checkpoints/te" ]]; then
  echo "Indic-TTS benchmark runtime or Telugu checkpoint is missing in $service_root" >&2
  exit 1
fi

screen -S "$session_name" -X quit >/dev/null 2>&1 || true
screen -dmS "$session_name" zsh -lc "cd '$service_root' && PYTHONDONTWRITEBYTECODE=1 MPLCONFIGDIR=/tmp/indic-tts-mpl INDIC_TTS_LANGUAGES=te .venv-benchmark/bin/python -u woxza_server.py > /tmp/woxza-indic-tts.log 2>&1"

for attempt in {1..15}; do
  if curl -fsS --max-time 2 "$service_url/health"; then
    echo
    exit 0
  fi
  sleep 1
done

echo "Indic-TTS did not become healthy. Inspect /tmp/woxza-indic-tts.log" >&2
exit 1
