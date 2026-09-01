import crypto from 'node:crypto';
import { pool } from '../db/pool';

export const SESSION_COOKIE = 'spmc_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h, short-lived per spec

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const SessionService = {
  async create(participantId: string): Promise<{ token: string; expiresAt: Date }> {
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await pool.query(
      'INSERT INTO app_sessions (token_hash, participant_id, expires_at) VALUES ($1, $2, $3)',
      [hashToken(token), participantId, expiresAt]
    );
    return { token, expiresAt };
  },

  async resolve(token: string): Promise<{ participantId: string } | null> {
    if (!token) return null;
    const { rows } = await pool.query<{ participant_id: string }>(
      'SELECT participant_id FROM app_sessions WHERE token_hash = $1 AND expires_at > now()',
      [hashToken(token)]
    );
    if (!rows[0]) return null;
    return { participantId: rows[0].participant_id };
  },

  async destroy(token: string): Promise<void> {
    await pool.query('DELETE FROM app_sessions WHERE token_hash = $1', [hashToken(token)]);
  },

  cookieMaxAgeMs: SESSION_TTL_MS,
};
