/**
 * Minimal structured logger. Never pass secrets, ticket QR secrets, session
 * tokens, or raw Pretix API responses into these calls.
 */
type Fields = Record<string, unknown>;

function log(level: 'info' | 'warn' | 'error', msg: string, fields?: Fields) {
  const entry = {
    level,
    msg,
    time: new Date().toISOString(),
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (msg: string, fields?: Fields) => log('info', msg, fields),
  warn: (msg: string, fields?: Fields) => log('warn', msg, fields),
  error: (msg: string, fields?: Fields) => log('error', msg, fields),
};
