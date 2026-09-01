import { z } from 'zod';
import { PushService } from '../../services/pushService';

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

export default defineEventHandler(async (event) => {
  if (!PushService.enabled) {
    throw createError({ statusCode: 503, message: 'Notificações push não estão configuradas.' });
  }
  const parsed = subscribeSchema.safeParse(await readBody(event));
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Subscrição inválida.' });
  }
  await PushService.subscribe(event.context.participantId ?? null, parsed.data);
  setResponseStatus(event, 201);
  return { ok: true };
});
