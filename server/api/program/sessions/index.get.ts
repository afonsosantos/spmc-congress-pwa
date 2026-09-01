import { PretalxService } from '../../../services/pretalxService';

export default defineEventHandler(async () => {
  return { sessions: await PretalxService.getSessions() };
});
