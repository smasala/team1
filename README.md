# team1

Fullstack monorepo: **Nx · React (Vite) · NestJS · Prisma**. Local **SQLite** now, swappable to **Supabase/Postgres** with a two-line change.

## Stack & layout

```
apps/
  web/            React + Vite (presentation only)
  api/            NestJS (thin controllers -> services)
libs/
  shared-types/   Wire contracts shared by web + api (defined once)
  data-access/    Prisma client + PrismaService/PrismaModule (sole DB owner)
                  prisma/schema.prisma  + migrations
```

**Dependency direction:** `web -> shared-types`, `api -> shared-types + data-access`. Only `data-access` touches the database.

## Getting started

```bash
npm install            # also runs `prisma generate` (postinstall)
npm run db:migrate     # apply migrations to local SQLite (first run creates dev.db)
npm run dev            # serve api (http://localhost:3000/api) + web (http://localhost:4200)
```

Open the web app — it calls `GET /api/health`, which reads the DB through `data-access` and returns `{ status, db, notes }`.

## Scripts

| Script | Does |
| --- | --- |
| `npm run dev` | Serve api + web together |
| `npm run build` / `test` / `lint` / `typecheck` | Run that target across all projects |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset the local DB |

Nx affected commands work too, e.g. `npx nx affected -t test`.

## Swap SQLite → Supabase (Postgres)

1. `libs/data-access/prisma/schema.prisma`: set `provider = "postgresql"`.
2. `libs/data-access/src/lib/prisma.service.ts`: swap the adapter to `PrismaPg` from `@prisma/adapter-pg` (`npm i @prisma/adapter-pg`).
3. `.env`: point `DATABASE_URL` at your Supabase connection string.
4. `npm run db:migrate`.

No application/business code changes — DB access is isolated in `data-access`.

## Conventions

- **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, `build:` …).
- **Modular & separation of concerns**: controllers stay thin, logic in services, persistence in `data-access`, contracts in `shared-types`.
- Specialized Claude Code subagents live in [`.claude/agents/`](.claude/agents) (fullstack-builder, api-engineer, web-engineer, code-steward).

See [ROADMAP.md](ROADMAP.md) for scaffold status.
