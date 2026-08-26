import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../env.js';
import { parsePretixTicketQr } from '../lib/pretixQr.js';
import { PretixService } from '../services/pretixService.js';
import { ParticipantService } from '../services/participantService.js';
import { SessionService, SESSION_COOKIE } from '../services/sessionService.js';
import { requireAuth } from '../middleware/auth.js';
import { logger } from '../logger.js';

export const authRouter = Router();

const ticketAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas tentativas. Tente novamente mais tarde.' },
});

const bodySchema = z.object({ secret: z.string().min(1).max(500) });

function setSessionCookie(res: import('express').Response, token: string, maxAgeMs: number) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAgeMs,
    path: '/',
  });
}

authRouter.post('/ticket', ticketAuthLimiter, async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Não foi possível ler o QR code.' });
    return;
  }

  // The raw input may itself be a full QR payload (URL) or a bare secret —
  // never log it, whichever it turns out to be.
  const qr = parsePretixTicketQr(parsed.data.secret);
  if (!qr) {
    res.status(400).json({ error: 'Não foi possível ler o QR code.' });
    return;
  }

  const position = await PretixService.findValidPositionBySecret(qr.secret);
  if (!position) {
    logger.warn('ticket auth failed: invalid or not found');
    res.status(401).json({ error: 'Este bilhete não é válido.' });
    return;
  }

  const participantId = await ParticipantService.upsertFromPretix(position);
  const { token, expiresAt } = await SessionService.create(participantId);
  setSessionCookie(res, token, SessionService.cookieMaxAgeMs);

  const dto = await ParticipantService.findById(participantId);
  logger.info('ticket auth succeeded', { participantId, expiresAt: expiresAt.toISOString() });
  res.json({ user: dto });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const dto = await ParticipantService.findById(req.participantId!);
  if (!dto) {
    res.status(401).json({ error: 'Sessão inválida.' });
    return;
  }
  res.json({ user: dto });
});

authRouter.post('/logout', async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) await SessionService.destroy(token);
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ ok: true });
});
