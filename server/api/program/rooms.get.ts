import { PretalxService } from '../../services/pretalxService';

export default defineEventHandler(async () => {
  return { rooms: await PretalxService.getRooms() };
});
