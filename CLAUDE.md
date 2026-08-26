# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A mobile-first PWA for the SPMC Congress 2027, replacing the attendee-facing part of Venueless. Vue 3 frontend + Express/PostgreSQL backend, deployed as a single Docker image. Two upstream services are the sources of truth and are never duplicated locally beyond what the app needs:

- **Pretix** — ticketing/registration. The app authenticates participants via their ticket QR *without ever redeeming the ticket*.
- **Pretalx** — talks/schedule. The app caches the public confirmed schedule server-side.

## Commands

Run from `backend/` or `frontend/` respectively (no root-level script runner).

```bash
# backend — Bun runs the TypeScript directly, no compile step
bun run dev            # bun --watch src/index.ts, loads env from process.env (not dotenv — see Environment)
bun run typecheck      # tsc --noEmit — the only place types are actually checked; nothing else in the
                        # pipeline compiles or blocks on type errors
bun run migrate        # runs pending SQL migrations against DATABASE_URL
bun test                # runs scripts/run-tests.ts, which shells out to `bun test <file>` once per
                        # file — see Testing approach below for why single-file isolation matters here;
                        # to run just one file directly: bun test test/pretixQr.test.ts

# frontend
bun run dev             # vite, HTTPS via @vitejs/plugin-basic-ssl (self-signed) — needed for
                        # camera access when testing the QR scanner from a phone on the LAN
bun run build            # vite build only (still needs an actual bundler — Bun doesn't replace
                        # Vite here, it's just the package manager/script runner)
bun run typecheck       # vue-tsc -b — deliberately NOT part of `build` (see note below)
bun test                 # bun:test, test/pretixQr.test.ts
```

Full stack: `docker compose up -d --build` from the repo root (needs `.env`, see `.env.example`). Production hosts that pull the CI-built image instead of building locally use `docker-compose.prod.yml`.

### Environment loading

Nothing in the backend loads `.env` files itself (`env.ts` just does `schema.parse(process.env)`) — Docker Compose injects vars directly. For local dev, use bun's `--env-file` flag (or `set -a; source .env.local; set +a`) since bun does not auto-load `.env` from a parent directory. **`NODE_ENV=production` marks the session cookie `Secure`, which browsers drop over plain `http://localhost`** — use a local env file with `NODE_ENV=development` for local testing, or login silently fails.

## Architecture

### Auth: Pretix ticket QR → app session (the core, security-sensitive flow)

1. Frontend scans a QR (`frontend/src/lib/pretixQr.ts`, camera via `jsqr`) and extracts a raw candidate secret — this file only parses, it never validates.
2. `POST /api/auth/ticket` (`backend/src/routes/auth.ts`) re-parses with the mirrored `backend/src/lib/pretixQr.ts`, then calls `PretixService.findValidPositionBySecret`.
3. `PretixService` (`backend/src/services/pretixService.ts`) looks up the ticket via `GET /orderpositions/?secret=...` — a documented **read-only** Pretix filter. This is deliberate: it's how the ticket is validated *without redeeming/checking it in*. Never call a check-in/redeem endpoint here.
4. On success, `ParticipantService.upsertFromPretix` writes a local `participants` row through an **explicit answer-identifier allow-list** (`EXPOSED_ANSWER_IDENTIFIERS` in `participantService.ts`) — raw Pretix payloads (payment info, internal metadata) never reach the DTO or the frontend. Adding a new exposed field means adding its identifier to that allow-list, not passing objects through.
5. `SessionService` issues a random token; only its SHA-256 hash is persisted in `app_sessions` (`backend/src/db/migrations/0001_init.sql`) — the raw token exists only in the httpOnly cookie. Sessions are short-lived (12h).

Ticket secrets and session tokens must never appear in logs — `backend/src/logger.ts` is a thin structured-JSON wrapper; don't `console.log` raw request/response bodies around auth.

### Pretalx sync

`PretalxService` (`backend/src/services/pretalxService.ts`) polls `GET /submissions/?state=confirmed&expand=slots,...` on an in-memory cache (5 min TTL + background refresh), serving stale data on upstream failure rather than erroring. **The Pretalx API field is `slots` (an array — a submission can have more than one scheduled occurrence, e.g. a repeated workshop), not `slot`.** Each slot becomes one `Session`; when a submission has multiple slots, the session id is `${code}-${slot.id}` to keep favourites unique, otherwise it's just the submission `code`. Rooms/speakers/tracks are separate cached collections, joined onto sessions at read time in `mapSession`.

No Pretalx credentials exist anywhere in this app — the public API returns confirmed/scheduled submissions to unauthenticated requests by design.

### Backend shape

