import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(20),
  R2_BUCKET: z.string().min(1),
  R2_ENDPOINT: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_PUBLIC_URL_BASE: z.string().min(1),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
