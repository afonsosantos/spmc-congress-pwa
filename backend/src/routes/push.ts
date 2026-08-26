import { Router } from 'express';
import { z } from 'zod';
import { PushService } from '../services/pushService.js';

export const pushRouter = Router();

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

pushRouter.get('/public-key', (_req, res) => {
  res.json({ publicKey: PushService.publicKey, enabled: PushService.enabled });
});

pushRouter.post('/subscribe', async (req, res) => {
  if (!PushService.enabled) {
    res.status(503).json({ error: 'Notificações push não estão configuradas.' });
    return;
  }
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Subscrição inválida.' });
    return;
  }
  await PushService.subscribe(req.participantId ?? null, parsed.data);
  res.status(201).json({ ok: true });
});

pushRouter.delete('/subscribe', async (req, res) => {
  const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint : null;
  if (!endpoint) {
    res.status(400).json({ error: 'endpoint em falta.' });
    return;
  }
  await PushService.unsubscribe(endpoint);
  res.json({ ok: true });
});
