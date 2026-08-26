import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePretixTicketQr } from '../src/lib/pretixQr.ts';

test('parses a raw secret', () => {
  assert.deepEqual(parsePretixTicketQr('a1b2c3d4e5f6g7h8'), { secret: 'a1b2c3d4e5f6g7h8' });
});

test('parses a pretix ticket URL', () => {
  const url = 'https://pretix.congresso-spmc.com/spmc/congresso2027/ticket/ABCDE/1/a1b2c3d4e5f6g7h8/';
  assert.deepEqual(parsePretixTicketQr(url), { secret: 'a1b2c3d4e5f6g7h8' });
});

test('parses secret from query string', () => {
  assert.deepEqual(
    parsePretixTicketQr('https://pretix.congresso-spmc.com/redeem?secret=a1b2c3d4e5f6g7h8'),
    { secret: 'a1b2c3d4e5f6g7h8' }
  );
});

test('rejects invalid input', () => {
  assert.equal(parsePretixTicketQr(''), null);
  assert.equal(parsePretixTicketQr('short'), null);
  assert.equal(parsePretixTicketQr('https://example.com/'), null);
});
