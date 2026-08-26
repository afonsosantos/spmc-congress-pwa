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
mock.module('../src/services/pretixService.js', () => ({
  PretixService: {
    getItem: async () => ({ id: 10, name: { en: 'Congress Registration' } }),
  },
}));

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

  expect(dto).toBeTruthy();
  expect(dto?.name).toBe('Maria Silva');
  expect(dto?.email).toBe('maria@example.com');
  expect(dto?.ticket.product).toBe('Congress Registration');
  expect(dto?.checkedIn).toBe(false);
  expect(Object.keys(dto!.answers).sort()).toEqual(['dietary_restrictions', 'workshop']);
  expect('payment_method' in dto!.answers).toBe(false);
  expect(JSON.stringify(dto).includes('should-never-be-stored')).toBe(false);
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

  expect(dto?.email).toBe('joao@example.com');
  expect(dto?.checkedIn).toBe(true);
});
