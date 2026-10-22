import { z } from 'zod';

const schema = z.object({
  BABELWASH_API_PORT: z.coerce.number().int().positive().default(4310),
  BABELWASH_WEB_ORIGIN: z.string().url().default('http://127.0.0.1:4311'),
  BABELWASH_DATABASE_PATH: z.string().default('./runtime/babelwash.db'),
  BABELWASH_JWT_SECRET: z.string().min(32).default('local-babelwash-secret-with-32-characters'),
  BABELWASH_RESET_DATABASE: z.enum(['true', 'false']).default('false'),
});

export type AppConfig = z.infer<typeof schema>;

export function readConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  return schema.parse(environment);
}
