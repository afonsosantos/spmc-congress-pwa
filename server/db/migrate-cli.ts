// Standalone entry point for `bun run migrate` — kept separate from
// migrate.ts itself so the process.exit() calls below can never fire when
// runMigrations() is imported by the Nitro server (server/plugins/startup.ts).
// A same-file "am I the entry point?" check via import.meta.url doesn't
// survive bundling: Nitro inlines migrate.ts into the single .output/server
// entry file, where import.meta.url ends up matching process.argv[1] too —
// which used to trigger this file's process.exit(0) and kill the whole
// server right after boot-time migrations ran.
import { runMigrations } from './migrate';
import { logger } from '../utils/logger';

runMigrations()
  .then(() => {
    logger.info('migrations complete');
    process.exit(0);
  })
  .catch((err) => {
    logger.error('migration failed', { error: String(err) });
    process.exit(1);
  });
