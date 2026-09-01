# SPMC Congress 2027 — PWA

Mobile-first PWA for the II Congresso Internacional de Medicina Chinesa. Nuxt 4 (Vue 3 + Nitro), PostgreSQL, ticket-based login via Pretix QR codes, and schedule sync from Pretalx — one app, one process.

## Stack

- Nuxt 4 (Vue 3, TypeScript, Vite, Pinia, Tailwind CSS, PWA/Workbox) for the client, in SPA mode (`ssr: false`)
- Nitro (bundled with Nuxt, `bun` preset) for the `/api/*` server routes and PostgreSQL access — runs TypeScript directly, no compile step
- Deployment: single Docker image (`oven/bun` base) + `docker compose`

## Local development

```bash
cp .env.example .env.local   # fill in Pretix/Pretalx/DB values; NODE_ENV=development for local HTTPS-free cookies
bun install
bun --env-file=.env.local run migrate
./dev.sh   # http://localhost:5173 — app + /api on one port
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
