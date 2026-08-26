import { test, expect } from 'bun:test';
import { parsePretixTicketQr } from '../src/lib/pretixQr.js';

test('parses a raw secret', () => {
  const result = parsePretixTicketQr('a1b2c3d4e5f6g7h8');
  expect(result).toEqual({ secret: 'a1b2c3d4e5f6g7h8' });
});

test('parses a pretix ticket URL with secret in the path', () => {
  const url = 'https://pretix.congresso-spmc.com/spmc/congresso2027/ticket/ABCDE/1/a1b2c3d4e5f6g7h8/';
  const result = parsePretixTicketQr(url);
  expect(result).toEqual({ secret: 'a1b2c3d4e5f6g7h8' });
});

test('parses a URL with secret as query parameter', () => {
  const url = 'https://pretix.congresso-spmc.com/redeem?secret=a1b2c3d4e5f6g7h8';
  const result = parsePretixTicketQr(url);
  expect(result).toEqual({ secret: 'a1b2c3d4e5f6g7h8' });
});

test('rejects too-short values', () => {
  expect(parsePretixTicketQr('short')).toBeNull();
});

test('rejects empty and non-string input', () => {
  expect(parsePretixTicketQr('')).toBeNull();
  // @ts-expect-error deliberate invalid input
  expect(parsePretixTicketQr(null)).toBeNull();
});

test('rejects unrecognized URL without a secret-shaped segment', () => {
  expect(parsePretixTicketQr('https://example.com/')).toBeNull();
});

test('rejects garbage text', () => {
  expect(parsePretixTicketQr('this is not a qr code at all!!')).toBeNull();
});
