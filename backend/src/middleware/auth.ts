import type { Request, Response, NextFunction } from 'express';
import { SessionService, SESSION_COOKIE } from '../services/sessionService.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      participantId?: string;
    }
  }
}

export async function attachParticipant(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) {
    const session = await SessionService.resolve(token);
    if (session) req.participantId = session.participantId;
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.participantId) {
    res.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }
  next();
}
