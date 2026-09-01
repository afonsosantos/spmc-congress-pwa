import { pool } from '../../../db/pool';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!;
  await pool.query('DELETE FROM content_pages WHERE slug = $1', [slug]);
  return { ok: true };
});
