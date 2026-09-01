import { ParticipantService } from '../../services/participantService';

export default defineEventHandler(async (event) => {
  const participantId = requireAuth(event);
  const dto = await ParticipantService.findById(participantId);
  return { user: dto };
});
