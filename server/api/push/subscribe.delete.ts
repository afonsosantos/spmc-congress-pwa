import { PushService } from '../../services/pushService';

export default defineEventHandler(async (event) => {
  const body = await readBody<{ endpoint?: unknown }>(event).catch(() => null);
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : null;
  if (!endpoint) {
    throw createError({ statusCode: 400, message: 'endpoint em falta.' });
  }
  await PushService.unsubscribe(endpoint);
  return { ok: true };
});
