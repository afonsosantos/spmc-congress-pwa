import { env } from './env.js';
import { runMigrations } from './db/migrate.js';
import { createApp } from './app.js';
import { PretalxService } from './services/pretalxService.js';
import { logger } from './logger.js';

async function main() {
  await runMigrations();
  await PretalxService.getSessions().catch((err) => {
    logger.warn('initial pretalx fetch failed, will retry in background', { error: (err as Error).message });
  });
  PretalxService.startBackgroundRefresh();

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info('server started', { port: env.PORT, env: env.NODE_ENV });
  });
}

main().catch((err) => {
  logger.error('fatal startup error', { error: String(err) });
  process.exit(1);
});
