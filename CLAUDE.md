# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A mobile-first PWA for the SPMC Congress 2027, replacing the attendee-facing part of Venueless. A single Nuxt 4 app (Vue 3 client + Nitro server), deployed as one Docker image. Two upstream services are the sources of truth and are never duplicated locally beyond what the app needs:

- **Pretix** — ticketing/registration. The app authenticates participants via their ticket QR *without ever redeeming the ticket*.
- **Pretalx** — talks/schedule. The app caches the public confirmed schedule server-side.

The app used to be two separate packages (`frontend/` Vite+Vue, `backend/` Express) built into one Docker image. It was merged into a single Nuxt 4 project — Nitro replaces Express, file-based routing replaces manual Vue Router / Express Router config, and there's one `package.json`/lockfile instead of two.

## Commands

```bash
bun install              # one lockfile for the whole app
bun run dev               # nuxt dev — HTTPS via devServer.https (self-signed) on :5173, app + /api on one port —
                           # needed for camera access when testing the QR scanner from a phone on the LAN
bun run build              # nuxt build → .output/ (client + server bundles, PWA service worker, precache manifest)
bun run preview             # bun run .output/server/index.mjs, i.e. run the production build locally
bun run typecheck          # nuxt typecheck — deliberately NOT part of build (see note below)
bun run migrate             # bun run server/db/migrate-cli.ts — runs pending SQL migrations against DATABASE_URL
bun test                    # runs scripts/run-tests.ts, which shells out to `bun test <file>` once per file under
                             # test/ (recursively) — see Testing approach below for why single-file isolation matters
./dev.sh                    # bun --env-file=.env.local run dev if a repo-root .env.local exists, else plain `bun run dev`
                             # (which fails fast on missing required env vars — see Environment loading below)
```

Full stack: `docker compose up -d --build` from the repo root (needs `.env`, see `.env.example`). Production hosts that pull the CI-built image instead of building locally use `docker-compose.prod.yml`.

### Environment loading

