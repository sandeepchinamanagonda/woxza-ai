#!/usr/bin/env bash
set -euo pipefail

repo_input="${1:-}"
[[ -n "$repo_input" ]] || {
  echo "usage: install-project-skill.sh <repository>" >&2
  exit 2
}

repo_root="$(git -C "$repo_input" rev-parse --show-toplevel 2>/dev/null)" || {
  echo "agenthq-project-skill=error reason=not-a-git-repository" >&2
  exit 2
}

source_dir="${AGENTHQ_GLOBAL_SKILL_DIR:-$HOME/.claude/skills/agenthq}"
destination_dir="$repo_root/.claude/skills/agenthq"
marker="$destination_dir/.agenthq-managed"

[[ -s "$source_dir/SKILL.md" ]] || {
  echo "agenthq-project-skill=error reason=global-skill-missing" >&2
  exit 2
}

if [[ -e "$destination_dir" && ! -f "$marker" ]]; then
  echo "agenthq-project-skill=custom-preserved path=$destination_dir"
  exit 0
fi

status="installed"
[[ -f "$marker" ]] && status="refreshed"
mkdir -p "$destination_dir"

while IFS= read -r -d '' source_file; do
  relative_file="${source_file#"$source_dir"/}"
  [[ "$relative_file" == ".agenthq-managed" ]] && continue
  mkdir -p "$destination_dir/$(dirname "$relative_file")"
  cp "$source_file" "$destination_dir/$relative_file"
done < <(find "$source_dir" -type f -print0)

printf '%s\n' "managed-by=agenthq" "source=$source_dir" > "$marker"
echo "agenthq-project-skill=$status path=$destination_dir"
