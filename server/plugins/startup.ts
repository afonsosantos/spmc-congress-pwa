import { runMigrations } from '../db/migrate';
import { PretalxService } from '../services/pretalxService';

export default defineNitroPlugin(async () => {
  await runMigrations();
  await PretalxService.getSessions().catch((err) => {
    logger.warn('initial pretalx fetch failed, will retry in background', { error: (err as Error).message });
  });
  PretalxService.startBackgroundRefresh();
  logger.info('server started', { env: env.NODE_ENV });
});
