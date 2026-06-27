/**
 * Gemini-backed text embeddings for catalogue retrieval (Phase 1, #12).
 *
 * Each catalogue item's description is embedded once into a 768-dim vector and
 * stored in Item.embedding (pgvector). Semantic retrieval (#13) then does an ANN
 * cosine search over those vectors so DE/EN phrasings and German compounds
 * (Hausabbruch vs Abbruch) match where the old substring search missed.
 *
 * Single provider: reuses GEMINI_API_KEY (the model is text-embedding-004 by
 * default). Pure API/DB helpers — no Nest — so the seed and the backfill script
 * can reuse them outside the DI container, exactly like gemini.ts.
 */

/** Native output width of text-embedding-004; matches the Item.embedding column. */
export const EMBEDDING_DIM = 768;

const DEFAULT_EMBEDDING_MODEL = 'text-embedding-004';
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
/** Max inputs per batchEmbedContents call. */
const BATCH_SIZE = 100;

/** True when an API key is configured (same key as the drafter). */
export const isEmbeddingConfigured = (): boolean =>
  Boolean(process.env.GEMINI_API_KEY);

interface BatchEmbedResponse {
  embeddings?: { values?: number[] }[];
}

/**
 * Embed an array of texts into 768-dim vectors, preserving input order. Calls
 * the Gemini batch endpoint in chunks of BATCH_SIZE. Throws on missing key,
 * network/API error, or a shape/length mismatch (callers decide whether that is
 * fatal — the request path treats embedding as best-effort).
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  const model = process.env.GEMINI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL;

  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const chunk = texts.slice(i, i + BATCH_SIZE);
    const res = await fetch(
      `${ENDPOINT}/${model}:batchEmbedContents?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: chunk.map((text) => ({
            model: `models/${model}`,
            content: { parts: [{ text }] },
            outputDimensionality: EMBEDDING_DIM,
          })),
        }),
      },
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Gemini embeddings ${res.status}: ${detail.slice(0, 200)}`);
    }

    const data = (await res.json()) as BatchEmbedResponse;
    const embeddings = data.embeddings ?? [];
    if (embeddings.length !== chunk.length) {
      throw new Error(
        `Gemini returned ${embeddings.length} embeddings for ${chunk.length} inputs`,
      );
    }
    for (const e of embeddings) {
      const values = e.values ?? [];
      if (values.length !== EMBEDDING_DIM) {
        throw new Error(
          `Embedding has ${values.length} dims, expected ${EMBEDDING_DIM}`,
        );
      }
      out.push(values);
    }
  }
  return out;
}

/** Embed a single text into one 768-dim vector. */
export async function embedText(text: string): Promise<number[]> {
  const [vector] = await embedTexts([text]);
  return vector;
}

/** pgvector text literal, e.g. `[0.1,0.2,…]`. */
export const toVectorLiteral = (vector: number[]): string =>
  `[${vector.join(',')}]`;

/** Minimal structural type satisfied by both PrismaService and the seed/backfill
 *  PrismaClient — just the raw escape hatch we need to write the vector column. */
export interface RawExecutor {
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
}

/**
 * Persist one embedding to Item.embedding. Done with raw SQL because Prisma
 * omits the Unsupported("vector(768)") column from the typed client, so it
 * cannot be written through item.update().
 */
export async function writeItemEmbedding(
  client: RawExecutor,
  itemId: string,
  vector: number[],
): Promise<void> {
  await client.$executeRawUnsafe(
    'UPDATE "Item" SET embedding = $1::vector WHERE id = $2',
    toVectorLiteral(vector),
    itemId,
  );
}
