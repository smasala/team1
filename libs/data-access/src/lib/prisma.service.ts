import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * The single owner of the Prisma connection for the whole app.
 *
 * DB swap (SQLite -> Supabase/Postgres): replace the adapter below with
 *   `new PrismaPg({ connectionString: process.env.DATABASE_URL })`
 * from `@prisma/adapter-pg`, set the provider to "postgresql" in the schema,
 * and point DATABASE_URL at Supabase. No other file changes.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      adapter: new PrismaBetterSqlite3({
        url: process.env.DATABASE_URL ?? 'file:./dev.db',
      }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
