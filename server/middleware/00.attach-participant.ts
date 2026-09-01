import { SessionService, SESSION_COOKIE } from '../services/sessionService';

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api')) return;

  const token = getCookie(event, SESSION_COOKIE);
  if (token) {
    const session = await SessionService.resolve(token);
    if (session) event.context.participantId = session.participantId;
  }
});
