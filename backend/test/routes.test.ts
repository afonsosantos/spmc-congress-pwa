import { test, expect, mock } from 'bun:test';
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
mock.module('../src/db/pool.js', () => ({ pool: fakePool }));

let nextPosition: any = null;
let nextCheckins: any[] | null = [];
mock.module('../src/services/pretixService.js', () => ({
  PretixService: {
    findValidPositionBySecret: async () => nextPosition,
    getItem: async () => ({ id: 10, name: { en: 'Congress Registration' } }),
    getPositionCheckins: async () => nextCheckins,
    getPositionAddons: async () => [],
  },
}));
mock.module('../src/services/pretalxService.js', () => ({
  PretalxService: {
    getSessions: async () => [{ id: 'sess-1', title: 'Talk', speakers: [], tags: [] }],
    getSession: async (id: string) => (id === 'sess-1' ? { id: 'sess-1', title: 'Talk' } : null),
    getRooms: async () => [],
    getSpeakers: async () => [],
    getTracks: async () => [],
    startBackgroundRefresh: () => {},
  },
}));

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
  expect(res.status).toBe(400);
  expect(res.body.error).toBe('Não foi possível ler o QR code.');
});

test('POST /api/auth/ticket rejects an invalid/unknown ticket with a generic error', async () => {
  nextPosition = null;
  const res = await request(app).post('/api/auth/ticket').send({ secret: 'nonexistentsecret1' });
  expect(res.status).toBe(401);
  expect(res.body.error).toBe('Este bilhete não é válido.');
});

test('POST /api/auth/ticket logs in on a valid ticket, sets httpOnly cookie, never redeems', async () => {
  nextPosition = validPosition();
  const res = await request(app).post('/api/auth/ticket').send({ secret: 'validsecret1234567' });
  expect(res.status).toBe(200);
  expect(res.body.user.name).toBe('Maria Silva');
  const cookie = res.headers['set-cookie']?.[0] ?? '';
  expect(cookie).toMatch(/spmc_session=/);
  expect(cookie).toMatch(/HttpOnly/i);
  expect(cookie).toMatch(/SameSite=Lax/i);
});

test('GET /api/auth/me requires authentication', async () => {
  const res = await request(app).get('/api/auth/me');
  expect(res.status).toBe(401);
});

test('full session lifecycle: login -> me -> favourite -> logout -> me rejected', async () => {
  nextPosition = validPosition({ id: 99, order: 'FULLFLOW' });
  const agent = request.agent(app);

  const login = await agent.post('/api/auth/ticket').send({ secret: 'fullflowsecret1234' });
  expect(login.status).toBe(200);

  const me = await agent.get('/api/auth/me');
  expect(me.status).toBe(200);
  expect(me.body.user.name).toBe('Maria Silva');

  const fav = await agent.post('/api/me/schedule/sess-1');
  expect(fav.status).toBe(201);

  const schedule = await agent.get('/api/me/schedule');
  expect(schedule.status).toBe(200);
  expect(schedule.body.sessions.length).toBe(1);
  expect(schedule.body.sessions[0].id).toBe('sess-1');

  const logout = await agent.post('/api/auth/logout');
  expect(logout.status).toBe(200);

  const meAfter = await agent.get('/api/auth/me');
  expect(meAfter.status).toBe(401);
});

test('favouriting an unknown session id 404s', async () => {
  nextPosition = validPosition({ id: 101, order: 'UNKNOWNSESS' });
  const agent = request.agent(app);
  await agent.post('/api/auth/ticket').send({ secret: 'unknownsesssecret1' });
  const res = await agent.post('/api/me/schedule/does-not-exist');
  expect(res.status).toBe(404);
});

test('POST /api/me/refresh re-checks Pretix and persists check-in status', async () => {
  nextPosition = validPosition({ id: 202, order: 'CHECKINFLOW' });
  const agent = request.agent(app);
  await agent.post('/api/auth/ticket').send({ secret: 'checkinflowsecret1' });

  const before = await agent.get('/api/auth/me');
  expect(before.body.user.checkedIn).toBe(false);

  nextCheckins = [{ datetime: '2027-04-18T09:00:00Z', type: 'entry' }];
  const refreshed = await agent.post('/api/me/refresh');
  expect(refreshed.status).toBe(200);
  expect(refreshed.body.user.checkedIn).toBe(true);

  const after = await agent.get('/api/auth/me');
  expect(after.body.user.checkedIn).toBe(true);
});

test('POST /api/me/refresh requires authentication', async () => {
  const res = await request(app).post('/api/me/refresh');
  expect(res.status).toBe(401);
});

