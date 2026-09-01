import crypto from 'node:crypto';

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Simple env-configured basic auth for the small admin API. */
export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/admin')) return;

  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
    throw createError({ statusCode: 503, message: 'Admin não configurado.' });
  }

  const header = getHeader(event, 'authorization');
  if (!header?.startsWith('Basic ')) {
    setHeader(event, 'WWW-Authenticate', 'Basic realm="admin"');
    throw createError({ statusCode: 401, message: 'Autenticação de administrador necessária.' });
  }

  const decoded = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf-8');
  const sep = decoded.indexOf(':');
  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);

  if (timingSafeEqual(user, env.ADMIN_USERNAME) && timingSafeEqual(pass, env.ADMIN_PASSWORD)) {
    return;
  }

  setHeader(event, 'WWW-Authenticate', 'Basic realm="admin"');
  throw createError({ statusCode: 401, message: 'Credenciais inválidas.' });
});
