import type { H3Event } from 'h3';

/** Throws a 401 unless the participant-attach middleware resolved a session. */
export function requireAuth(event: H3Event): string {
  const participantId = event.context.participantId;
  if (!participantId) {
    throw createError({ statusCode: 401, message: 'Autenticação necessária.' });
  }
  return participantId;
}
