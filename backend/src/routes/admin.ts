import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { PushService } from '../services/pushService.js';

export const adminRouter = Router();
adminRouter.use(requireAdmin);

const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  priority: z.enum(['INFO', 'WARNING', 'IMPORTANT']).default('INFO'),
  link: z.string().url().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  published: z.boolean().default(false),
});

adminRouter.get('/announcements', async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT id, title, body, priority, link, image_url AS "imageUrl", published, created_at AS "createdAt" FROM announcements ORDER BY created_at DESC'
  );
  res.json({ announcements: rows });
});

adminRouter.post('/announcements', async (req, res) => {
  const parsed = announcementSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
    return;
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
  res.status(201).json({ id: rows[0].id });
});

adminRouter.put('/announcements/:id', async (req, res) => {
  const parsed = announcementSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos.', details: parsed.error.flatten() });
    return;
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
    [req.params.id, a.title, a.body, a.priority, a.link, a.imageUrl, a.published]
  );
  if (!rowCount) {
    res.status(404).json({ error: 'Não encontrado.' });
    return;
  }
  res.json({ ok: true });
});

adminRouter.delete('/announcements/:id', async (req, res) => {
  await pool.query('DELETE FROM announcements WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

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

adminRouter.get('/content', async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT slug, title, body, icon, section, position, visible, updated_at AS "updatedAt" FROM content_pages ORDER BY section, position, slug'
  );
  res.json({ pages: rows });
});

adminRouter.post('/content', async (req, res) => {
  const slugParsed = slugSchema.safeParse(req.body?.slug);
  const parsed = contentSchema.safeParse(req.body);
  if (!slugParsed.success || !parsed.success) {
    res.status(400).json({ error: 'Dados inválidos.', details: { slug: slugParsed.error?.flatten(), ...parsed.error?.flatten() } });
    return;
  }
  const a = parsed.data;
  try {
    await pool.query(
      `INSERT INTO content_pages (slug, title, body, icon, section, position, visible) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [slugParsed.data, a.title, a.body, a.icon, a.section, a.position, a.visible]
    );
  } catch (err) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'Já existe uma página com este slug.' });
      return;
    }
    throw err;
  }
  res.status(201).json({ slug: slugParsed.data });
});

adminRouter.put('/content/:slug', async (req, res) => {
  const parsed = contentSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos.' });
    return;
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
    [req.params.slug, a.title, a.body, a.icon, a.section, a.position, a.visible]
  );
  if (!rowCount) {
    res.status(404).json({ error: 'Não encontrado.' });
    return;
  }
  res.json({ ok: true });
});

adminRouter.delete('/content/:slug', async (req, res) => {
  await pool.query('DELETE FROM content_pages WHERE slug = $1', [req.params.slug]);
  res.json({ ok: true });
});
