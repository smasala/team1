import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 CLI config (migrate, studio, generate). The data-access library owns
// the schema; the connection URL comes from .env (DATABASE_URL).
export default defineConfig({
  schema: 'libs/data-access/prisma/schema.prisma',
  migrations: {
    path: 'libs/data-access/prisma/migrations',
    seed: 'node --import @swc-node/register/esm-register libs/data-access/prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
