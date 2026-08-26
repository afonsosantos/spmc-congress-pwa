import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePretixTicketQr } from '../src/lib/pretixQr.js';

test('parses a raw secret', () => {
  const result = parsePretixTicketQr('a1b2c3d4e5f6g7h8');
  assert.deepEqual(result, { secret: 'a1b2c3d4e5f6g7h8' });
});

test('parses a pretix ticket URL with secret in the path', () => {
  const url = 'https://pretix.congresso-spmc.com/spmc/congresso2027/ticket/ABCDE/1/a1b2c3d4e5f6g7h8/';
  const result = parsePretixTicketQr(url);
  assert.deepEqual(result, { secret: 'a1b2c3d4e5f6g7h8' });
});

test('parses a URL with secret as query parameter', () => {
  const url = 'https://pretix.congresso-spmc.com/redeem?secret=a1b2c3d4e5f6g7h8';
  const result = parsePretixTicketQr(url);
  assert.deepEqual(result, { secret: 'a1b2c3d4e5f6g7h8' });
});

test('rejects too-short values', () => {
  assert.equal(parsePretixTicketQr('short'), null);
});

test('rejects empty and non-string input', () => {
  assert.equal(parsePretixTicketQr(''), null);
  // @ts-expect-error deliberate invalid input
  assert.equal(parsePretixTicketQr(null), null);
});

test('rejects unrecognized URL without a secret-shaped segment', () => {
  assert.equal(parsePretixTicketQr('https://example.com/'), null);
});

test('rejects garbage text', () => {
  assert.equal(parsePretixTicketQr('this is not a qr code at all!!'), null);
});
