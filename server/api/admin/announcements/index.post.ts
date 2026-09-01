import { z } from 'zod';
import { pool } from '../../../db/pool';
import { PushService } from '../../../services/pushService';

const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  priority: z.enum(['INFO', 'WARNING', 'IMPORTANT']).default('INFO'),
  link: z.string().url().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  published: z.boolean().default(false),
});

export default defineEventHandler(async (event) => {
  const parsed = announcementSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Dados inválidos.' });
  }
  const a = parsed.data;
  const { rows } = await pool.query(
    `INSERT INTO announcements (title, body, priority, link, image_url, published)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [a.title, a.body, a.priority, a.link ?? null, a.imageUrl ?? null, a.published]
  );

  if (a.published) {
    await PushService.broadcast({ title: a.title, body: a.body });
  }
  setResponseStatus(event, 201);
  return { id: rows[0].id };
});
