import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pool } from './pool';
import { logger } from '../utils/logger';

// Resolved from cwd, not import.meta.url — Nitro bundles this file into
// .nuxt/dev or .output/server, so an import.meta.url-relative path would
// point at the bundle's location instead of the real migrations/ directory.
// cwd is the project root in every context this runs in (the `migrate`
// script, `nuxt dev`, and the production Nitro server).
const migrationsDir = path.join(process.cwd(), 'server/db/migrations');

export async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
  const { rows } = await pool.query<{ name: string }>('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.name));

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(migrationsDir, file), 'utf-8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      logger.info('migration applied', { file });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
