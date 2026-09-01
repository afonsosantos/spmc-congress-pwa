import { SessionService, SESSION_COOKIE } from '../../services/sessionService';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, SESSION_COOKIE);
  if (token) await SessionService.destroy(token);
  deleteCookie(event, SESSION_COOKIE, { path: '/' });
  return { ok: true };
});
