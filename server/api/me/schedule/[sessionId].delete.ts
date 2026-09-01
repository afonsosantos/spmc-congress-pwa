import { pool } from '../../../db/pool';

export default defineEventHandler(async (event) => {
  const participantId = requireAuth(event);
  const sessionId = getRouterParam(event, 'sessionId')!;

  await pool.query('DELETE FROM favourite_sessions WHERE participant_id = $1 AND pretalx_session_id = $2', [
    participantId,
    sessionId,
  ]);
  return { ok: true };
});
