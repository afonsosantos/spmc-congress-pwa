/**
 * Reshapes Nitro's default `{statusCode, statusMessage, message, stack}`
 * error body into the `{ error: string }` shape the frontend's api.ts
 * expects (ported from the old Express error middleware / res.status().json()
 * calls, which always returned that shape).
 *
 * Only `error.message` from a deliberate `createError()` call (h3 marks
 * those `unhandled: false`) is ever shown to the client — a genuinely
 * unhandled exception (a raw `throw`, a `pg` error, etc.) always gets the
 * generic fallback instead, since its `.message` could contain internal
 * details (SQL text, stack info) that were never meant to reach a client.
 */
export default defineNitroErrorHandler((error, event) => {
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) {
    logger.error('unhandled error', { message: error.message });
  }

  setResponseStatus(event, statusCode);
  setResponseHeader(event, 'Content-Type', 'application/json');
  return send(
    event,
    JSON.stringify({
      error: !error.unhandled && error.message ? error.message : 'Não foi possível ligar ao servidor.',
    })
  );
});
