#!/usr/bin/env bash
# Runs the Nuxt dev server (app + API on one port).
set -e

if [ -f .env.local ]; then
  bun --env-file=.env.local run dev
else
  bun run dev
fi
