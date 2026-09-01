import { pool } from '../../../db/pool';
import { PretalxService } from '../../../services/pretalxService';

export default defineEventHandler(async (event) => {
  const participantId = requireAuth(event);
  const { rows } = await pool.query<{ pretalx_session_id: string }>(
    'SELECT pretalx_session_id FROM favourite_sessions WHERE participant_id = $1',
    [participantId]
  );
  const favIds = new Set(rows.map((r) => r.pretalx_session_id));
  const allSessions = await PretalxService.getSessions();
  const favourites = allSessions
    .filter((s) => favIds.has(s.id))
    .sort((a, b) => (a.start ?? '').localeCompare(b.start ?? ''));
  return { sessions: favourites };
});
