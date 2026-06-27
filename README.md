# FeldPro

AI-driven **offer & invoice manager for field tradesmen** — browse a priced trade
catalogue, build offers and invoices, or just describe the job and let the
assistant draft a quote. Multi-tenant (per-organisation), bilingual (German /
English), with a Gemini-backed assistant.

Stack: **Nx · React (Vite) · NestJS · Prisma · Supabase (Postgres) · Gemini**.

## Layout

```
apps/
  web/            React + Vite — mobile-first "field instrument" UI
    src/app/
      api/        typed API client
      auth/       auth context (Supabase session)
      i18n/       German/English dictionaries + t() context (German default)
      components/ shell, line editor, document view, UI primitives
      pages/      login, catalogue, offers, invoices, assistant, team, account
  api/            NestJS — thin controllers -> services
    src/app/
      auth/       Supabase JWT guard, auth context (@CurrentUser/@CurrentOrg), roles guard, dev-login
      catalogue/  Category / Subcategory / Item CRUD (org-scoped)
      offers/     offer CRUD (priced line items, totals)
      invoices/   invoice CRUD + generate-from-offer
      ai/         natural-language -> structured offer draft (Gemini, local fallback)
      team/        organisation member CRUD (admin-gated)
      common/     line-item resolver, totals, exception filter
libs/
  shared-types/   wire contracts shared by web + api (defined once)
  data-access/    Prisma client + PrismaService (sole DB owner)
```

**Dependency direction:** `web -> shared-types`, `api -> shared-types + data-access`.
Only `data-access` touches the database.

**Multi-tenancy:** every `User`, `Offer`, `Invoice` and `Category` belongs to an
`Organisation`. All business APIs are scoped to the caller's `organisationId`,
resolved once by the JWT guard (from token claims, with a DB fallback) and read
in handlers via `@CurrentUser()` / `@CurrentOrg()` — ids are never threaded
through manually. `User.role` (`ADMIN` | `EMPLOYEE`) gates team management.

## Getting started

```bash
npm install            # also runs `prisma generate` (postinstall)
npm run db:push        # sync the schema to Supabase Postgres
npm run db:seed        # seed the demo org, its test user, and the catalogue (+30% markup)
npm run dev            # api (http://localhost:3000/api) + web (http://localhost:4200)
```

The UI defaults to **German**; switch to English on the account page. Open the
web app and tap **Test-Arbeitsbereich öffnen** / **Open test workspace** to sign
in as the seeded test user, then try the assistant: *"Angebot für 100m²
Hausabbruch"*. Configure `GEMINI_API_KEY` for the Gemini drafter and
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` for real email/password sign-in
(see `.env.example`).

## How it works

- **Catalogue** is seeded from `scripts/baupreise-catalogue.json` (2,869 German
  trade items). A strict **+30% markup** is applied: `Item.basePrice` keeps the
  raw baseline, `Item.price` is the sell price (`round(base × 1.30, 2)`).
- **Offers & invoices** store priced *snapshot* line items, so historical
  documents never shift when the catalogue changes. An accepted offer can be
  turned into an invoice in one tap. Both are shared across the organisation's
  team.
- **AI assistant** sends the natural-language request to **Gemini**
  (non-deterministic) to segment it into line items, then matches each against
  the org's catalogue to draft a structured, priced offer. With no
  `GEMINI_API_KEY` it falls back to a deterministic local parser, so it works
  offline and in tests. Prices always come from the catalogue, never the model.
- **Multi-tenancy & team** — data is scoped per `Organisation`; admins manage
  members (employees/admins) on the team page.
- **i18n** — the whole UI is localised via a `t()` context; German is the
  default, English is a one-tap switch (persisted to `localStorage`).
- **Auth** uses Supabase email/password sign-in. The access token (a
  Supabase-shaped HS256 JWT verified with `SUPABASE_JWT_SECRET`) carries
  `organisation_id` / `app_role` claims; the guard resolves the caller's
  org + role from the token (or provisions from the `User` table on first sign-in).
  A dev-login endpoint mints a token for the seeded test user when Supabase
  client auth isn't configured (see `.env.example`).

## Scripts

| Script | Does |
| --- | --- |
| `npm run dev` | Serve api + web together |
| `npm run build` / `test` / `lint` / `typecheck` | Run that target across all projects |
| `npm run db:push` | `prisma db push` (sync schema, no migrations in dev) |
| `npm run db:seed` | Seed demo org, its test user, and the catalogue |
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
