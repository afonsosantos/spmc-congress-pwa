import { pool } from '../../../db/pool';
import { PretalxService } from '../../../services/pretalxService';

export default defineEventHandler(async (event) => {
  const participantId = requireAuth(event);
  const sessionId = getRouterParam(event, 'sessionId')!;

  const session = await PretalxService.getSession(sessionId);
  if (!session) {
    throw createError({ statusCode: 404, message: 'Sessão não encontrada.' });
  }
  await pool.query(
    `INSERT INTO favourite_sessions (participant_id, pretalx_session_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [participantId, sessionId]
  );
  setResponseStatus(event, 201);
  return { ok: true };
});
