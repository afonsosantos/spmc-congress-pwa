import { pool } from '../../db/pool';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!;
  const { rows } = await pool.query(
    'SELECT slug, title, body, icon, section, updated_at AS "updatedAt" FROM content_pages WHERE slug = $1 AND visible = true',
    [slug]
  );
  if (!rows[0]) {
    throw createError({ statusCode: 404, message: 'Página não encontrada.' });
  }
  return { page: rows[0] };
});
