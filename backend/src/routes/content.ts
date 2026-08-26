import { Router } from 'express';
import { pool } from '../db/pool.js';

export const contentRouter = Router();

contentRouter.get('/:slug', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT slug, title, body, updated_at AS "updatedAt" FROM content_pages WHERE slug = $1',
    [req.params.slug]
  );
  if (!rows[0]) {
    res.status(404).json({ error: 'Página não encontrada.' });
    return;
  }
  res.json({ page: rows[0] });
});
