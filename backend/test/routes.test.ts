import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createFakePool } from './helpers/fakePool.js';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://test/test';
process.env.SESSION_SECRET = 'test-session-secret-1234567890';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.PRETIX_BASE_URL = 'https://pretix.example.com';
process.env.PRETIX_ORGANIZER = 'spmc';
process.env.PRETIX_EVENT = 'congresso2027';
process.env.PRETIX_API_TOKEN = 'test-token';
process.env.PRETALX_BASE_URL = 'https://pretalx.example.com';
process.env.PRETALX_EVENT = 'congresso2027';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'super-secret-password';

const fakePool = createFakePool();
mock.module('../src/db/pool.js', { namedExports: { pool: fakePool } });

let nextPosition: any = null;
let nextCheckins: any[] | null = [];
mock.module('../src/services/pretixService.js', {
  namedExports: {
    PretixService: {
      findValidPositionBySecret: async () => nextPosition,
      getItem: async () => ({ id: 10, name: { en: 'Congress Registration' } }),
      getPositionCheckins: async () => nextCheckins,
    },
  },
});
mock.module('../src/services/pretalxService.js', {
  namedExports: {
    PretalxService: {
      getSessions: async () => [{ id: 'sess-1', title: 'Talk', speakers: [], tags: [] }],
      getSession: async (id: string) => (id === 'sess-1' ? { id: 'sess-1', title: 'Talk' } : null),
      getRooms: async () => [],
      getSpeakers: async () => [],
      getTracks: async () => [],
      startBackgroundRefresh: () => {},
    },
  },
});

const { createApp } = await import('../src/app.js');
const request = (await import('supertest')).default;
const app = createApp();

function validPosition(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    order: 'ABCDE',
    positionid: 1,
    item: 10,
    variation: null,
    attendee_name: 'Maria Silva',
    attendee_email: 'maria@example.com',
    secret: 'irrelevant-here',
    canceled: false,
    valid_from: null,
    valid_until: null,
    blocked: null,
    answers: [],
    checkins: [],
    orderEmail: 'maria@example.com',
    ...overrides,
  };
}

test('POST /api/auth/ticket rejects a QR that cannot be parsed', async () => {
  const res = await request(app).post('/api/auth/ticket').send({ secret: '!!' });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Não foi possível ler o QR code.');
});

test('POST /api/auth/ticket rejects an invalid/unknown ticket with a generic error', async () => {
  nextPosition = null;
  const res = await request(app).post('/api/auth/ticket').send({ secret: 'nonexistentsecret1' });
  assert.equal(res.status, 401);
  assert.equal(res.body.error, 'Este bilhete não é válido.');
});

test('POST /api/auth/ticket logs in on a valid ticket, sets httpOnly cookie, never redeems', async () => {
  nextPosition = validPosition();
  const res = await request(app).post('/api/auth/ticket').send({ secret: 'validsecret1234567' });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.name, 'Maria Silva');
  const cookie = res.headers['set-cookie']?.[0] ?? '';
  assert.match(cookie, /spmc_session=/);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
});

test('GET /api/auth/me requires authentication', async () => {
  const res = await request(app).get('/api/auth/me');
  assert.equal(res.status, 401);
});

test('full session lifecycle: login -> me -> favourite -> logout -> me rejected', async () => {
  nextPosition = validPosition({ id: 99, order: 'FULLFLOW' });
  const agent = request.agent(app);

  const login = await agent.post('/api/auth/ticket').send({ secret: 'fullflowsecret1234' });
  assert.equal(login.status, 200);

  const me = await agent.get('/api/auth/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.user.name, 'Maria Silva');

  const fav = await agent.post('/api/me/schedule/sess-1');
  assert.equal(fav.status, 201);

  const schedule = await agent.get('/api/me/schedule');
  assert.equal(schedule.status, 200);
  assert.equal(schedule.body.sessions.length, 1);
  assert.equal(schedule.body.sessions[0].id, 'sess-1');

  const logout = await agent.post('/api/auth/logout');
  assert.equal(logout.status, 200);

  const meAfter = await agent.get('/api/auth/me');
  assert.equal(meAfter.status, 401);
});

test('favouriting an unknown session id 404s', async () => {
  nextPosition = validPosition({ id: 101, order: 'UNKNOWNSESS' });
  const agent = request.agent(app);
  await agent.post('/api/auth/ticket').send({ secret: 'unknownsesssecret1' });
  const res = await agent.post('/api/me/schedule/does-not-exist');
  assert.equal(res.status, 404);
});

test('POST /api/me/refresh re-checks Pretix and persists check-in status', async () => {
  nextPosition = validPosition({ id: 202, order: 'CHECKINFLOW' });
  const agent = request.agent(app);
  await agent.post('/api/auth/ticket').send({ secret: 'checkinflowsecret1' });

  const before = await agent.get('/api/auth/me');
  assert.equal(before.body.user.checkedIn, false);

  nextCheckins = [{ datetime: '2027-04-18T09:00:00Z', type: 'entry' }];
  const refreshed = await agent.post('/api/me/refresh');
  assert.equal(refreshed.status, 200);
  assert.equal(refreshed.body.user.checkedIn, true);

  const after = await agent.get('/api/auth/me');
  assert.equal(after.body.user.checkedIn, true);
});

test('POST /api/me/refresh requires authentication', async () => {
  const res = await request(app).post('/api/me/refresh');
  assert.equal(res.status, 401);
});

test('admin endpoints reject unauthenticated / non-admin requests', async () => {
  const res = await request(app).get('/api/admin/announcements');
  assert.equal(res.status, 401);
});

test('admin endpoints accept correct admin credentials', async () => {
  const res = await request(app)
    .get('/api/admin/announcements')
    .auth('admin', 'super-secret-password');
  assert.equal(res.status, 200);
});
