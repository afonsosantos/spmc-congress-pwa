/**
 * Parses whatever a Pretix ticket QR code contains into a ticket secret.
 *
 * Pretix QR codes are not a single fixed format:
 *  - Newer tickets encode a raw secret directly (a long random token).
 *  - Some ticket layouts / wallet passes encode a URL of the form
 *    https://<pretix-host>/<organizer>/<event>/ticket/<order>/<position>/<secret>/
 *    or with the secret as a query parameter (?secret=...).
 *  - Some integrations base64/urlencode the payload.
 *
 * This parser is intentionally permissive but never guesses: if nothing
 * secret-shaped can be extracted, it returns null rather than a wrong value.
 */

export interface ParsedTicketQr {
  secret: string;
}

const MIN_SECRET_LENGTH = 8;
// Pretix secrets are alphanumeric (base32/base62-ish); allow a conservative charset.
const SECRET_CHARS = /^[A-Za-z0-9]+$/;

function looksLikeSecret(value: string): boolean {
  return value.length >= MIN_SECRET_LENGTH && SECRET_CHARS.test(value);
}

export function parsePretixTicketQr(raw: string): ParsedTicketQr | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!value) return null;

  // Case 1: raw secret, nothing else.
  if (looksLikeSecret(value)) {
    return { secret: value };
  }

  // Case 2: a URL — either .../ticket/<order>/<position>/<secret>/... or ?secret=...
  try {
    const url = new URL(value);

    const queryParam = url.searchParams.get('secret');
    if (queryParam && looksLikeSecret(queryParam)) {
      return { secret: queryParam };
    }

    const segments = url.pathname.split('/').filter(Boolean);
    // Look for a "ticket" segment followed by order/position/secret, per the
    // documented pretix ticket URL layout.
    const ticketIdx = segments.indexOf('ticket');
    if (ticketIdx !== -1 && segments.length >= ticketIdx + 4) {
      const candidate = segments[ticketIdx + 3];
      if (candidate && looksLikeSecret(candidate)) {
        return { secret: candidate };
      }
    }

    // Fallback: the last path segment, if it looks secret-shaped.
    const last = segments[segments.length - 1];
    if (last && looksLikeSecret(last)) {
      return { secret: last };
    }

    return null;
  } catch {
    // Not a URL and not a bare secret — unrecognized format.
    return null;
  }
}
