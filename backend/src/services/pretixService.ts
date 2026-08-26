import { env } from '../env.js';
import { logger } from '../logger.js';

/**
 * All communication with Pretix. The API token lives only here, on the
 * server; it is read from env and never forwarded to the frontend.
 *
 * Ticket lookup uses GET /orderpositions/?secret=... (a read-only filter
 * documented by Pretix), so authenticating with a ticket QR never redeems
 * or otherwise mutates the order.
 */

interface PretixOrder {
  code: string;
  status: 'n' | 'p' | 'e' | 'c'; // pending, paid, expired, cancelled
}

interface PretixQuestionAnswer {
  question: number;
  question_identifier?: string;
  answer: string;
}

export interface PretixOrderPosition {
  id: number;
  order: string;
  positionid: number;
  item: number;
  variation: number | null;
  attendee_name: string | null;
  attendee_email: string | null;
  secret: string;
  canceled: boolean;
  valid_from: string | null;
  valid_until: string | null;
  blocked: string[] | null;
  answers: PretixQuestionAnswer[];
}

interface PretixOrderPositionExpanded extends PretixOrderPosition {
  order: string;
}

class PretixApiError extends Error {}

async function pretixFetch<T>(path: string): Promise<T> {
  const url = `${env.PRETIX_BASE_URL.replace(/\/$/, '')}${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Token ${env.PRETIX_API_TOKEN}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new PretixApiError(`Pretix API request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

export const PretixService = {
  /**
   * Looks up an order position by its ticket secret. Read-only — does NOT
   * redeem or check in the ticket. Returns null if not found or invalid.
   */
  async findValidPositionBySecret(secret: string): Promise<PretixOrderPositionExpanded | null> {
    const path = `/api/v1/organizers/${encodeURIComponent(env.PRETIX_ORGANIZER)}/events/${encodeURIComponent(
      env.PRETIX_EVENT
    )}/orderpositions/?secret=${encodeURIComponent(secret)}`;

    let data: { results: PretixOrderPositionExpanded[] };
    try {
      data = await pretixFetch(path);
    } catch (err) {
      logger.error('pretix lookup failed', { error: (err as Error).message });
      return null;
    }

    const position = data.results?.[0];
    if (!position) return null;
    if (position.canceled) return null;
    if (position.blocked && position.blocked.length > 0) return null;

    const now = Date.now();
    if (position.valid_from && new Date(position.valid_from).getTime() > now) return null;
    if (position.valid_until && new Date(position.valid_until).getTime() < now) return null;

    const order = await this.getOrder(position.order);
    if (!order || order.status !== 'p') return null;

    return position;
  },

  async getOrder(code: string): Promise<PretixOrder | null> {
    const path = `/api/v1/organizers/${encodeURIComponent(env.PRETIX_ORGANIZER)}/events/${encodeURIComponent(
      env.PRETIX_EVENT
    )}/orders/${encodeURIComponent(code)}/`;
    try {
      return await pretixFetch<PretixOrder>(path);
    } catch {
      return null;
    }
  },

  async getItem(itemId: number): Promise<{ id: number; name: Record<string, string> } | null> {
    const path = `/api/v1/organizers/${encodeURIComponent(env.PRETIX_ORGANIZER)}/events/${encodeURIComponent(
      env.PRETIX_EVENT
    )}/items/${itemId}/`;
    try {
      return await pretixFetch(path);
    } catch {
      return null;
    }
  },
};

export type { PretixOrderPositionExpanded };
