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
  email: string | null;
}

interface PretixCheckin {
  datetime: string;
  type: 'entry' | 'exit';
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
  checkins: PretixCheckin[];
}

interface PretixOrderPositionExpanded extends PretixOrderPosition {
  order: string;
  /** Order-level email, used when the ticket has no per-attendee email set. */
  orderEmail: string | null;
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

    let data: { results: PretixOrderPosition[] };
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

    return { ...position, orderEmail: order.email };
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

  /**
   * Read-only lookup by position id (not secret) — used to refresh
   * check-in status for an already-authenticated participant without
   * ever storing or re-deriving their ticket secret.
   */
  async getPositionCheckins(positionId: number): Promise<PretixCheckin[] | null> {
    const path = `/api/v1/organizers/${encodeURIComponent(env.PRETIX_ORGANIZER)}/events/${encodeURIComponent(
      env.PRETIX_EVENT
    )}/orderpositions/${positionId}/`;
    try {
      const position = await pretixFetch<PretixOrderPosition>(path);
      return position.checkins ?? [];
    } catch (err) {
      logger.error('pretix check-in refresh failed', { error: (err as Error).message });
      return null;
    }
  },

  /**
   * Read-only — other order positions purchased alongside this one (e.g.
   * lunch, a workshop) via the documented `addon_to` filter. Does not
   * touch check-in/redemption state.
   */
  async getPositionAddons(positionId: number): Promise<Pick<PretixOrderPosition, 'item' | 'canceled'>[]> {
    const path = `/api/v1/organizers/${encodeURIComponent(env.PRETIX_ORGANIZER)}/events/${encodeURIComponent(
      env.PRETIX_EVENT
    )}/orderpositions/?addon_to=${positionId}`;
    try {
      const data = await pretixFetch<{ results: Pick<PretixOrderPosition, 'item' | 'canceled'>[] }>(path);
      return data.results ?? [];
    } catch (err) {
      logger.error('pretix addon lookup failed', { error: (err as Error).message });
      return [];
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
