import { pool } from '../db/pool.js';
import { PretixService, type PretixOrderPositionExpanded } from './pretixService.js';

/** Explicit allow-list of Pretix answer question identifiers exposed to the frontend. */
const EXPOSED_ANSWER_IDENTIFIERS = new Set(['workshop', 'catering', 'dietary_restrictions']);

export interface ParticipantDTO {
  id: string;
  name: string;
  email: string;
  ticket: { product: string; variation: string | null };
  workshops: string[];
  answers: Record<string, string>;
  /** Purchased add-ons (lunch, workshops, etc.) — refreshed on each login. */
  addons: string[];
  /** Refreshed on login and whenever refreshCheckedIn() is called. */
  checkedIn: boolean;
}

interface ParticipantRow {
  id: string;
  name: string;
  email: string;
  ticket_product: string;
  ticket_variation: string;
  answers: Record<string, string>;
  addons: string[];
  checked_in: boolean;
}

function hasCheckedIn(checkins: { type: string }[] | undefined): boolean {
  return (checkins ?? []).some((c) => c.type === 'entry');
}

function toDTO(row: ParticipantRow): ParticipantDTO {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    ticket: { product: row.ticket_product, variation: row.ticket_variation || null },
    workshops: row.answers.workshop ? [row.answers.workshop] : [],
    answers: row.answers,
    addons: row.addons ?? [],
    checkedIn: row.checked_in,
  };
}

export const ParticipantService = {
  toDTO,

  async findById(id: string): Promise<ParticipantDTO | null> {
    const { rows } = await pool.query<ParticipantRow>(
      'SELECT id, name, email, ticket_product, ticket_variation, answers, addons, checked_in FROM participants WHERE id = $1',
      [id]
    );
    return rows[0] ? toDTO(rows[0]) : null;
  },

  /**
   * Upserts the local participant record from a validated Pretix order
   * position, applying the answer allow-list, and returns its local id.
   */
  async upsertFromPretix(position: PretixOrderPositionExpanded): Promise<string> {
    const answers: Record<string, string> = {};
    for (const a of position.answers ?? []) {
      if (a.question_identifier && EXPOSED_ANSWER_IDENTIFIERS.has(a.question_identifier)) {
        answers[a.question_identifier] = a.answer;
      }
    }

    let productName = '';
    let variationName = '';
    const item = await PretixService.getItem(position.item);
    if (item) {
      productName = item.name?.en ?? Object.values(item.name ?? {})[0] ?? '';
    }

    const addonPositions = await PretixService.getPositionAddons(position.id);
    const addonItemIds = [...new Set(addonPositions.filter((a) => !a.canceled).map((a) => a.item))];
    const addonItems = await Promise.all(addonItemIds.map((itemId) => PretixService.getItem(itemId)));
    const addons = addonItems
      .filter((i): i is NonNullable<typeof i> => i !== null)
      .map((i) => i.name?.en ?? Object.values(i.name ?? {})[0] ?? '')
      .filter(Boolean);

    const name = position.attendee_name ?? '';
    // Not every event asks for a per-attendee email — fall back to the
    // order's email when the ticket itself doesn't have one.
    const email = position.attendee_email ?? position.orderEmail ?? '';
    const checkedIn = hasCheckedIn(position.checkins);

    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO participants (pretix_position_id, pretix_order_code, name, email, ticket_product, ticket_variation, answers, addons, checked_in, last_login_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())
       ON CONFLICT (pretix_position_id) DO UPDATE SET
         pretix_order_code = EXCLUDED.pretix_order_code,
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         ticket_product = EXCLUDED.ticket_product,
         ticket_variation = EXCLUDED.ticket_variation,
         answers = EXCLUDED.answers,
         addons = EXCLUDED.addons,
         checked_in = EXCLUDED.checked_in,
         last_login_at = now(),
         updated_at = now()
       RETURNING id`,
      [position.id, position.order, name, email, productName, variationName, JSON.stringify(answers), addons, checkedIn]
    );
    return rows[0].id;
  },

  /**
   * Re-queries Pretix (by position id — the ticket secret is never
   * stored, so this cannot use the secret-based lookup) for current
   * check-in status and persists it. Read-only on the Pretix side.
   */
  async refreshCheckedIn(id: string): Promise<ParticipantDTO | null> {
    const { rows } = await pool.query<{ pretix_position_id: number }>(
      'SELECT pretix_position_id FROM participants WHERE id = $1',
      [id]
    );
    const positionId = rows[0]?.pretix_position_id;
    if (!positionId) return null;

    const checkins = await PretixService.getPositionCheckins(positionId);
    if (checkins === null) return this.findById(id); // Pretix unreachable — serve last known state

    await pool.query('UPDATE participants SET checked_in = $2, updated_at = now() WHERE id = $1', [
      id,
      hasCheckedIn(checkins),
    ]);
    return this.findById(id);
  },

  /** GDPR: deletes all local data for a participant (favourites cascade). */
  async deleteById(id: string): Promise<void> {
    await pool.query('DELETE FROM participants WHERE id = $1', [id]);
  },
};
