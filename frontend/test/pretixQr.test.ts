import { test, expect } from 'bun:test';
import { parsePretixTicketQr } from '../src/lib/pretixQr.ts';

test('parses a raw secret', () => {
  expect(parsePretixTicketQr('a1b2c3d4e5f6g7h8')).toEqual({ secret: 'a1b2c3d4e5f6g7h8' });
});

test('parses a pretix ticket URL', () => {
  const url = 'https://pretix.congresso-spmc.com/spmc/congresso2027/ticket/ABCDE/1/a1b2c3d4e5f6g7h8/';
  expect(parsePretixTicketQr(url)).toEqual({ secret: 'a1b2c3d4e5f6g7h8' });
});

test('parses secret from query string', () => {
  expect(parsePretixTicketQr('https://pretix.congresso-spmc.com/redeem?secret=a1b2c3d4e5f6g7h8')).toEqual({
    secret: 'a1b2c3d4e5f6g7h8',
  });
});

test('rejects invalid input', () => {
  expect(parsePretixTicketQr('')).toBeNull();
  expect(parsePretixTicketQr('short')).toBeNull();
  expect(parsePretixTicketQr('https://example.com/')).toBeNull();
});
