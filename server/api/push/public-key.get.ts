import { PushService } from '../../services/pushService';

export default defineEventHandler(() => {
  return { publicKey: PushService.publicKey, enabled: PushService.enabled };
});
