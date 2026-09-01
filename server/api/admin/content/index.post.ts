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
const slugSchema = z
  .string()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug deve conter apenas letras minúsculas, números e hífens.');

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const slugParsed = slugSchema.safeParse(body?.slug);
  const parsed = contentSchema.safeParse(body);
  if (!slugParsed.success || !parsed.success) {
    throw createError({ statusCode: 400, message: 'Dados inválidos.' });
  }
  const a = parsed.data;
  try {
    await pool.query(
      `INSERT INTO content_pages (slug, title, body, icon, section, position, visible) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [slugParsed.data, a.title, a.body, a.icon, a.section, a.position, a.visible]
    );
  } catch (err) {
    if ((err as { code?: string }).code === '23505') {
      throw createError({ statusCode: 409, message: 'Já existe uma página com este slug.' });
    }
    throw err;
  }
  setResponseStatus(event, 201);
  return { slug: slugParsed.data };
});
