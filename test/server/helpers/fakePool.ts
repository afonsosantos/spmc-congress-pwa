/**
 * Minimal in-memory stand-in for the `pg` Pool used across tests, so tests
 * never touch a real database. Matches on the SQL text used by the app's
 * services/routes and keeps state in plain arrays/maps.
 */
import crypto from 'node:crypto';

interface Row {
  [key: string]: unknown;
}

export function createFakePool() {
  const participants: Row[] = [];
  const sessions: Row[] = [];
  const favourites: Row[] = [];
  const announcements: Row[] = [];
  const announcementReads: Row[] = [];
  const contentPages: Row[] = [];

  async function query<T extends Row = Row>(text: string, params: unknown[] = []): Promise<{ rows: T[]; rowCount: number }> {
    const sql = text.replace(/\s+/g, ' ').trim();

    if (sql.startsWith('INSERT INTO participants')) {
      const [pretix_position_id, pretix_order_code, name, email, ticket_product, ticket_variation, answers, addons, checked_in] = params;
      let row = participants.find((p) => p.pretix_position_id === pretix_position_id);
      if (row) {
        Object.assign(row, { pretix_order_code, name, email, ticket_product, ticket_variation, answers: JSON.parse(answers as string), addons, checked_in });
      } else {
        row = {
          id: crypto.randomUUID(),
          pretix_position_id,
          pretix_order_code,
          name,
          email,
          ticket_product,
          ticket_variation,
          answers: JSON.parse(answers as string),
          addons,
          checked_in,
        };
        participants.push(row);
      }
      return { rows: [{ id: row.id }] as unknown as T[], rowCount: 1 };
    }

    if (sql.startsWith('SELECT id, name, email, ticket_product, ticket_variation, answers, addons, checked_in FROM participants')) {
      const row = participants.find((p) => p.id === params[0]);
      return { rows: (row ? [row] : []) as T[], rowCount: row ? 1 : 0 };
    }

    if (sql.startsWith('SELECT pretix_position_id FROM participants')) {
      const row = participants.find((p) => p.id === params[0]);
      return { rows: (row ? [{ pretix_position_id: row.pretix_position_id }] : []) as unknown as T[], rowCount: row ? 1 : 0 };
    }

    if (sql.startsWith('UPDATE participants SET checked_in')) {
      const row = participants.find((p) => p.id === params[0]);
      if (row) row.checked_in = params[1];
      return { rows: [] as T[], rowCount: row ? 1 : 0 };
    }

    if (sql.startsWith('DELETE FROM participants')) {
      const idx = participants.findIndex((p) => p.id === params[0]);
      if (idx !== -1) participants.splice(idx, 1);
      return { rows: [] as T[], rowCount: idx === -1 ? 0 : 1 };
    }

    if (sql.startsWith('INSERT INTO app_sessions')) {
      const [token_hash, participant_id, expires_at] = params;
      sessions.push({ token_hash, participant_id, expires_at });
      return { rows: [] as T[], rowCount: 1 };
    }

    if (sql.startsWith('SELECT participant_id FROM app_sessions')) {
      const row = sessions.find((s) => s.token_hash === params[0] && (s.expires_at as Date) > new Date());
      return { rows: (row ? [{ participant_id: row.participant_id }] : []) as unknown as T[], rowCount: row ? 1 : 0 };
    }

    if (sql.startsWith('DELETE FROM app_sessions')) {
      const idx = sessions.findIndex((s) => s.token_hash === params[0]);
      if (idx !== -1) sessions.splice(idx, 1);
      return { rows: [] as T[], rowCount: idx === -1 ? 0 : 1 };
    }

    if (sql.startsWith('INSERT INTO favourite_sessions')) {
      const [participant_id, pretalx_session_id] = params;
      if (!favourites.some((f) => f.participant_id === participant_id && f.pretalx_session_id === pretalx_session_id)) {
        favourites.push({ participant_id, pretalx_session_id });
      }
      return { rows: [] as T[], rowCount: 1 };
    }

    if (sql.startsWith('SELECT pretalx_session_id FROM favourite_sessions')) {
      const rows = favourites.filter((f) => f.participant_id === params[0]);
      return { rows: rows as T[], rowCount: rows.length };
    }

    if (sql.startsWith('DELETE FROM favourite_sessions')) {
      const before = favourites.length;
      const [participant_id, pretalx_session_id] = params;
      for (let i = favourites.length - 1; i >= 0; i--) {
        if (favourites[i].participant_id === participant_id && favourites[i].pretalx_session_id === pretalx_session_id) {
          favourites.splice(i, 1);
        }
      }
      return { rows: [] as T[], rowCount: before - favourites.length };
    }

    if (sql.startsWith('SELECT id, title, body, priority, link, image_url, created_at FROM announcements')) {
      return { rows: announcements.filter((a) => a.published) as T[], rowCount: 0 };
    }

    if (sql.startsWith('SELECT id, title, body, priority, link, image_url AS "imageUrl", published, created_at AS "createdAt" FROM announcements')) {
      return { rows: announcements as T[], rowCount: announcements.length };
    }

    if (sql.startsWith('SELECT announcement_id FROM announcement_reads')) {
      const rows = announcementReads.filter((r) => r.participant_id === params[0]);
      return { rows: rows as T[], rowCount: rows.length };
    }

    if (sql.startsWith('INSERT INTO announcement_reads')) {
      announcementReads.push({ participant_id: params[0], announcement_id: params[1] });
      return { rows: [] as T[], rowCount: 1 };
    }

    if (sql.startsWith('SELECT slug, title, icon, section, position FROM content_pages')) {
      const rows = contentPages.filter((p) => p.visible !== false);
      return { rows: rows as T[], rowCount: rows.length };
    }

    if (sql.startsWith('SELECT slug, title, body, icon, section, updated_at AS "updatedAt" FROM content_pages')) {
      const row = contentPages.find((p) => p.slug === params[0] && p.visible !== false);
      return { rows: (row ? [row] : []) as T[], rowCount: row ? 1 : 0 };
    }

    if (sql.startsWith('SELECT slug, title, body, icon, section, position, visible, updated_at AS "updatedAt" FROM content_pages')) {
      return { rows: contentPages as T[], rowCount: contentPages.length };
    }

    if (sql.startsWith('INSERT INTO content_pages')) {
      const [slug, title, body, icon, section, position, visible] = params;
      if (contentPages.some((p) => p.slug === slug)) {
        const err = new Error('duplicate key') as Error & { code: string };
        err.code = '23505';
        throw err;
      }
      contentPages.push({ slug, title, body, icon, section, position, visible, updatedAt: new Date() });
      return { rows: [] as T[], rowCount: 1 };
    }

    if (sql.startsWith('UPDATE content_pages SET')) {
      const [slug, title, body, icon, section, position, visible] = params;
      const row = contentPages.find((p) => p.slug === slug);
      if (row) {
        Object.assign(row, {
          title: title ?? row.title,
          body: body ?? row.body,
          icon: icon ?? row.icon,
          section: section ?? row.section,
          position: position ?? row.position,
          visible: visible ?? row.visible,
          updatedAt: new Date(),
        });
      }
      return { rows: [] as T[], rowCount: row ? 1 : 0 };
    }

    if (sql.startsWith('DELETE FROM content_pages')) {
      const idx = contentPages.findIndex((p) => p.slug === params[0]);
      if (idx !== -1) contentPages.splice(idx, 1);
      return { rows: [] as T[], rowCount: idx === -1 ? 0 : 1 };
    }

    if (sql.startsWith('SELECT 1')) {
      return { rows: [{ '?column?': 1 }] as unknown as T[], rowCount: 1 };
    }

    throw new Error(`fakePool: unhandled query: ${sql}`);
  }

  return {
    query,
    connect: async () => ({
      query,
      release: () => {},
    }),
    _state: { participants, sessions, favourites, announcements, announcementReads, contentPages },
  };
}
