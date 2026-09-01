import { z } from 'zod';
import { PretixService } from '../../services/pretixService';
import { ParticipantService } from '../../services/participantService';
import { SessionService, SESSION_COOKIE } from '../../services/sessionService';

const bodySchema = z.object({ secret: z.string().min(1).max(500) });

export default defineEventHandler(async (event) => {
  rateLimit(event, {
    name: 'ticket-auth',
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: 'Demasiadas tentativas. Tente novamente mais tarde.',
  });

  const parsed = bodySchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Não foi possível ler o QR code.' });
  }

  // The raw input may itself be a full QR payload (URL) or a bare secret —
  // never log it, whichever it turns out to be.
  const qr = parsePretixTicketQr(parsed.data.secret);
  if (!qr) {
    throw createError({ statusCode: 400, message: 'Não foi possível ler o QR code.' });
  }

  const position = await PretixService.findValidPositionBySecret(qr.secret);
  if (!position) {
    logger.warn('ticket auth failed: invalid or not found');
    throw createError({ statusCode: 401, message: 'Este bilhete não é válido.' });
  }

  const participantId = await ParticipantService.upsertFromPretix(position);
  const { token, expiresAt } = await SessionService.create(participantId);
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Math.floor(SessionService.cookieMaxAgeMs / 1000),
    path: '/',
  });

  const dto = await ParticipantService.findById(participantId);
  logger.info('ticket auth succeeded', { participantId, expiresAt: expiresAt.toISOString() });
  return { user: dto };
});
