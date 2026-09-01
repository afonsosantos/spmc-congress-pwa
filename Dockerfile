# syntax=docker/dockerfile:1

FROM oven/bun:1-alpine AS build
ARG GIT_SHA=dev
ENV VITE_GIT_SHA=$GIT_SHA
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/.output ./.output
# Raw .sql migration files — read from disk at runtime (cwd-relative, see
# server/db/migrate.ts), not bundled into .output by the Nitro build.
COPY --from=build /app/server/db/migrations ./server/db/migrations

RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "run", ".output/server/index.mjs"]
