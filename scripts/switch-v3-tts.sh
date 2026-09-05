#!/usr/bin/env bash
set -euo pipefail

provider="${1:-}"
if [[ "$provider" != "sarvam" && "$provider" != "indic" ]]; then
  echo "Usage: $0 <sarvam|indic>" >&2
  exit 64
fi

project_root="$(cd "$(dirname "$0")/.." && pwd)"
env_file="$project_root/.env"
if [[ ! -f "$env_file" ]]; then
  echo "Missing $env_file" >&2
  exit 1
fi

if [[ "$provider" == "indic" ]]; then
  "$project_root/scripts/start-indic-tts.sh"
fi

cp "$env_file" "$env_file.tts-switch-backup"
if rg -q '^V3_TTS_PROVIDER=' "$env_file"; then
  sed -i '' "s/^V3_TTS_PROVIDER=.*/V3_TTS_PROVIDER=$provider/" "$env_file"
else
  printf '\nV3_TTS_PROVIDER=%s\n' "$provider" >> "$env_file"
fi

docker compose -f "$project_root/docker-compose.yml" up -d --force-recreate api
echo "V3 TTS provider is now: $provider"
echo "Rollback: $project_root/scripts/switch-v3-tts.sh sarvam"
