/**
 * Backfill Item.embedding for catalogue rows that have none (#12).
 *
 * Idempotent: only touches items where embedding IS NULL, so it is safe to
 * re-run and resumes after an interruption. Run after seeding (the catalogue is
 * re-created with null embeddings on every `npm run db:seed`) or after enabling
 * embeddings on an already-seeded database.
 *
 * Lives under scripts/ (top-level tooling) so it can import the app's embedding
 * helpers without the data-access seed depending on apps/api. Uses the same
 * PrismaPg adapter as the seed so Supabase connection quirks are handled.
 *
 * Run:  npm run db:embed
 *       (= node --import @swc-node/register/esm-register scripts/db/backfill-embeddings.ts)
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  EMBEDDING_DIM,
  embedTexts,
  isEmbeddingConfigured,
  writeItemEmbedding,
} from '../../apps/api/src/app/ai/embedding';
import { PrismaClient } from '../../libs/data-access/src/generated/prisma/client.js';

/** Items embedded per Gemini batch call. */
const BATCH = 100;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main(): Promise<void> {
  if (!isEmbeddingConfigured()) {
    console.error(
      'GEMINI_API_KEY is not set — cannot produce embeddings. Aborting.',
    );
    process.exitCode = 1;
    return;
  }

  const rows = await prisma.$queryRawUnsafe<{ id: string; description: string }[]>(
    'SELECT id, description FROM "Item" WHERE embedding IS NULL',
  );
  if (rows.length === 0) {
    console.log('All items already embedded — nothing to do.');
    return;
  }

  console.log(`Embedding ${rows.length} item(s) at ${EMBEDDING_DIM} dims …`);
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const vectors = await embedTexts(batch.map((r) => r.description));
    for (let j = 0; j < batch.length; j++) {
      await writeItemEmbedding(prisma, batch[j].id, vectors[j]);
    }
    done += batch.length;
    console.log(`  ${done}/${rows.length}`);
  }
  console.log('Embedding backfill complete.');
}

main()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
