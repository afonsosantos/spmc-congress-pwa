import { test, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://test/test';
process.env.SESSION_SECRET = 'test-session-secret-1234567890';
process.env.PRETIX_BASE_URL = 'https://pretix.example.com';
process.env.PRETIX_ORGANIZER = 'spmc';
process.env.PRETIX_EVENT = 'congresso2027';
process.env.PRETIX_API_TOKEN = 'test-token';
process.env.PRETALX_BASE_URL = 'https://pretalx.example.com';
process.env.PRETALX_EVENT = 'congresso2027';

const { PretixService } = await import('../src/services/pretixService.js');

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

let originalFetch: typeof fetch;
before(() => {
  originalFetch = global.fetch;
});
after(() => {
  global.fetch = originalFetch;
});

test('valid, paid, non-cancelled ticket is accepted', async () => {
  global.fetch = mock.fn(async (url: string) => {
    if (String(url).includes('/orderpositions/')) {
      return jsonResponse({
        results: [
          { id: 1, order: 'ABCDE', item: 10, variation: null, canceled: false, blocked: null, valid_from: null, valid_until: null, answers: [] },
        ],
      });
    }
    if (String(url).includes('/orders/ABCDE/')) {
      return jsonResponse({ code: 'ABCDE', status: 'p' });
    }
    throw new Error('unexpected url ' + url);
  }) as unknown as typeof fetch;

  const position = await PretixService.findValidPositionBySecret('validsecret123');
  assert.ok(position);
  assert.equal(position?.order, 'ABCDE');
});

test('unknown secret returns null', async () => {
  global.fetch = mock.fn(async () => jsonResponse({ results: [] })) as unknown as typeof fetch;
  const position = await PretixService.findValidPositionBySecret('doesnotexist123');
  assert.equal(position, null);
});

test('cancelled position is rejected', async () => {
  global.fetch = mock.fn(async (url: string) => {
    if (String(url).includes('/orderpositions/')) {
      return jsonResponse({ results: [{ id: 2, order: 'CANCEL', item: 10, canceled: true, blocked: null, valid_from: null, valid_until: null, answers: [] }] });
    }
    return jsonResponse({ code: 'CANCEL', status: 'p' });
  }) as unknown as typeof fetch;

  const position = await PretixService.findValidPositionBySecret('cancelledsecret1');
  assert.equal(position, null);
});

test('position on a cancelled/unpaid order is rejected', async () => {
  global.fetch = mock.fn(async (url: string) => {
    if (String(url).includes('/orderpositions/')) {
      return jsonResponse({ results: [{ id: 3, order: 'UNPAID', item: 10, canceled: false, blocked: null, valid_from: null, valid_until: null, answers: [] }] });
    }
    return jsonResponse({ code: 'UNPAID', status: 'c' });
  }) as unknown as typeof fetch;

  const position = await PretixService.findValidPositionBySecret('unpaidsecret1234');
  assert.equal(position, null);
});

test('blocked position is rejected', async () => {
  global.fetch = mock.fn(async (url: string) => {
    if (String(url).includes('/orderpositions/')) {
      return jsonResponse({ results: [{ id: 4, order: 'BLOCK', item: 10, canceled: false, blocked: ['fraud'], valid_from: null, valid_until: null, answers: [] }] });
    }
    return jsonResponse({ code: 'BLOCK', status: 'p' });
  }) as unknown as typeof fetch;

  const position = await PretixService.findValidPositionBySecret('blockedsecret123');
  assert.equal(position, null);
});

test('never sends the ticket secret in a way that reaches the response body / no redeem call is made', async () => {
  const calls: string[] = [];
  global.fetch = mock.fn(async (url: string) => {
    calls.push(String(url));
    if (String(url).includes('/orderpositions/')) {
      return jsonResponse({ results: [{ id: 5, order: 'OK', item: 10, canceled: false, blocked: null, valid_from: null, valid_until: null, answers: [] }] });
    }
    return jsonResponse({ code: 'OK', status: 'p' });
  }) as unknown as typeof fetch;

  await PretixService.findValidPositionBySecret('okaysecret1234');
  assert.ok(calls.every((c) => !c.includes('/checkin')), 'no check-in/redeem endpoint should ever be called');
});
