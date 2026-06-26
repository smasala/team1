import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 CLI config (migrate, studio, generate). The data-access library owns
// the schema; the connection URL comes from .env (DATABASE_URL).
export default defineConfig({
  schema: 'libs/data-access/prisma/schema.prisma',
  migrations: {
    path: 'libs/data-access/prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