Nothing loads `.env` files itself (`server/utils/env.ts` just does `schema.parse(process.env)`) — Docker Compose injects vars directly. For local dev, use `./dev.sh` (picks up `.env.local` via bun's `--env-file`) or `bun --env-file=.env.local run dev` directly; bun does not auto-load `.env` from a parent directory. **`NODE_ENV=production` marks the session cookie `Secure`, which browsers drop over plain `http://localhost`** — use a local env file with `NODE_ENV=development` for local testing, or login silently fails. (Dev already runs over HTTPS by default via `devServer.https`, so this mostly matters for `bun run preview` / a non-HTTPS local prod build.)

There is no `CORS_ORIGIN` env var anymore — merging frontend and backend into one Nitro app made cross-origin API calls disappear entirely (same-origin by construction), so the old `cors` middleware and origin allow-list were deleted, not ported.

## Architecture

### SPA mode, not SSR

`nuxt.config.ts` sets `ssr: false`. The whole app is participant-data-gated (nothing meaningful pre-renders for a logged-out user), the core interaction is a camera-based QR scan (`jsqr`, client-only by nature), and several modules read `localStorage`/`document`/`navigator` (`app/utils/i18n.ts`, `app/composables/useTheme.ts`) — none of that needs SSR-safety guards because nothing in `app/` ever executes server-side, in dev or in the production build. Nitro serves a static SPA shell plus the `/api/*` routes from one process; there is no Vue rendering on the server at all. Don't reintroduce SSR-oriented patterns (`useAsyncData` for cross-request caching, `useState` for hydration) expecting them to behave as they would in a normal Nuxt app — with `ssr: false` they're just client-side reactive state, same as a plain `ref`.

### Auto-imports — what's implicit and what isn't

This app leans on Nuxt/Nitro's auto-import system rather than explicit imports, per Nuxt convention:

- **`app/composables/*.ts`, `app/utils/*.ts`** — auto-imported anywhere in `app/` (pages, components, stores, plugins). Named exports only; no `import` needed. This is where `api`/`ApiError` (`app/utils/api.ts`), `i18n`/`setLocale`/`translateApiErrorMessage`/`SUPPORTED_LOCALES` (`app/utils/i18n.ts`), `formatTime`/`formatDate`/etc. (`app/utils/format.ts`), `useTheme`/`useNow`/`useOnlineStatus` (`app/composables/`), and `ONBOARDING_SEEN_KEY`/`subscribeToPush` live. `Icon.vue`, `SessionCard.vue`, etc. under `app/components/` are auto-imported as components the same way.
- **`server/utils/*.ts`** — auto-imported anywhere in `server/` (api routes, middleware, plugins, services, db). `env`, `logger`, `rateLimit`, `requireAuth` live here and are used without an import statement in `server/api/*` and `server/middleware/*`.
- **`shared/utils/*.ts`** — auto-imported in *both* contexts. `parsePretixTicketQr` (`shared/utils/pretixQr.ts`) lives here: the client calls it optimistically when a QR is scanned (never validates, just extracts a candidate secret), the server calls the *same* function authoritatively in `server/api/auth/ticket.post.ts`. Before the Nuxt merge this was two independently-maintained copies (frontend and backend were separate packages with no code-sharing mechanism); consolidating them into `shared/` was a deliberate cleanup, not just a port — if you touch the parsing logic, there's only one place to change it now.
- **`server/services/*.ts`, `server/db/*.ts`** — **not** auto-imported; explicit relative imports on purpose. These files are also imported directly by `bun:test` files under `test/server/`, which run outside Nitro's build pipeline entirely (plain `bun test some-file.ts`) — Nitro's auto-import transform never touches them, so anything relying on it would be a silent `ReferenceError` at test time. `server/db/migrate.ts` has the same constraint via the `migrate` script (`server/db/migrate-cli.ts`, also outside Nitro). If you add a new server-side service or db helper that needs `env`/`logger`, import them explicitly, matching the existing files in `server/services/` — don't assume auto-import "just works" there.

**`server/db/migrate.ts` exports only `runMigrations()` — no CLI-runner/`process.exit()` logic in that file.** That logic lives in the separate `server/db/migrate-cli.ts` (used only by the `migrate` script). They used to be one file with an `if (import.meta.url === pathToFileURL(process.argv[1]).href)` guard around the exit calls — that "am I the entry point?" check doesn't survive bundling: Nitro/rolldown inlines `migrate.ts` into the single `.output/server/index.mjs` entry file, where `import.meta.url` ends up matching `process.argv[1]` too, silently firing `process.exit(0)` right after boot-time migrations ran via `server/plugins/startup.ts` and killing the whole server a few hundred ms after it started listening — no crash, no error logged, it just stopped accepting connections. If you ever need a script that both imports `runMigrations` *and* exits on completion, keep that exit logic in its own file that nothing else imports, not back in `migrate.ts`.
- **Stores** (`app/stores/*.ts`) — `defineStore`, `storeToRefs` etc. are auto-imported via `@pinia/nuxt`, and the `useXStore()` composables they define are auto-imported the same way. Cross-store type imports (e.g. `SessionCard.vue` importing `type Session` from `@/stores/program`) are kept as explicit `import type` regardless — type re-exports through the stores auto-import path aren't guaranteed the way `app/utils` exports are.
- **`vue-i18n`'s `useI18n`** is auto-imported via an `imports.presets` entry in `nuxt.config.ts` (the pattern is copied straight from Nuxt's own auto-imports docs) — components call `useI18n()` with no import.

When in doubt about whether something is auto-imported, check which of the three directories above it lives in — that's the entire rule, there's no per-file opt-out.

### Auth: Pretix ticket QR → app session (the core, security-sensitive flow)

