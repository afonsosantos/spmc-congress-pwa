import type { H3Event } from 'h3';

/**
 * Tiny in-memory sliding-window rate limiter (h3/Nitro has no
 * express-rate-limit equivalent). One process, one Map — matches this app's
 * existing single-container deployment assumption (same as the in-memory
 * Pretalx cache).
 * ponytail: global in-memory limiter, resets on restart and doesn't share
 * state across instances — move to a Redis-backed limiter if this ever runs
 * as more than one instance.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Distinguishes this limiter from others sharing the same client key. */
  name: string;
  windowMs: number;
  limit: number;
  message?: string;
}

/** Throws a 429 createError once `limit` is exceeded within `windowMs`. */
export function rateLimit(event: H3Event, opts: RateLimitOptions): void {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown';
  const key = `${opts.name}:${ip}`;
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + opts.windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  if (bucket.count > opts.limit) {
    throw createError({
      statusCode: 429,
      message: opts.message ?? 'Demasiadas tentativas. Tente novamente mais tarde.',
    });
  }
}
