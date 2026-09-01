import { pool } from '../../../db/pool';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!;
  await pool.query('DELETE FROM announcements WHERE id = $1', [id]);
  return { ok: true };
});
