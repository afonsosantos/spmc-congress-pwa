import webpush from 'web-push';
import { env, pushConfigured } from '../utils/env';
import { pool } from '../db/pool';
import { logger } from '../utils/logger';

if (pushConfigured) {
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export const PushService = {
  enabled: pushConfigured,
  publicKey: env.VAPID_PUBLIC_KEY || null,

  async subscribe(participantId: string | null, sub: PushSubscriptionInput): Promise<void> {
    await pool.query(
      `INSERT INTO push_subscriptions (participant_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET participant_id = EXCLUDED.participant_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
      [participantId, sub.endpoint, sub.keys.p256dh, sub.keys.auth]
    );
  },

  async unsubscribe(endpoint: string): Promise<void> {
    await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
  },

  async broadcast(payload: { title: string; body: string; url?: string }): Promise<void> {
    if (!pushConfigured) return;
    const { rows } = await pool.query<{ endpoint: string; p256dh: string; auth: string }>(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions'
    );
    await Promise.all(
      rows.map(async (row) => {
        try {
          await webpush.sendNotification(
            { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
            JSON.stringify(payload)
          );
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [row.endpoint]);
          } else {
            logger.warn('push send failed', { status });
          }
        }
      })
    );
  },
};
