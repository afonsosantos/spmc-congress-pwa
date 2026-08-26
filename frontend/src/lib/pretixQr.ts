/**
 * Extracts a candidate ticket secret from whatever a scanned Pretix QR code
 * contains, mirroring the backend parser. The result is sent to the backend
 * as-is for authoritative validation — this file never validates against
 * Pretix itself and the secret is never persisted (no localStorage) or
 * logged.
 */
export interface ParsedTicketQr {
  secret: string;
}

const MIN_SECRET_LENGTH = 8;
const SECRET_CHARS = /^[A-Za-z0-9]+$/;

function looksLikeSecret(value: string): boolean {
  return value.length >= MIN_SECRET_LENGTH && SECRET_CHARS.test(value);
}

export function parsePretixTicketQr(raw: string): ParsedTicketQr | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!value) return null;

  if (looksLikeSecret(value)) {
    return { secret: value };
  }

  try {
    const url = new URL(value);

    const queryParam = url.searchParams.get('secret');
    if (queryParam && looksLikeSecret(queryParam)) {
      return { secret: queryParam };
    }

    const segments = url.pathname.split('/').filter(Boolean);
    const ticketIdx = segments.indexOf('ticket');
    if (ticketIdx !== -1 && segments.length >= ticketIdx + 4) {
      const candidate = segments[ticketIdx + 3];
      if (candidate && looksLikeSecret(candidate)) {
        return { secret: candidate };
      }
    }

    const last = segments[segments.length - 1];
    if (last && looksLikeSecret(last)) {
      return { secret: last };
    }

    return null;
  } catch {
    return null;
  }
}
