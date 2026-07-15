#!/usr/bin/env bash
# Runs on the OCI instance. The application must be cloned at the deployment path
# and its production secrets must be stored in .env.production on that instance.
set -Eeuo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <commit-sha>" >&2
  exit 64
fi

target_sha="$1"
compose=(docker compose --env-file .env.production)

[[ -f .env.production ]] || { echo '.env.production is missing' >&2; exit 1; }
git diff --quiet || { echo 'Deployment directory has uncommitted changes' >&2; exit 1; }

previous_sha="$(git rev-parse HEAD)"
rollback() {
  status=$?
  echo "Deployment failed; restoring ${previous_sha}" >&2
  git reset --hard "$previous_sha"
  "${compose[@]}" up -d --build --remove-orphans || true
  exit "$status"
}
trap rollback ERR

git fetch --quiet origin main
git checkout --quiet --detach "$target_sha"
"${compose[@]}" up -d --build --remove-orphans

for attempt in {1..12}; do
  if curl --fail --silent --show-error http://127.0.0.1:8787/health >/dev/null; then
    echo "Deployed ${target_sha} successfully"
    trap - ERR
    exit 0
  fi
  sleep 5
done

echo 'API health check did not pass' >&2
exit 1
