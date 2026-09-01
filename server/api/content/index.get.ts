import { pool } from '../../db/pool';

export default defineEventHandler(async () => {
  const { rows } = await pool.query(
    'SELECT slug, title, icon, section, position FROM content_pages WHERE visible = true ORDER BY section, position, title'
  );
  return { pages: rows };
});
