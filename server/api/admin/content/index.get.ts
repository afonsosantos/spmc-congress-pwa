import { pool } from '../../../db/pool';

export default defineEventHandler(async () => {
  const { rows } = await pool.query(
    'SELECT slug, title, body, icon, section, position, visible, updated_at AS "updatedAt" FROM content_pages ORDER BY section, position, slug'
  );
  return { pages: rows };
});