test('admin endpoints reject unauthenticated / non-admin requests', async () => {
  const res = await request(app).get('/api/admin/announcements');
  expect(res.status).toBe(401);
});

test('admin endpoints accept correct admin credentials', async () => {
  const res = await request(app)
    .get('/api/admin/announcements')
    .auth('admin', 'super-secret-password');
  expect(res.status).toBe(200);
});

test('admin can list and update content pages, and the change is publicly visible', async () => {
  fakePool._state.contentPages.push({ slug: 'venue', title: 'Local', body: 'placeholder', updatedAt: new Date() });

  const list = await request(app).get('/api/admin/content').auth('admin', 'super-secret-password');
  expect(list.status).toBe(200);
  expect(list.body.pages.some((p: { slug: string }) => p.slug === 'venue')).toBe(true);

  const update = await request(app)
    .put('/api/admin/content/venue')
    .auth('admin', 'super-secret-password')
    .send({ title: 'Local do Congresso', body: 'Auditório Principal, Lisboa.' });
  expect(update.status).toBe(200);

  const publicPage = await request(app).get('/api/content/venue');
  expect(publicPage.status).toBe(200);
  expect(publicPage.body.page.title).toBe('Local do Congresso');
  expect(publicPage.body.page.body).toBe('Auditório Principal, Lisboa.');
});

test('admin content endpoints reject non-admin requests', async () => {
  const res = await request(app).put('/api/admin/content/venue').send({ title: 'x', body: 'y' });
  expect(res.status).toBe(401);
});

test('admin can create a new content page with a custom slug, icon, and section', async () => {
  const create = await request(app)
    .post('/api/admin/content')
    .auth('admin', 'super-secret-password')
    .send({ slug: 'covid-19', title: 'Medidas Sanitárias', body: 'Detalhes.', icon: 'shield', section: 'info' });
  expect(create.status).toBe(201);
  expect(create.body.slug).toBe('covid-19');

  const publicList = await request(app).get('/api/content');
  expect(publicList.status).toBe(200);
  const found = publicList.body.pages.find((p: { slug: string }) => p.slug === 'covid-19');
  expect(found).toBeTruthy();
  expect(found.icon).toBe('shield');
});

test('creating a content page with a duplicate slug is rejected', async () => {
  await request(app)
    .post('/api/admin/content')
    .auth('admin', 'super-secret-password')
    .send({ slug: 'dup-page', title: 'A', body: 'B' });
  const second = await request(app)
    .post('/api/admin/content')
    .auth('admin', 'super-secret-password')
    .send({ slug: 'dup-page', title: 'C', body: 'D' });
  expect(second.status).toBe(409);
});

test('creating a content page with an invalid slug is rejected', async () => {
  const res = await request(app)
    .post('/api/admin/content')
    .auth('admin', 'super-secret-password')
    .send({ slug: 'Not A Slug!', title: 'A', body: 'B' });
  expect(res.status).toBe(400);
});

test('an inactive (visible=false) page 404s for participants but still shows for admin', async () => {
  await request(app)
    .post('/api/admin/content')
    .auth('admin', 'super-secret-password')
    .send({ slug: 'hidden-page', title: 'Hidden', body: 'Shh', visible: false });

  const publicGet = await request(app).get('/api/content/hidden-page');
  expect(publicGet.status).toBe(404);

  const publicList = await request(app).get('/api/content');
  expect(publicList.body.pages.some((p: { slug: string }) => p.slug === 'hidden-page')).toBe(false);

  const adminList = await request(app).get('/api/admin/content').auth('admin', 'super-secret-password');
  const hidden = adminList.body.pages.find((p: { slug: string }) => p.slug === 'hidden-page');
  expect(hidden).toBeTruthy();
  expect(hidden.visible).toBe(false);

  const reactivate = await request(app)
    .put('/api/admin/content/hidden-page')
    .auth('admin', 'super-secret-password')
    .send({ visible: true });
  expect(reactivate.status).toBe(200);
  const afterReactivate = await request(app).get('/api/content/hidden-page');
  expect(afterReactivate.status).toBe(200);
});

test('admin can delete a content page', async () => {
  await request(app)
    .post('/api/admin/content')
    .auth('admin', 'super-secret-password')
    .send({ slug: 'to-delete', title: 'A', body: 'B' });
  const del = await request(app).delete('/api/admin/content/to-delete').auth('admin', 'super-secret-password');
  expect(del.status).toBe(200);
  const after = await request(app).get('/api/content/to-delete');
  expect(after.status).toBe(404);
});
