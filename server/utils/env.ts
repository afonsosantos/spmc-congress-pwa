import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 characters'),

  PRETIX_BASE_URL: z.string().min(1, 'PRETIX_BASE_URL is required'),
  PRETIX_ORGANIZER: z.string().min(1, 'PRETIX_ORGANIZER is required'),
  PRETIX_EVENT: z.string().min(1, 'PRETIX_EVENT is required'),
  PRETIX_API_TOKEN: z.string().min(1, 'PRETIX_API_TOKEN is required'),

  PRETALX_BASE_URL: z.string().min(1, 'PRETALX_BASE_URL is required'),
  PRETALX_EVENT: z.string().min(1, 'PRETALX_EVENT is required'),

  VAPID_PUBLIC_KEY: z.string().optional().default(''),
  VAPID_PRIVATE_KEY: z.string().optional().default(''),
  VAPID_SUBJECT: z.string().optional().default(''),

  ADMIN_USERNAME: z.string().optional().default(''),
  ADMIN_PASSWORD: z.string().optional().default(''),
});

export const env = schema.parse(process.env);

export const pushConfigured = Boolean(
  env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT
);
