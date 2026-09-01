import { z } from 'zod';
import { pool } from '../../../db/pool';

const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  priority: z.enum(['INFO', 'WARNING', 'IMPORTANT']).default('INFO'),
  link: z.string().url().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  published: z.boolean().default(false),
});

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!;
  const parsed = announcementSchema.partial().safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Dados inválidos.' });
  }
  const a = parsed.data;
  const { rowCount } = await pool.query(
    `UPDATE announcements SET
       title = COALESCE($2, title),
       body = COALESCE($3, body),
       priority = COALESCE($4, priority),
       link = COALESCE($5, link),
       image_url = COALESCE($6, image_url),
       published = COALESCE($7, published),
       updated_at = now()
     WHERE id = $1`,
    [id, a.title, a.body, a.priority, a.link, a.imageUrl, a.published]
  );
  if (!rowCount) {
    throw createError({ statusCode: 404, message: 'Não encontrado.' });
  }
  return { ok: true };
});
