import { pool } from '../../../db/pool';

export default defineEventHandler(async (event) => {
  const participantId = requireAuth(event);
  const id = getRouterParam(event, 'id')!;

  await pool.query(
    `INSERT INTO announcement_reads (participant_id, announcement_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [participantId, id]
  );
  return { ok: true };
});
