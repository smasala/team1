# FeldPro — AI Offer Pipeline: Plan & Session Handoff

> Living handoff doc. Read this first when resuming work on the AI offer drafter.
> Last updated: 2026-06-27. Branch: `main`. Last shipped commit: `9458868`.

---

## 1. Where things stand (shipped this session)

Commit `9458868` (`feat: server-side Supabase login, single-price catalogue, Gemini-only drafting`) is on `main` and pushed. It made three changes:

### Auth — server-side password verification, decoupled identity
- `User.id` is now our own generated **cuid**. A new `User.authId` (`String? @unique`)
  holds the **Supabase Auth UUID** — explicitly **not 1:1** with `id` (invited members
  exist with no `authId` until first sign-in).
- `POST /auth/login` (`apps/api/src/app/auth/auth.controller.ts`) takes `{email, password}`,
  verifies them **server-side** against Supabase Auth (GoTrue) in
  `apps/api/src/app/auth/supabase-auth.ts`, then resolves the app user by `authId` and
  mints our HS256 token (org + role claims).
- The old `dev-login` endpoint, the auto-login button, and the browser Supabase client
  (`supabase-client.ts`) are **gone**. The login page always requires email + password.
- Guard fallback (`auth.service.ts → provision`) now keys on `authId`.
- Seeded test user: `authId = 68e75f68-1ee2-46f4-9fee-2bbb2613a02d` (a real Supabase
  `auth.users` row); its app `id` is a cuid generated at seed time.

### Catalogue — single price column
- `Item` dropped `basePrice`, `markupPct`, `priceRaw`, `unitRaw`. **Only `price` remains.**
- The **+30% markup is baked into `price` at seed time** (`libs/data-access/prisma/seed.ts`).
- UI: markup input + double-price display removed; `ItemSheet` extracted to its own file
  (`apps/web/src/app/pages/item-sheet.tsx`).

### AI — Gemini-only
- `ai.service` no longer has a local regex parser (deleted `offer-parser.ts` + spec).
  When `GEMINI_API_KEY` is unset or the API errors, drafting throws
  `ServiceUnavailableException` (no silent fallback). `ParsedSegment` now lives in `gemini.ts`.

### DB
- Database was **reset (`prisma db push --force-reset`) and re-seeded**: 29 categories,
  187 subcategories, **2,869 single-price items**, 1 test user. The Supabase `auth.users`
  schema was untouched.

---

## 2. Required environment (.env)

The app will not fully run without these (see `.env.example`):

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Supabase Postgres (session pooler, `uselibpqcompat=true`) |
| `SUPABASE_JWT_SECRET` | Verify/sign our HS256 access tokens |
| `SUPABASE_URL` | **NEW** — backend posts credentials to `{SUPABASE_URL}/auth/v1/token` |
| `SUPABASE_ANON_KEY` | **NEW** — `apikey` header for the GoTrue password grant |
| `GEMINI_API_KEY` | **Now required** for offer drafting (no fallback) |
| `GEMINI_MODEL` | Optional, default `gemini-2.5-flash` |
| `VITE_API_URL` | Frontend → API base |

To sign in: use the email/password of a Supabase `auth.users` row whose UUID is stored
on some `User.authId`. The seeded test user is linked to `68e75f68-…`.

---

## 3. The AI pipeline we are building (agreed design)

**Goal:** the drafter must *infer the full set of work positions* a job implies
(e.g. "demolition of 100 m² house" → site setup, disconnection, stripping, structural
demolition, disposal by fraction, transport, backfill…), match each to the catalogue,
and assemble an accurate, detailed offer.

**Core principle — keep generation and grounding physically separate:**
- **Decomposition is generative.** The catalogue does NOT contain "demolish a house";
  it has positions like *Mauerwerk abbrechen*, *Bauschutt entsorgen (t)*. The AI must
  invent the breakdown.
- **Matching + pricing is grounded.** Every inferred position resolves to a real
  catalogue row (or is flagged "price manually"). **Prices always come from the DB, never
  the model. The model never emits catalogue item ids except by selecting from a
  retrieved candidate set.**

