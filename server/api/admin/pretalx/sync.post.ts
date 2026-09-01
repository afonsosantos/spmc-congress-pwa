import { PretalxService } from '../../../services/pretalxService';

export default defineEventHandler(async () => {
  const result = await PretalxService.forceRefresh();
  return { ok: true, ...result };
});
