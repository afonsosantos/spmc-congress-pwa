import { pool } from '../db/pool';

export default defineEventHandler(async (event) => {
  try {
    await pool.query('SELECT 1');
    return { ok: true };
  } catch {
    setResponseStatus(event, 503);
    return { ok: false };
  }
});
