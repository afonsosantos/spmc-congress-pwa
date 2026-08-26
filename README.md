# SPMC Congress 2027 — PWA

Mobile-first PWA for the II Congresso Internacional de Medicina Chinesa. Vue 3 + TypeScript + Tailwind frontend, Express + PostgreSQL backend, ticket-based login via Pretix QR codes, and schedule sync from Pretalx.

## Stack

- Frontend: Vue 3, TypeScript, Vite, Vue Router, Pinia, Tailwind CSS, PWA (Workbox)
- Backend: Bun, Express, PostgreSQL — runs TypeScript directly, no compile step
- Deployment: single Docker image (`oven/bun` base, multi-stage build) + `docker compose`

## Local development

```bash
cp .env.example .env.local   # fill in Pretix/Pretalx/DB values; NODE_ENV=development for local HTTPS-free cookies
cd backend && bun install && bun --env-file=../.env.local run src/db/migrate.ts
bun --env-file=../.env.local run dev   # http://localhost:3000
cd ../frontend && bun install && bun run dev   # http://localhost:5173 (proxies /api to :3000)
```

The dev server runs over HTTPS with a self-signed cert (needed for camera access when testing the QR scanner from a phone on the LAN).

## Running the full stack with Docker

```bash
cp .env.example .env   # fill in real values
docker compose up -d --build
```

## Production deployment (prebuilt image)

`.github/workflows/docker-publish.yml` builds and pushes the image to `ghcr.io/afonsosantos/spmc-congress-pwa` on every push to `main`. To run it on a host that just pulls the image (e.g. a Docker-enabled Proxmox LXC container):

```bash
cp .env.example .env   # fill in real values
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

> First push: the GHCR package may default to private. Make it public (or `docker login ghcr.io` on the LXC) before pulling.

## Tests

```bash
cd backend && bun test
cd frontend && bun test
```

## License

Not specified — all rights reserved by SPMC unless stated otherwise.
