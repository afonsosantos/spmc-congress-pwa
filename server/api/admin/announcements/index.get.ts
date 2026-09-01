import { pool } from '../../../db/pool';

export default defineEventHandler(async () => {
  const { rows } = await pool.query(
    'SELECT id, title, body, priority, link, image_url AS "imageUrl", published, created_at AS "createdAt" FROM announcements ORDER BY created_at DESC'
  );
  return { announcements: rows };
});
