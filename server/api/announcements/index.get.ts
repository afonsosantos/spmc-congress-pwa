import { pool } from '../../db/pool';

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  priority: string;
  link: string | null;
  image_url: string | null;
  created_at: string;
}

export default defineEventHandler(async (event) => {
  const { rows } = await pool.query<AnnouncementRow>(
    'SELECT id, title, body, priority, link, image_url, created_at FROM announcements WHERE published = true ORDER BY created_at DESC'
  );

  let readIds = new Set<string>();
  const participantId = event.context.participantId;
  if (participantId) {
    const { rows: reads } = await pool.query<{ announcement_id: string }>(
      'SELECT announcement_id FROM announcement_reads WHERE participant_id = $1',
      [participantId]
    );
    readIds = new Set(reads.map((r) => r.announcement_id));
  }

  return {
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
  };
});
