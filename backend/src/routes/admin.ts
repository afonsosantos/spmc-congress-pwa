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

const contentSchema = z.object({ title: z.string().min(1).max(200), body: z.string().max(20000) });

adminRouter.get('/content', async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT slug, title, updated_at AS "updatedAt" FROM content_pages ORDER BY slug'
  );
  res.json({ pages: rows });
});

adminRouter.put('/content/:slug', async (req, res) => {
  const parsed = contentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos.' });
    return;
  }
  await pool.query(
    `INSERT INTO content_pages (slug, title, body, updated_at) VALUES ($1, $2, $3, now())
     ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, updated_at = now()`,
    [req.params.slug, parsed.data.title, parsed.data.body]
  );
  res.json({ ok: true });
});
