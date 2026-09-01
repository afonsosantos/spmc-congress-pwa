import { ParticipantService } from '../../services/participantService';
import { SESSION_COOKIE } from '../../services/sessionService';

export default defineEventHandler(async (event) => {
  const participantId = requireAuth(event);
  await ParticipantService.deleteById(participantId);
  deleteCookie(event, SESSION_COOKIE, { path: '/' });
  return { ok: true };
});
