import { test, expect, mock } from 'bun:test';
import { createFakePool } from './helpers/fakePool.js';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://test/test';
process.env.SESSION_SECRET = 'test-session-secret-1234567890';
process.env.PRETIX_BASE_URL = 'https://pretix.example.com';
process.env.PRETIX_ORGANIZER = 'spmc';
process.env.PRETIX_EVENT = 'congresso2027';
process.env.PRETIX_API_TOKEN = 'test-token';
process.env.PRETALX_BASE_URL = 'https://pretalx.example.com';
process.env.PRETALX_EVENT = 'congresso2027';

const fakePool = createFakePool();
mock.module('../src/db/pool.js', () => ({ pool: fakePool }));

const { SessionService } = await import('../src/services/sessionService.js');

test('create + resolve round-trips to the same participant', async () => {
  const participantId = crypto.randomUUID();
  const { token } = await SessionService.create(participantId);
  const resolved = await SessionService.resolve(token);
  expect(resolved?.participantId).toBe(participantId);
});

test('resolve rejects unknown tokens', async () => {
  const resolved = await SessionService.resolve('not-a-real-token');
  expect(resolved).toBeNull();
});

test('the raw token is never stored server-side (only its hash)', async () => {
  const participantId = crypto.randomUUID();
  const { token } = await SessionService.create(participantId);
  const stored = fakePool._state.sessions.find((s) => s.participant_id === participantId);
  expect(stored).toBeTruthy();
  expect(stored?.token_hash).not.toBe(token);
});

test('destroy invalidates the session', async () => {
  const participantId = crypto.randomUUID();
  const { token } = await SessionService.create(participantId);
  await SessionService.destroy(token);
  const resolved = await SessionService.resolve(token);
  expect(resolved).toBeNull();
});
