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

## Conventions (apply throughout)
- Conventional Commits (`feat:`, `chore:`, `docs:`, `build:`...).
- Modular: apps thin, logic in libs; one responsibility per module.
- Separation of concerns: controller -> service -> data-access; shared contracts in `libs/shared-types`.
- DB is env-swappable: only `DATABASE_URL` + Prisma `provider` change for Supabase.
