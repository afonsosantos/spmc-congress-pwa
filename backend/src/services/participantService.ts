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
}

interface ParticipantRow {
  id: string;
  name: string;
  email: string;
  ticket_product: string;
  ticket_variation: string;
  answers: Record<string, string>;
}

function toDTO(row: ParticipantRow): ParticipantDTO {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    ticket: { product: row.ticket_product, variation: row.ticket_variation || null },
    workshops: row.answers.workshop ? [row.answers.workshop] : [],
    answers: row.answers,
  };
}

export const ParticipantService = {
  toDTO,

  async findById(id: string): Promise<ParticipantDTO | null> {
    const { rows } = await pool.query<ParticipantRow>(
      'SELECT id, name, email, ticket_product, ticket_variation, answers FROM participants WHERE id = $1',
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

    const name = position.attendee_name ?? '';
    const email = position.attendee_email ?? '';

    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO participants (pretix_position_id, pretix_order_code, name, email, ticket_product, ticket_variation, answers, last_login_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
       ON CONFLICT (pretix_position_id) DO UPDATE SET
         pretix_order_code = EXCLUDED.pretix_order_code,
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         ticket_product = EXCLUDED.ticket_product,
         ticket_variation = EXCLUDED.ticket_variation,
         answers = EXCLUDED.answers,
         last_login_at = now(),
         updated_at = now()
       RETURNING id`,
      [position.id, position.order, name, email, productName, variationName, JSON.stringify(answers)]
    );
    return rows[0].id;
  },

  /** GDPR: deletes all local data for a participant (favourites cascade). */
  async deleteById(id: string): Promise<void> {
    await pool.query('DELETE FROM participants WHERE id = $1', [id]);
  },
};
