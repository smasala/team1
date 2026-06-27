# FeldPro

AI-driven **offer & invoice manager for field tradesmen** — browse a priced trade
catalogue, build offers and invoices, or just describe the job and let the
assistant draft a quote.

Stack: **Nx · React (Vite) · NestJS · Prisma · Supabase (Postgres)**.

## Layout

```
apps/
  web/            React + Vite — mobile-first "field instrument" UI
    src/app/
      api/        typed API client
      auth/       auth context (Supabase session)
      components/ shell, line editor, document view, UI primitives
      pages/      login, catalogue, offers, invoices, assistant, account
  api/            NestJS — thin controllers -> services
    src/app/
      auth/       Supabase JWT guard, dev-login
      catalogue/  Category / Subcategory / Item CRUD
      offers/     offer CRUD (priced line items, totals)
      invoices/   invoice CRUD + generate-from-offer
      ai/         natural-language -> structured offer draft
      common/     line-item resolver, totals, exception filter
libs/
  shared-types/   wire contracts shared by web + api (defined once)
  data-access/    Prisma client + PrismaService (sole DB owner)
```

**Dependency direction:** `web -> shared-types`, `api -> shared-types + data-access`.
Only `data-access` touches the database.

## Getting started

```bash
npm install            # also runs `prisma generate` (postinstall)
npm run db:push        # sync the schema to Supabase Postgres
npm run db:seed        # seed the catalogue (+30% markup) and the test user
npm run dev            # api (http://localhost:3000/api) + web (http://localhost:4200)
```

Open the web app and tap **Open test workspace** to sign in as the seeded test
user, then try the assistant: *"I need an offer for 100m² house demolition."*

## How it works

- **Catalogue** is seeded from `scripts/baupreise-catalogue.json` (2,869 German
  trade items). A strict **+30% markup** is applied: `Item.basePrice` keeps the
  raw baseline, `Item.price` is the sell price (`round(base × 1.30, 2)`).
- **Offers & invoices** store priced *snapshot* line items, so historical
  documents never shift when the catalogue changes. An accepted offer can be
  turned into an invoice in one tap.
- **AI assistant** parses a natural-language request (quantity + unit + trade
  terms, English or German) and matches it against the catalogue to draft a
  structured, priced offer.
- **Auth** uses a Supabase-shaped HS256 JWT verified with `SUPABASE_JWT_SECRET`.
  A dev-login endpoint mints a token for the seeded test user; swap in
  `@supabase/supabase-js` client auth for production (see `.env.example`).

## Scripts

| Script | Does |
| --- | --- |
| `npm run dev` | Serve api + web together |
| `npm run build` / `test` / `lint` / `typecheck` | Run that target across all projects |
| `npm run db:push` | `prisma db push` (sync schema, no migrations in dev) |
| `npm run db:seed` | Seed catalogue + test user |
| `npm run db:studio` | Open Prisma Studio |

## Database

Active DB is **Supabase Postgres** via the Prisma `pg` driver adapter; the schema
is managed with `prisma db push` (no migrations in dev). `DATABASE_URL` lives in
`.env`. The schema also runs on SQLite for offline work — set
`provider = "sqlite"` in `libs/data-access/prisma/schema.prisma` and point
`DATABASE_URL` at a `file:` URL.

## Conventions

- **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, `build:` …).
- **Modular & separation of concerns**: controllers thin, logic in services,
  persistence in `data-access`, contracts in `shared-types`.
- Specialized Claude Code subagents live in [`.claude/agents/`](.claude/agents).

See [ROADMAP.md](ROADMAP.md) for build history.
