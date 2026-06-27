/**
 * Apply a raw .sql file to the database using the SAME connection path as the
 * seed (PrismaPg driver adapter over DATABASE_URL), so Supabase pooler / SSL
 * connection-string quirks are handled identically.
 *
 * Prisma has no native pgvector type, so the AI pipeline's extensions and
 * ANN/FTS/trigram indexes (#11) live in prisma/sql/*.sql and are applied with
 * this runner rather than through `db push`.
 *
 * Run:  node --import @swc-node/register/esm-register scripts/db/run-sql.ts <file.sql>
 *       (wrapped by the npm run db:pgvector* scripts)
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../libs/data-access/src/generated/prisma/client.js';

/** Split a SQL file into individual statements: strip `--` line comments and
 *  blank lines, then split on `;`. Our scripts contain no semicolons inside
 *  literals, so this naive split is sufficient and keeps the runner dependency
 *  free. The driver adapter runs one statement per call. */
function splitStatements(sql: string): string[] {
  return sql
    .split('\n')
    .map((line) => line.replace(/--.*$/, ''))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function main(): Promise<void> {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: run-sql.ts <path-to.sql>');
    process.exitCode = 1;
    return;
  }

  const path = resolve(process.cwd(), file);
  const statements = splitStatements(readFileSync(path, 'utf-8'));

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    console.log(`Applying ${statements.length} statement(s) from ${file} …`);
    for (const stmt of statements) {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`  ✓ ${stmt.replace(/\s+/g, ' ').slice(0, 80)}`);
    }
    console.log('Done.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('SQL apply failed:', err);
  process.exitCode = 1;
});
