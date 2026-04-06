#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[usage-publish] $(date '+%Y-%m-%d %H:%M:%S') starting"

if [ -n "$(git status --porcelain)" ]; then
  echo "[usage-publish] repo has local changes; aborting to avoid clobbering work"
  git status --short
  exit 1
fi

git pull --rebase origin main

./scripts/usage-site

git add usage/index.html usage-data/codex-usage.json usage-data/claude-usage.json

if git diff --cached --quiet; then
  echo "[usage-publish] no usage changes to publish"
  exit 0
fi

git commit -m "Update AI usage snapshot"
git push origin main

echo "[usage-publish] publish complete"
