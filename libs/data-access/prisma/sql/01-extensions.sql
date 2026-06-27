-- Phase 0 / task #11 — enable the Postgres extensions the AI retrieval
-- pipeline depends on. Idempotent: safe to re-run.
--
-- ORDER MATTERS: this must run BEFORE `prisma db push` creates the
-- Item.embedding vector(768) column — db push needs the `vector` type to
-- already exist. On Supabase both extensions are available out of the box.
--
-- Apply with:  npm run db:pgvector:ext   (or the full npm run db:pgvector)

create extension if not exists vector;
create extension if not exists pg_trgm;
