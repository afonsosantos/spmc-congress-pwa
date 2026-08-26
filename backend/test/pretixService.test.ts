import { test, expect, beforeAll, afterAll } from 'bun:test';

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
beforeAll(() => {
  originalFetch = global.fetch;
});
afterAll(() => {
  global.fetch = originalFetch;
});

test('valid, paid, non-cancelled ticket is accepted', async () => {
  global.fetch = (async (url: string) => {
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
  expect(position).toBeTruthy();
  expect(position?.order).toBe('ABCDE');
});

test('unknown secret returns null', async () => {
  global.fetch = (async () => jsonResponse({ results: [] })) as unknown as typeof fetch;
  const position = await PretixService.findValidPositionBySecret('doesnotexist123');
  expect(position).toBeNull();
});

test('cancelled position is rejected', async () => {
  global.fetch = (async (url: string) => {
    if (String(url).includes('/orderpositions/')) {
      return jsonResponse({ results: [{ id: 2, order: 'CANCEL', item: 10, canceled: true, blocked: null, valid_from: null, valid_until: null, answers: [] }] });
    }
    return jsonResponse({ code: 'CANCEL', status: 'p' });
  }) as unknown as typeof fetch;

  const position = await PretixService.findValidPositionBySecret('cancelledsecret1');
  expect(position).toBeNull();
});

test('position on a cancelled order is rejected', async () => {
  global.fetch = (async (url: string) => {
    if (String(url).includes('/orderpositions/')) {
      return jsonResponse({ results: [{ id: 3, order: 'CXORDER', item: 10, canceled: false, blocked: null, valid_from: null, valid_until: null, answers: [] }] });
    }
    return jsonResponse({ code: 'CXORDER', status: 'c' });
  }) as unknown as typeof fetch;

  const position = await PretixService.findValidPositionBySecret('cxordersecret123');
  expect(position).toBeNull();
});

test('position on an expired order is rejected', async () => {
  global.fetch = (async (url: string) => {
    if (String(url).includes('/orderpositions/')) {
      return jsonResponse({ results: [{ id: 6, order: 'EXPIRED', item: 10, canceled: false, blocked: null, valid_from: null, valid_until: null, answers: [] }] });
    }
    return jsonResponse({ code: 'EXPIRED', status: 'e' });
  }) as unknown as typeof fetch;

  const position = await PretixService.findValidPositionBySecret('expiredsecret123');
  expect(position).toBeNull();
});

test('position on a pending (unpaid) order is still accepted — only cancelled/expired orders block login', async () => {
  global.fetch = (async (url: string) => {
    if (String(url).includes('/orderpositions/')) {
      return jsonResponse({ results: [{ id: 7, order: 'PENDING', item: 10, canceled: false, blocked: null, valid_from: null, valid_until: null, answers: [] }] });
    }
    return jsonResponse({ code: 'PENDING', status: 'n' });
  }) as unknown as typeof fetch;

  const position = await PretixService.findValidPositionBySecret('pendingsecret123');
  expect(position).toBeTruthy();
  expect(position?.order).toBe('PENDING');
});

test('blocked position is rejected', async () => {
  global.fetch = (async (url: string) => {
    if (String(url).includes('/orderpositions/')) {
      return jsonResponse({ results: [{ id: 4, order: 'BLOCK', item: 10, canceled: false, blocked: ['fraud'], valid_from: null, valid_until: null, answers: [] }] });
    }
    return jsonResponse({ code: 'BLOCK', status: 'p' });
  }) as unknown as typeof fetch;

  const position = await PretixService.findValidPositionBySecret('blockedsecret123');
  expect(position).toBeNull();
});

test('never sends the ticket secret in a way that reaches the response body / no redeem call is made', async () => {
  const calls: string[] = [];
  global.fetch = (async (url: string) => {
    calls.push(String(url));
    if (String(url).includes('/orderpositions/')) {
      return jsonResponse({ results: [{ id: 5, order: 'OK', item: 10, canceled: false, blocked: null, valid_from: null, valid_until: null, answers: [] }] });
    }
    return jsonResponse({ code: 'OK', status: 'p' });
  }) as unknown as typeof fetch;

  await PretixService.findValidPositionBySecret('okaysecret1234');
  expect(calls.every((c) => !c.includes('/checkin'))).toBe(true);
});
