# Scaffold Roadmap — Single Phase

> Crash/token-limit recovery: resume at the first unchecked item. Each item is idempotent or safe to re-run after inspecting state.

## Phase 0 — Bootstrap
- [x] R0.1 Verify toolchain (node/npm/git) — DONE in session
- [x] R0.2 Write this ROADMAP.md
- [x] R0.3 Create Claude Code subagents in `.claude/agents/` (lean, fast iteration)

## Phase 1 — Nx Monorepo
- [x] R1.1 Create Nx integrated workspace (npm, no Nx Cloud) into repo root
- [x] R1.2 Add `@nx/nest` plugin + generate `apps/api` (NestJS)
- [x] R1.3 Add `@nx/react` plugin + generate `apps/web` (React + Vite)
- [x] R1.4 Generate shared libs: `libs/shared-types`, `libs/data-access`

## Phase 2 — Database (Prisma, SQLite now / Supabase later)
- [x] R2.1 Install Prisma; init schema with SQLite provider via `DATABASE_URL`
- [x] R2.2 Add a sample model (Note) + first migration
- [x] R2.3 Wrap PrismaClient in `libs/data-access` (PrismaService, module)
- [x] R2.4 Document the SQLite -> Supabase swap (env-only switch)

## Phase 3 — Wire-up (separation of concerns)
- [x] R3.1 NestJS: PrismaModule + a feature module (e.g. `health`) using a service/controller
- [x] R3.2 React: minimal page hitting the API `/health`
- [x] R3.3 Root scripts / `.env` / `.env.example` / `.gitignore`

## Phase 4 — Docs & Knowledge Graph
- [x] R4.1 Lean README.md (run, structure, swap DB)
- [x] R4.2 Run graphify over the scaffolded repo (graphify-out/, gitignored)

## Phase 5 — Ship
- [x] R5.1 Conventional-commit the scaffold
- [x] R5.2 Push to origin

## Phase 6 — FeldPro application (built on the scaffold)
- [x] A1 DB schema (User, Category, Subcategory, Item, Offer, Invoice) + 30% markup seed
- [x] A2 Backend core: Supabase JWT guard, global exception filter, validation
- [x] A3 CRUD APIs: catalogue, offers, invoices (+ generate-from-offer)
- [x] A4 AI offer drafter: natural language → matched catalogue line items
- [x] A5 React mobile-first shell + "field instrument" theme
- [x] A6 Feature views: auth, catalogue CRUD, offer/invoice flows, AI chat
- [x] A7 Switch dev DB to Supabase Postgres (`prisma db push`, no migrations)

## Phase 7 — Multi-tenancy, auth, AI & i18n
- [x] B1 Organisation model; org + role on User; organisationId on Offer/Invoice/Category (multi-tenancy)
- [x] B2 JWT auth context: org_id/app_role claims, guard resolves user+org+role, `@CurrentUser`/`@CurrentOrg`/`@Roles`
- [x] B3 Org-scope all business APIs (offers, invoices, catalogue, AI matching)
- [x] B4 Server-side Supabase email/password login; resolves the app user by `User.authId` (decoupled from `User.id`)
- [x] B5 Gemini-backed (non-deterministic) offer drafting (Gemini required; no local fallback)
- [x] B6 Team member CRUD + UI (employees/admins), admin-gated
- [x] B7 i18n across the whole app (German default, English switch)
- [x] B8 Rebuild graphify graph; commit + push

## Conventions (apply throughout)
- Conventional Commits (`feat:`, `chore:`, `docs:`, `build:`...).
- Modular: apps thin, logic in libs; one responsibility per module.
- Separation of concerns: controller -> service -> data-access; shared contracts in `libs/shared-types`.
- DB is env-swappable: only `DATABASE_URL` + Prisma `provider` change for Supabase.