1. The client scans a QR (`app/pages/entrar.vue`, camera via `jsqr`) and calls `parsePretixTicketQr` (`shared/utils/pretixQr.ts`) to extract a raw candidate secret — this call only parses, it never validates.
2. `POST /api/auth/ticket` (`server/api/auth/ticket.post.ts`) re-parses with the *same* `parsePretixTicketQr`, then calls `PretixService.findValidPositionBySecret`.
3. `PretixService` (`server/services/pretixService.ts`) looks up the ticket via `GET /orderpositions/?secret=...` — a documented **read-only** Pretix filter. This is deliberate: it's how the ticket is validated *without redeeming/checking it in*. Never call a check-in/redeem endpoint here.
4. On success, `ParticipantService.upsertFromPretix` (`server/services/participantService.ts`) writes a local `participants` row through an **explicit answer-identifier allow-list** (`EXPOSED_ANSWER_IDENTIFIERS`) — raw Pretix payloads (payment info, internal metadata) never reach the DTO or the client. Adding a new exposed field means adding its identifier to that allow-list, not passing objects through.
5. `SessionService` (`server/services/sessionService.ts`) issues a random token; only its SHA-256 hash is persisted in `app_sessions` (`server/db/migrations/0001_init.sql`) — the raw token exists only in the httpOnly cookie, set via h3's `setCookie` (not Express's `res.cookie`). Sessions are short-lived (12h).
6. `server/middleware/00.attach-participant.ts` runs on every `/api/*` request, resolves the session cookie via `SessionService.resolve`, and sets `event.context.participantId` (typed via `server/types.d.ts`'s `H3EventContext` augmentation) — the Nitro-middleware equivalent of Express's old `attachParticipant`. `server/utils/requireAuth.ts` throws a 401 `createError` when it's missing, called explicitly at the top of any handler that needs auth (mirrors the old `requireAuth` Express middleware, just called per-handler instead of `router.use()`).

Ticket secrets and session tokens must never appear in logs — `server/utils/logger.ts` is a thin structured-JSON wrapper; don't `console.log` raw request/response bodies around auth.

### Pretalx sync

`PretalxService` (`server/services/pretalxService.ts`) polls `GET /submissions/?state=confirmed&expand=slots,...` on an in-memory cache (5 min TTL + background refresh via `server/plugins/startup.ts`), serving stale data on upstream failure rather than erroring. **The Pretalx API field is `slots` (an array — a submission can have more than one scheduled occurrence, e.g. a repeated workshop), not `slot`.** Each slot becomes one `Session`; when a submission has multiple slots, the session id is `${code}-${slot.id}` to keep favourites unique, otherwise it's just the submission `code`. Rooms/speakers/tracks are separate cached collections, joined onto sessions at read time in `mapSession`.

No Pretalx credentials exist anywhere in this app — the public API returns confirmed/scheduled submissions to unauthenticated requests by design. `POST /api/admin/pretalx/sync` bypasses the TTL for an on-demand refresh (used by the "force sync" button in the admin panel); the 5-minute background refresh runs regardless of whether anyone hits that endpoint.

### Admin panel

The admin API (`server/api/admin/**`, gated by `server/middleware/01.admin-auth.ts`, path-prefixed to `/api/admin`) is a **second, separate auth system** from the participant ticket-QR flow above — plain HTTP Basic auth checked against `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars (timing-safe compare, no session/cookie involved). If those env vars are unset, the whole admin API 503s rather than silently accepting any credentials. `app/pages/admin.vue` sends the Basic header on every request itself (`adminFetch`); credentials are never persisted, so admins re-enter them each visit. Announcements, content pages, and push subscriptions are plain Postgres tables managed entirely through `server/api/admin/**` — no separate CMS.

Web push (`server/services/pushService.ts`) is optional and self-disables via `pushConfigured` (`server/utils/env.ts`) when `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` aren't all set — don't assume push is always available.

### Server shape

`server/api/**` is Nitro's file-based routing — each Express router became a folder of h3 event handlers using the `.get.ts`/`.post.ts`/`.put.ts`/`.delete.ts` filename-method convention (e.g. the old `routes/auth.ts` is now `server/api/auth/ticket.post.ts`, `server/api/auth/me.get.ts`, `server/api/auth/logout.post.ts`). Route bodies read like the old Express handlers but with h3 primitives: `getRouterParam(event, 'x')` instead of `req.params.x`, `readBody(event)`/zod instead of `req.body`, `return x` instead of `res.json(x)`, `throw createError({statusCode, statusMessage})` instead of `res.status(n).json({error})`.

**`server/error.ts`** (wired via `nitro.errorHandler` in `nuxt.config.ts`) reshapes Nitro's default `{statusCode, statusMessage, message, stack}` error body into `{ error: string }` — the shape `app/utils/api.ts`'s `request()` has always expected (ported straight from the old Express error-handling middleware). Any `createError({statusCode, statusMessage})` thrown anywhere in `server/` comes back to the client in that shape automatically; you don't need to catch and reformat errors per-route.

**Rate limiting is a small hand-rolled in-memory limiter** (`server/utils/rateLimit.ts`), not `express-rate-limit` (which doesn't attach to h3 handlers). A `Map`-based sliding-window counter, used exactly where the old Express limiters were: ticket auth (10/15min), `/me/refresh` (20/15min), and a global 300/min on `/api/*` via `server/middleware/02.rate-limit.ts`. Single-process in-memory, matching this app's existing single-container deployment assumption (same as the Pretalx cache) — has a `ponytail:` comment marking the upgrade path (Redis-backed) if the app ever needs to scale to multiple instances.

**Security headers** come from the `nuxt-security` module (replaces `helmet()`), configured in `nuxt.config.ts`'s `security` block.

There's no `dist/` for the server — Nitro runs the `.output/server` bundle directly under Bun (`nitro.preset = 'bun'` in `nuxt.config.ts`); `tsc` only ever runs via `bun run typecheck`, never as part of building or starting the app.

**`nuxt typecheck` doesn't gate `nuxt build`, for the same Bun-runtime reason the old backend/frontend split called out.** `vue-tsc`'s bin has a `#!/usr/bin/env node` shebang; Bun intercepts that and runs it under its own JS engine rather than real Node. This was previously observed to break `.vue` SFC module resolution entirely under Bun/Alpine (reproduced only in that environment, not on Node) — the pragmatic fix carried over from the old setup is to keep typecheck a separate, non-blocking step. Run `bun run typecheck` yourself before relying on type safety — the Docker build doesn't.

Sessions/favourites/announcements/push-subscriptions/content-pages live in Postgres (`server/db/migrations/`); there's no ORM — raw `pg` queries via `server/db/pool.ts`. Migrations are plain numbered `.sql` files tracked in a `schema_migrations` table, applied by `runMigrations()` (`server/db/migrate.ts`), invoked automatically at server startup by `server/plugins/startup.ts` (a Nitro plugin — the equivalent of the old Express `index.ts`'s `main()`) and by the standalone `migrate` script (`server/db/migrate-cli.ts`).

### App shape

Pinia stores (`app/stores/*.ts`) own all server state; pages/components read from stores rather than calling `api` directly where a store exists. `app/utils/api.ts` is the only fetch wrapper — same-origin `/api` only, `credentials: 'include'`, never carries Pretix/Pretalx credentials (there are none client-side). Pages are file-based under `app/pages/` (replacing the old manual Vue Router config) — route *names* are Nuxt's auto-derived ones from the file path (`index`, `programa`, `programa-id`, `meu-horario`, `anuncios`, `mais`, `entrar`, `bilhete`, `info-slug`, `admin`), not the old custom names (`home`, `program`, `ticket`, etc.) — `BottomNav.vue`/`TopNav.vue`/`TicketFab.vue` compare against the new derived names; keep them in sync if a page file ever moves.

The service worker (`app/sw.ts`, injected via `@vite-pwa/nuxt`'s `injectManifest` strategy — not the zero-config `generateSW` mode) handles `push`/`notificationclick` explicitly and caches the public program/content/announcements via Workbox, plus a `localStorage` fallback in `app/stores/program.ts` for offline viewing — auth/participant data is deliberately excluded from that caching.

PWA updates are **manual, not silent**: `registerType: 'prompt'` + `injectRegister: false` in the `pwa` block of `nuxt.config.ts` disable the auto-injected registration script, and `app/components/UpdatePrompt.vue` registers the SW itself via `virtual:pwa-register/vue`, showing a reload banner instead of auto-reloading. Correspondingly, `app/sw.ts` does *not* call `self.skipWaiting()` unconditionally — it only skips waiting on a `SKIP_WAITING` message, sent by the prompt's `updateServiceWorker()` call when the user taps reload. Don't reintroduce an unconditional `skipWaiting()`; that silently reactivates the old auto-update behavior.

**`app/plugins/theme.client.ts` applies the saved/system theme eagerly, before mount** — the `.client` suffix plus running as a plugin (rather than leaving `useTheme()` to whichever lazy-loaded page happens to import it first) ensures the dark-mode class is set on every load regardless of navigation. `app/plugins/i18n.ts` installs the single shared `vue-i18n` instance (`app/utils/i18n.ts`) into the Vue app the same way. `app/plugins/debug-now.client.ts` carries over the `?now=` debug override (pins "now" for exercising congress-date logic without touching the device clock) that used to live inline in `main.ts`.

**The mobile bottom nav (`BottomNav.vue`) vs. desktop top nav (`TopNav.vue`) swap happens at the `lg` breakpoint (1024px), not `md`.** Tablet portrait/landscape widths (768–1023px) keep the bottom nav — there isn't enough room at those widths for the logo + full nav + ticket button. Anything else that positions itself relative to "is the bottom nav visible" (`TicketFab.vue`, `UpdatePrompt.vue`, `InstallPrompt.vue`, `app.vue`'s `<main>` padding) keys off the same `lg` breakpoint — keep them in sync if the swap point ever changes again.

`<NuxtLoadingIndicator>` (built into Nuxt) replaced a hand-rolled route-progress-bar component + composable that used to live alongside the router — no need to recreate that pattern for a "thin bar during a lazy page chunk load."

### Testing approach

No test database — `test/server/helpers/fakePool.ts` is a hand-written in-memory stand-in for `pg.Pool` that pattern-matches on the SQL text the app actually issues; extend it by adding a new `sql.startsWith(...)` branch when a new query shape is introduced, mirroring the real query text. Pretix/Pretalx are mocked via `bun:test`'s `mock.module(specifier, () => ({...}))` (note the factory-function signature — this is not the same API as Node's `node:test` module mocking) or by stubbing `global.fetch` — real upstream services must never be hit from tests.

**`mock.module()` is process-wide in Bun**, not scoped to the file that calls it — unlike `node --test`, `bun test <a> <b>` runs every file in one process, so a mock registered in one file leaks into every file imported afterwards. That's why `bun test` is never invoked directly on the whole `test/` directory here; `scripts/run-tests.ts` recursively finds every `*.test.ts` under `test/` and spawns one `bun test <file>` subprocess per file instead.

Server-side service tests (`test/server/*.test.ts`) import `server/services/*` and `shared/utils/pretixQr` directly via relative paths, which is exactly why those modules keep explicit imports instead of relying on Nitro's auto-import (see the Auto-imports section above): a bare `bun test` process never runs Nitro's build/transform step, so an auto-import-reliant reference would be a `ReferenceError` at runtime in tests even though it works fine when Nitro actually serves the route. There is currently no automated HTTP-level integration test exercising the full `server/middleware` → `server/api` request pipeline (cookies, admin Basic auth, rate limiting end-to-end) the way the old `routes.test.ts` did with `supertest` against `createApp()` — Nitro doesn't have a direct equivalent, and wiring up `@nuxt/test-utils` for that was deliberately deferred rather than done as part of the migration. If you need that coverage, `@nuxt/test-utils`'s `setup()` + `$fetch` against a running test server is the module's intended pattern for it.

## Deployment

Single-stage-plus-runtime `Dockerfile`, `oven/bun:1-alpine` base throughout (no Node anywhere in the image). The build stage `bun install`s the one root lockfile and runs `nuxt build`, producing `.output/` (client assets + Nitro server bundle in one place — no more copying a built SPA into a separate `public/` directory for Express to serve, since Nitro's `.output/public` already *is* the served client). The runtime stage copies just `.output/` and runs `bun run .output/server/index.mjs`. `.github/workflows/docker-publish.yml` builds and pushes to `ghcr.io/afonsosantos/spmc-congress-pwa` on push to `main`; `docker-compose.prod.yml` pulls that image instead of building (for hosts like a Proxmox LXC that shouldn't build locally). GHCR packages default to private even on a public repo — check package visibility before expecting an unauthenticated `pull` to work.

CI passes the commit SHA into the build stage as the `GIT_SHA` build arg (`ENV VITE_GIT_SHA=$GIT_SHA`), which Vite exposes to the app at build time; `app/pages/mais.vue` shows the short SHA at the bottom of Mais/More so a running deployment can be matched back to the commit that produced it. A `dev`/local build with no `GIT_SHA` arg falls back to showing "dev".