### Pipeline stages
```
request
  ─▶ 1. DECOMPOSE (Gemini, catalogue-aware)   ← feed it the category/subcategory taxonomy
        → positions: {task, DE terms, target category, quantity, unit, assumptions[]}
  ─▶ 2. ESTIMATE QUANTITIES (within step 1)
        → derive m³/t/St from stated dims + EXPLICIT, editable assumptions
  ─▶ 3. RETRIEVE per position (hybrid pgvector + FTS, RRF, category/unit boost) → top-K
  ─▶ 4. SELECT/RERANK per position (Gemini picks from the K real candidates → no hallucinated ids)
  ─▶ 5. ASSEMBLE offer (prices from DB) + coverage report + editable assumptions, grouped by section
```

### Why these choices (critique of the original ideas)
- **"Send the whole catalogue to Gemini"** — rejected as the primary path. 2,869 items
  ≈ 100–170k tokens; re-sent every draft; invites hallucinated/wrong item ids. Context
  caching mitigates cost but not id fidelity.
- **"pgvector + category"** — yes, this is the retrieval baseline. Embed each description
  once; ANN cosine search; use category as a **filter/boost**, not a hard gate (the model's
  category guess can be wrong). Multilingual embeddings handle DE/EN + German compounds
  (Hausabbruch vs Abbruch) that the old substring match misses.
- **Better than either:** hybrid (pgvector ⊕ pg_trgm/FTS via Reciprocal Rank Fusion) for
  retrieval, then a **retrieve-then-rerank** LLM step that selects from real candidates.

### Non-negotiables
- **Quantities are the accuracy/liability risk**, not the position list. The AI must state
  assumptions (storeys, height, construction type, debris density) **explicitly and
  editable** — never silently guess. Product principle: *AI drafts fast; the human verifies
  assumptions before sending.*
- **Coverage is a feature.** Never drop an unmatched position — flag it "no match — price
  manually." An incomplete demolition quote is worse than one with a visible gap.
- **Job templates** (curated archetypes: Hausabbruch, Badsanierung, Dachsanierung) as
  few-shot scaffolds make decomposition far more reliable and match German trade
  conventions. Start prompt-embedded; graduate to a `JobTemplate` table only if it earns it.
- Run **decomposition at lower temperature** for offer stability; keep a "regenerate"
  affordance. (Today's segment extraction runs at temp 0.9 — intentionally
  non-deterministic; revisit for the decomposition stage.)

---

## 4. Task checklist (tracked as #10–#25)

> These exist in the session task tracker with dependencies wired. If starting fresh and
> the tracker is empty, recreate from this list.

### Phase 0 — Contracts & data model (do first; unblocks everything)
- [x] **#10** Extend `AiDraftResponse`/`AiDraftLine` (shared-types): per-line `assumptions[]`,
      top-level `coverage` (matched vs manual), section/trade grouping, quantity rationale.
      *Done:* `libs/shared-types/src/lib/ai.ts` now has `AiLineStatus`, per-line
      `status`/`section?`/`assumptions?`/`quantityRationale?`, and `AiDraftCoverage`.
      `ai.service` populates `status` + `coverage` today (section/assumptions/rationale wait
      for Phase 2).
- [~] **#11** Enable `pgvector` + `pg_trgm` on Supabase; add `Item.embedding vector(768)`
      via Prisma `Unsupported()`; German tsvector/FTS index + trigram index on `description`
      (raw SQL — Prisma has no native vector type).
      *Code done, live DB apply pending:* `Item.embedding Unsupported("vector(768)")?` is in
      the schema; raw SQL lives in `libs/data-access/prisma/sql/{01-extensions,02-indexes}.sql`
      applied by `scripts/db/run-sql.ts`. **Apply with `npm run db:pgvector`** (extensions →
      `db push` → indexes, in that order — db push needs the `vector` type first; it may drop
      the raw indexes so the script re-applies them). FTS index uses the `german` config;
      vector index is HNSW `vector_cosine_ops`.

