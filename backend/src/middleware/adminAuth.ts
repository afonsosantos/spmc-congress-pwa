import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { env } from '../env.js';

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Simple env-configured basic auth for the small admin API. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
    res.status(503).json({ error: 'Admin não configurado.' });
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="admin"');
    res.status(401).json({ error: 'Autenticação de administrador necessária.' });
    return;
  }

  const decoded = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf-8');
  const sep = decoded.indexOf(':');
  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);

  if (timingSafeEqual(user, env.ADMIN_USERNAME) && timingSafeEqual(pass, env.ADMIN_PASSWORD)) {
    next();
    return;
  }

  res.set('WWW-Authenticate', 'Basic realm="admin"');
  res.status(401).json({ error: 'Credenciais inválidas.' });
}
