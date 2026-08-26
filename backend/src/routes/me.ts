import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { ParticipantService } from '../services/participantService.js';
import { PretalxService } from '../services/pretalxService.js';

export const meRouter = Router();
meRouter.use(requireAuth);

meRouter.get('/', async (req, res) => {
  const dto = await ParticipantService.findById(req.participantId!);
  res.json({ user: dto });
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Re-checks check-in status against Pretix (read-only). Rate-limited since
// each call is a live upstream request, not just a local DB read.
meRouter.post('/refresh', refreshLimiter, async (req, res) => {
  const dto = await ParticipantService.refreshCheckedIn(req.participantId!);
  if (!dto) {
    res.status(404).json({ error: 'Participante não encontrado.' });
    return;
  }
  res.json({ user: dto });
});

meRouter.get('/schedule', async (req, res) => {
  const { rows } = await pool.query<{ pretalx_session_id: string }>(
    'SELECT pretalx_session_id FROM favourite_sessions WHERE participant_id = $1',
    [req.participantId]
  );
  const favIds = new Set(rows.map((r) => r.pretalx_session_id));
  const allSessions = await PretalxService.getSessions();
  const favourites = allSessions
    .filter((s) => favIds.has(s.id))
    .sort((a, b) => (a.start ?? '').localeCompare(b.start ?? ''));
  res.json({ sessions: favourites });
});

meRouter.post('/schedule/:sessionId', async (req, res) => {
  const session = await PretalxService.getSession(req.params.sessionId);
  if (!session) {
    res.status(404).json({ error: 'Sessão não encontrada.' });
    return;
  }
  await pool.query(
    `INSERT INTO favourite_sessions (participant_id, pretalx_session_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [req.participantId, req.params.sessionId]
  );
  res.status(201).json({ ok: true });
});

meRouter.delete('/schedule/:sessionId', async (req, res) => {
  await pool.query('DELETE FROM favourite_sessions WHERE participant_id = $1 AND pretalx_session_id = $2', [
    req.participantId,
    req.params.sessionId,
  ]);
  res.json({ ok: true });
});

meRouter.delete('/', async (req, res) => {
  await ParticipantService.deleteById(req.participantId!);
  res.clearCookie('spmc_session', { path: '/' });
  res.json({ ok: true });
});