### Phase 1 — Retrieval foundation
- [ ] **#12** Embedding service (Gemini `text-embedding-004`, 768-dim); batch-embed all
      items at seed; re-embed on item create/update. *(needs #11)*
- [ ] **#13** Hybrid retrieval service: pgvector ANN ⊕ FTS/trigram via RRF; category +
      unit boost; top-K (~15–20); org-scoped raw SQL. *(needs #11, #12)*
- [ ] **#14** Replace the substring `bestMatch` in `ai.service` with the retrieval service
      (drop-in, keep today's segments — proves retrieval quality). *(needs #13)*

### Phase 2 — Generative decomposition
- [ ] **#15** Catalogue-aware decomposition prompt: feed taxonomy → structured positions
      {task, DE terms, category, quantity, unit, assumptions[]}; lower temperature. *(needs #10)*
- [ ] **#16** Quantity estimation + explicit/editable assumptions. *(needs #15)*
- [ ] **#17** Job-template (few-shot archetype) library + lookup step.

### Phase 3 — Rerank & assemble
- [ ] **#18** Gemini rerank/select best candidate per position (ids constrained to the
      retrieved K). *(needs #13, #15)*
- [ ] **#19** Assemble offer: DB prices, section grouping, coverage report. *(needs #10, #16, #18)*

### Phase 4 — UI
- [ ] **#20** Assistant UI: sections, per-line assumptions, coverage badges. *(needs #19)*
- [ ] **#21** Editable assumptions panel → re-derive quantities, re-price from DB. *(needs #19)*
- [ ] **#22** Regenerate affordance (preserve edited assumptions).

### Phase 5 — Quality & docs
- [ ] **#23** Tests: retrieval golden queries, decomposition schema/coverage, totals
      (mock Gemini). *(needs #14, #19)*
- [ ] **#24** Eval harness: realistic job prompts → coverage/accuracy metrics.
- [ ] **#25** Docs + `.env` (embedding key) + graphify refresh.

**Critical-path spine:** #10/#11 → #12 → #13 → #15 → #18 → #19 → UI.
**Highest-leverage early wins:** #14 (retrieval beats substring with no other changes) and
#15 (the actual job decomposition). Don't ship without #16's surfaced assumptions.

---

## 5. Key files

| Concern | Path |
|---------|------|
| Prisma schema (DB source of truth) | `libs/data-access/prisma/schema.prisma` |
| Seed (markup baked in, test user by authId) | `libs/data-access/prisma/seed.ts` |
| AI orchestrator (segment → match → assemble) | `apps/api/src/app/ai/ai.service.ts` |
| Gemini call + `ParsedSegment` | `apps/api/src/app/ai/gemini.ts` |
| Domain language (units, stopwords, EN→DE expansion) | `apps/api/src/app/ai/language.ts` |
| AI wire contract (now with coverage/assumptions/sections) | `libs/shared-types/src/lib/ai.ts` |
| pgvector/FTS/trigram raw SQL (#11) | `libs/data-access/prisma/sql/*.sql` |
| Raw-SQL runner (PrismaPg adapter, mirrors seed) | `scripts/db/run-sql.ts` |
| Catalogue item CRUD | `apps/api/src/app/catalogue/item.service.ts` |
| Auth: login + provision | `apps/api/src/app/auth/auth.service.ts` |
| Supabase password verify | `apps/api/src/app/auth/supabase-auth.ts` |
| Totals math (round2, lineTotal, computeTotals) | `apps/api/src/app/common/totals.ts` |
| Catalogue source data | `scripts/baupreise-catalogue.json` |

---

## 6. Commands

```bash
npm install            # postinstall runs prisma generate
npm run db:push        # sync schema (add --accept-data-loss for column drops)
npm run db:pgvector    # #11: extensions -> db push -> FTS/trigram/HNSW indexes
npm run db:seed        # reseed catalogue + test user
npm run dev            # api :3000/api + web :4200
npx nx run-many -t typecheck lint test -p api web data-access shared-types
npx nx run-many -t build -p api web
```

- Use `npx nx` (pnpm is not on the Git Bash PATH here; `npx nx` works).
- `prisma db push --force-reset` is guarded for AI agents — it requires the user's
  explicit consent and the `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` env var.

---

## 7. Conventions / gotchas

- **Merge straight to `main` and push — no PR step.** (Already the workflow.)
- **Every React component gets its own file.** No two components per module.
- **graphify** knowledge graph: rebuild with `/graphify` after structural changes.
  `graphify-out/` is gitignored — a fresh clone has none until rebuilt. As of this
  session: 960 nodes / 1539 edges / 60 communities.
- Status fields are plain `String` columns (not Prisma enums) for SQLite portability.
- Totals are **denormalised snapshots** on Offer/Invoice + frozen `unitPrice`/`lineTotal`
  on line items, so historical docs don't shift when the catalogue changes.

---

## 8. Open decisions for the next session
- Embedding model: Gemini `text-embedding-004` (768-dim) keeps it single-provider — confirm.
- `JobTemplate` as a DB table vs prompt-embedded few-shot (start with the latter).
- Decomposition temperature (lower than the current 0.9 for stability) — pick a value + test.
- Whether to expose retrieval `matchScore`/candidates in the UI for trust/debugging.
