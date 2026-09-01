import { PretalxService } from '../../services/pretalxService';

export default defineEventHandler(async () => {
  const [sessions, rooms, speakers, tracks] = await Promise.all([
    PretalxService.getSessions(),
    PretalxService.getRooms(),
    PretalxService.getSpeakers(),
    PretalxService.getTracks(),
  ]);
  return { sessions, rooms, speakers, tracks };
});
