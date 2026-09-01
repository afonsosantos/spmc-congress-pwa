import { PretalxService } from '../../services/pretalxService';

export default defineEventHandler(async () => {
  return { tracks: await PretalxService.getTracks() };
});
