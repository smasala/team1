import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'data-access';
import {
  embedText,
  embedTexts,
  isEmbeddingConfigured,
  writeItemEmbedding,
} from './embedding';

interface ItemRow {
  id: string;
  description: string;
}

/** How many items to embed per batch when backfilling. */
const BACKFILL_BATCH = 100;

/**
 * Owns the catalogue's vector embeddings: re-embeds an item when it is created
 * or its description changes, and can backfill items that have none.
 *
 * Embedding is best-effort from a request's point of view — a failure (no key,
 * API error) is logged and swallowed so catalogue writes never fail because the
 * embedding step did. The vector is filled in later by a backfill instead.
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Whether embeddings can be produced at all (API key present). */
  get enabled(): boolean {
    return isEmbeddingConfigured();
  }

  /**
   * Embed one item's description and persist it. Never throws; returns whether
   * the embedding was written. Safe to call fire-and-forget from a write path.
   */
  async embedItem(itemId: string, description: string): Promise<boolean> {
    if (!isEmbeddingConfigured()) return false;
    try {
      const vector = await embedText(description);
      await writeItemEmbedding(this.prisma, itemId, vector);
      return true;
    } catch (err) {
      this.logger.warn(
        `Failed to embed item ${itemId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return false;
    }
  }

  /**
   * Embed every item that has no embedding yet (optionally scoped to one org).
   * Returns the number embedded. Intended for admin/maintenance use; the seed
   * and the standalone backfill script embed directly via the pure helpers.
   */
  async backfillMissing(organisationId?: string): Promise<number> {
    if (!isEmbeddingConfigured()) return 0;

    const rows = organisationId
      ? await this.prisma.$queryRawUnsafe<ItemRow[]>(
          `SELECT i.id, i.description FROM "Item" i
           JOIN "Category" c ON c.id = i."categoryId"
           WHERE i.embedding IS NULL AND c."organisationId" = $1`,
          organisationId,
        )
      : await this.prisma.$queryRawUnsafe<ItemRow[]>(
          `SELECT id, description FROM "Item" WHERE embedding IS NULL`,
        );

    let embedded = 0;
    for (let i = 0; i < rows.length; i += BACKFILL_BATCH) {
      const batch = rows.slice(i, i + BACKFILL_BATCH);
      const vectors = await embedTexts(batch.map((r) => r.description));
      for (let j = 0; j < batch.length; j++) {
        await writeItemEmbedding(this.prisma, batch[j].id, vectors[j]);
        embedded++;
      }
    }
    return embedded;
  }
}
