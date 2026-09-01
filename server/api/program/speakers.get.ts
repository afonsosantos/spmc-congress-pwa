import { PretalxService } from '../../services/pretalxService';

export default defineEventHandler(async () => {
  return { speakers: await PretalxService.getSpeakers() };
});
