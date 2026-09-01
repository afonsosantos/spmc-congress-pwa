import { ParticipantService } from '../../services/participantService';

// Re-checks check-in status against Pretix (read-only). Rate-limited since
// each call is a live upstream request, not just a local DB read.
export default defineEventHandler(async (event) => {
  const participantId = requireAuth(event);
  rateLimit(event, { name: 'me-refresh', windowMs: 15 * 60 * 1000, limit: 20 });

  const dto = await ParticipantService.refreshCheckedIn(participantId);
  if (!dto) {
    throw createError({ statusCode: 404, message: 'Participante não encontrado.' });
  }
  return { user: dto };
});
