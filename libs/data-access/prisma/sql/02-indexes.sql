-- Phase 0 / task #11 — retrieval indexes on Item. Idempotent: safe to re-run.
--
-- ORDER MATTERS: run this AFTER `prisma db push` has created the
-- Item.embedding column (the HNSW index references it).
--
-- NOTE: `prisma db push` only manages indexes declared in schema.prisma and may
-- DROP these raw-SQL indexes on a later push. Re-run this file after every push
-- (npm run db:pgvector:idx). The full `npm run db:pgvector` does this for you.
--
-- search_path covers Supabase, where the operator classes / access methods live
-- in the `extensions` schema rather than `public`.
set search_path to public, extensions;

-- German full-text search over the catalogue description (the FTS half of the
-- hybrid retrieval in #13).
create index if not exists item_description_fts_de_idx
  on "Item" using gin (to_tsvector('german', description));

-- Trigram index for fuzzy / German-compound substring matching
-- (Hausabbruch vs Abbruch) that the old substring match missed.
create index if not exists item_description_trgm_idx
  on "Item" using gin (description gin_trgm_ops);

-- Approximate-nearest-neighbour index for cosine similarity over the 768-dim
-- embeddings. HNSW builds fine on an empty / partly-populated table, so it is
-- safe to create before the embedding backfill (#12) has run.
create index if not exists item_embedding_hnsw_idx
  on "Item" using hnsw (embedding vector_cosine_ops);
