#!/usr/bin/env bash
# Runs backend and frontend dev servers together. Ctrl-C stops both.
set -e
trap 'kill 0' EXIT

if [ -f .env.local ]; then
  (cd backend && bun --env-file=../.env.local --watch src/index.ts) &
else
  (cd backend && bun run dev) &
fi

(cd frontend && bun run dev) &

wait
