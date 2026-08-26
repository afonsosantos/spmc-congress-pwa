import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

export const announcementsRouter = Router();

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  priority: string;
  link: string | null;
  image_url: string | null;
  created_at: string;
}

announcementsRouter.get('/', async (req, res) => {
  const { rows } = await pool.query<AnnouncementRow>(
    'SELECT id, title, body, priority, link, image_url, created_at FROM announcements WHERE published = true ORDER BY created_at DESC'
  );

  let readIds = new Set<string>();
  if (req.participantId) {
    const { rows: reads } = await pool.query<{ announcement_id: string }>(
      'SELECT announcement_id FROM announcement_reads WHERE participant_id = $1',
      [req.participantId]
    );
    readIds = new Set(reads.map((r) => r.announcement_id));
  }

  res.json({
    announcements: rows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      priority: r.priority,
      link: r.link,
      imageUrl: r.image_url,
      createdAt: r.created_at,
      read: readIds.has(r.id),
    })),
  });
});

announcementsRouter.post('/:id/read', requireAuth, async (req, res) => {
  await pool.query(
    `INSERT INTO announcement_reads (participant_id, announcement_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [req.participantId, req.params.id]
  );
  res.json({ ok: true });
});
