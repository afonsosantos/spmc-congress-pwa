import { test, expect, mock } from 'bun:test';
import { createFakePool } from './helpers/fakePool';

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
mock.module('../../server/db/pool', () => ({ pool: fakePool }));

let nextAddons: { item: number; canceled: boolean }[] = [];
const itemNames: Record<number, string> = { 10: 'Congress Registration', 20: 'Almoço', 21: 'Workshop de Acupuntura' };
mock.module('../../server/services/pretixService', () => ({
  PretixService: {
    getItem: async (id: number) => (itemNames[id] ? { id, name: { en: itemNames[id] } } : null),
    getPositionAddons: async () => nextAddons,
  },
}));

const { ParticipantService } = await import('../../server/services/participantService');

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

test('purchased add-ons (lunch, workshops) are resolved to product names, cancelled ones excluded', async () => {
  nextAddons = [
    { item: 20, canceled: false }, // Almoço
    { item: 21, canceled: false }, // Workshop
    { item: 20, canceled: false }, // duplicate — should not appear twice
    { item: 99, canceled: true }, // cancelled — excluded regardless of item
  ];
  const position = {
    id: 44,
    order: 'ADDONS1',
    positionid: 1,
    item: 10,
    variation: null,
    attendee_name: 'Ana Costa',
    attendee_email: 'ana@example.com',
    secret: 'addons-secret',
    canceled: false,
    valid_from: null,
    valid_until: null,
    blocked: null,
    orderEmail: null,
    checkins: [],
    answers: [],
  } as const;

  const id = await ParticipantService.upsertFromPretix(position as any);
  const dto = await ParticipantService.findById(id);

  expect(dto?.addons.sort()).toEqual(['Almoço', 'Workshop de Acupuntura'].sort());
});