Routes (`backend/src/routes/*.ts`) are thin; behavior lives in `backend/src/services/*.ts`. `backend/src/app.ts` wires Helmet/CORS/rate-limiting/cookies, mounts routers under `/api/*`, and — when `backend/public/` exists (populated by the Docker build copying the frontend's `dist/`) — serves the built SPA with a catch-all fallback. `express-async-errors` is imported for side effects so async route handlers don't need manual try/catch to reach the error middleware.

There's no `dist/` — the backend runs straight from `src/` under Bun, in dev and in the production image alike. `tsc` only ever runs via `bun run typecheck`, never as part of starting or deploying the app.

**Frontend `build` doesn't type-check either, for a Bun-specific reason.** `vue-tsc`'s bin has a `#!/usr/bin/env node` shebang; Bun intercepts that and runs it under its own JS engine rather than real Node (there's no separate `node` binary in the `oven/bun` image). Under that path, `vue-tsc -b` fails to resolve `.vue` SFC modules at all (`TS2307: Cannot find module './App.vue'`) — reproduced only inside the Alpine/Bun container, not on Node, and not with a plain `bun install` + `vue-tsc` on Windows either, so it looks like a Bun-runtime-specific quirk in how `vue-tsc` walks the module graph, not a real dependency/lockfile problem. Root cause wasn't fully chased down (no Linux+Bun sandbox to poke at it in); the pragmatic fix was to stop gating the Docker build on it, mirroring the backend's `typecheck`-is-separate approach. Run `bun run typecheck` yourself before relying on type safety — CI doesn't.

Sessions/favourites/announcements/push-subscriptions/content-pages live in Postgres (`backend/src/db/migrations/`); there's no ORM — raw `pg` queries via `backend/src/db/pool.ts`. Migrations are plain numbered `.sql` files tracked in a `schema_migrations` table, applied by `backend/src/db/migrate.ts` (also invoked automatically at server startup in `index.ts`).

### Frontend shape

Pinia stores (`frontend/src/stores/*.ts`) own all server state; views/components read from stores rather than calling `api` directly where a store exists. `frontend/src/lib/api.ts` is the only fetch wrapper — same-origin `/api` only, `credentials: 'include'`, never carries Pretix/Pretalx credentials (there are none client-side). The service worker (`frontend/src/sw.ts`, injected via vite-plugin-pwa's `injectManifest` strategy — not the zero-config `generateSW` mode) handles `push`/`notificationclick` explicitly and caches the public program/content/announcements via Workbox, plus a `localStorage` fallback in `program.ts` for offline viewing — auth/participant data is deliberately excluded from that caching. If you need to change runtime caching rules, edit `sw.ts` directly; `vite.config.ts`'s `VitePWA()` call only carries the manifest and build wiring now.

`useTheme.ts` and other cross-cutting composables must be invoked eagerly in `main.ts`, not left to whichever lazy-loaded route happens to import them first — a composable that applies a side effect (like the dark-mode class) only runs when its module is first imported, so gating it behind a specific view causes it to activate inconsistently depending on navigation.

### Testing approach

No test database — `backend/test/helpers/fakePool.ts` is a hand-written in-memory stand-in for `pg.Pool` that pattern-matches on the SQL text the app actually issues; extend it by adding a new `sql.startsWith(...)` branch when a new query shape is introduced, mirroring the real query text. Pretix/Pretalx are mocked via `bun:test`'s `mock.module(specifier, () => ({...}))` (note the factory-function signature — this is not the same API as Node's `node:test` module mocking) or by stubbing `global.fetch` — real upstream services must never be hit from tests.

**`mock.module()` is process-wide in Bun**, not scoped to the file that calls it — unlike `node --test`, `bun test <a> <b>` runs every file in one process, so a mock registered in one file leaks into every file imported afterwards. That's why `bun test` is never invoked directly on the whole `test/` directory here; `backend/scripts/run-tests.ts` spawns one `bun test <file>` subprocess per test file instead. Frontend has only one test file so this doesn't come up there, but keep it in mind if a second one gets added.

## Deployment

Single multi-stage `Dockerfile`, `oven/bun:1-alpine` base throughout (no Node anywhere in the image). The frontend stage `bun install`s and `vite build`s; the runtime stage `bun install --production`s the backend's dependencies and copies `backend/src` in as-is — Bun executes it directly, so there's nothing to compile or copy out of a `dist/`. The frontend's `dist/` lands in the runtime image as `public/`, served by the one Express process alongside the API. `.github/workflows/docker-publish.yml` builds and pushes to `ghcr.io/afonsosantos/spmc-congress-pwa` on push to `main`; `docker-compose.prod.yml` pulls that image instead of building (for hosts like a Proxmox LXC that shouldn't build locally). GHCR packages default to private even on a public repo — check package visibility before expecting an unauthenticated `pull` to work.
