import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
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
mock.module('../src/db/pool.js', { namedExports: { pool: fakePool } });
mock.module('../src/services/pretixService.js', {
  namedExports: {
    PretixService: {
      getItem: async () => ({ id: 10, name: { en: 'Congress Registration' } }),
    },
  },
});

const { ParticipantService } = await import('../src/services/participantService.js');

test('DTO only exposes allow-listed answer identifiers, never raw Pretix payment/order data', async () => {
  const position = {
    id: 42,
    order: 'ABCDE',
    positionid: 1,
    item: 10,
    variation: null,
    attendee_name: 'Maria Silva',
    attendee_email: 'maria@example.com',
    secret: 'should-never-be-stored',
    canceled: false,
    valid_from: null,
    valid_until: null,
    blocked: null,
    checkins: [],
    orderEmail: 'order-level@example.com',
    answers: [
      { question: 1, question_identifier: 'workshop', answer: 'Acupuncture Basics' },
      { question: 2, question_identifier: 'payment_method', answer: 'credit_card' },
      { question: 3, question_identifier: 'dietary_restrictions', answer: 'Vegetarian' },
    ],
  } as const;

  const id = await ParticipantService.upsertFromPretix(position as any);
  const dto = await ParticipantService.findById(id);

  assert.ok(dto);
  assert.equal(dto?.name, 'Maria Silva');
  assert.equal(dto?.email, 'maria@example.com');
  assert.equal(dto?.ticket.product, 'Congress Registration');
  assert.equal(dto?.checkedIn, false);
  assert.deepEqual(Object.keys(dto!.answers).sort(), ['dietary_restrictions', 'workshop']);
  assert.equal('payment_method' in dto!.answers, false);
  assert.equal(JSON.stringify(dto).includes('should-never-be-stored'), false);
});

test('falls back to the order-level email when the ticket has no attendee email, and reports check-in status', async () => {
  const position = {
    id: 43,
    order: 'FGHIJ',
    positionid: 1,
    item: 10,
    variation: null,
    attendee_name: 'João Santos',
    attendee_email: null,
    secret: 'another-secret',
    canceled: false,
    valid_from: null,
    valid_until: null,
    blocked: null,
    orderEmail: 'joao@example.com',
    checkins: [{ datetime: '2027-04-18T09:00:00Z', type: 'entry' }],
    answers: [],
  } as const;

  const id = await ParticipantService.upsertFromPretix(position as any);
  const dto = await ParticipantService.findById(id);

  assert.equal(dto?.email, 'joao@example.com');
  assert.equal(dto?.checkedIn, true);
});
