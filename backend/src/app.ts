import express from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { env } from './env.js';
import { attachParticipant } from './middleware/auth.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { programRouter } from './routes/program.js';
import { meRouter } from './routes/me.js';
import { announcementsRouter } from './routes/announcements.js';
import { pushRouter } from './routes/push.js';
import { adminRouter } from './routes/admin.js';
import { contentRouter } from './routes/content.js';
import { logger } from './logger.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(compression());

  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
  app.use(
    cors({
      origin: allowedOrigins.length ? allowedOrigins : false,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  const globalLimiter = rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false });
  app.use('/api', globalLimiter);

  app.use('/api', healthRouter);
  app.use(attachParticipant);

  app.use('/api/auth', authRouter);
  app.use('/api/program', programRouter);
  app.use('/api/me', meRouter);
  app.use('/api/announcements', announcementsRouter);
  app.use('/api/push', pushRouter);
  app.use('/api/content', contentRouter);
  app.use('/api/admin', adminRouter);

  // Serve the built frontend (single-container deployment).
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const staticDir = path.join(dir, '..', 'public');
  if (existsSync(staticDir)) {
    app.use(express.static(staticDir, { index: false, maxAge: '1y', immutable: true }));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('unhandled error', { message: err.message });
    res.status(500).json({ error: 'Não foi possível ligar ao servidor.' });
  });

  return app;
}
