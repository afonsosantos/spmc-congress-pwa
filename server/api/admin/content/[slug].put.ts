import { z } from 'zod';
import { pool } from '../../../db/pool';

const contentSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(20000),
  icon: z.string().min(1).max(50).default('doc'),
  section: z.enum(['info', 'legal']).default('info'),
  position: z.number().int().default(0),
  visible: z.boolean().default(true),
});

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!;
  const parsed = contentSchema.partial().safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Dados inválidos.' });
  }
  const a = parsed.data;
  const { rowCount } = await pool.query(
    `UPDATE content_pages SET
       title = COALESCE($2, title),
       body = COALESCE($3, body),
       icon = COALESCE($4, icon),
       section = COALESCE($5, section),
       position = COALESCE($6, position),
       visible = COALESCE($7, visible),
       updated_at = now()
     WHERE slug = $1`,
    [slug, a.title, a.body, a.icon, a.section, a.position, a.visible]
  );
  if (!rowCount) {
    throw createError({ statusCode: 404, message: 'Não encontrado.' });
  }
  return { ok: true };
});
