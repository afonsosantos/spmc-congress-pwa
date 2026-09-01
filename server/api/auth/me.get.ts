import { ParticipantService } from '../../services/participantService';

export default defineEventHandler(async (event) => {
  const participantId = requireAuth(event);
  const dto = await ParticipantService.findById(participantId);
  if (!dto) {
    throw createError({ statusCode: 401, message: 'Sessão inválida.' });
  }
  return { user: dto };
});
