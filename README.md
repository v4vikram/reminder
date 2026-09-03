# Gym Fee Reminder

Fee-reminder tooling for small neighbourhood gyms in India, where fee collection
is still manual: the owner chases each member by phone or in person, and members
who forget simply skip a month.

The owner adds members, the system tracks due dates, and it prepares the reminder
message. The MVP deliberately sends nothing itself - it generates a pre-filled
`wa.me` link the owner taps, which keeps messaging cost at zero until the core
assumption is validated. See [ADR 007](docs/adr/007-manual-whatsapp-mvp.md).

## Status

An incremental build. The core loop works end to end against a real database -
see who is due, send a reminder, record payment, watch the due date advance.
Authentication is still a stub, so this is not yet deployable.

| Area | State |
|---|---|
| Database schema + migration | Done |
| API contract (OpenAPI 3.1) | Done |
| Members module | Done - CRUD, filters, search, soft delete |
| Payments module | Done - transactional record + due-date advance |
| Reminders module | Done - pending queue, wa.me links, send log |
| Tenant isolation | Done - router-level guard, verified |
| Authentication | **Stub** - real Google Sign-In pending |
| Dashboard summary | Not started |
| Frontend (web/) | Not started |

## Stack

- **Backend** - Express 5, TypeScript, modular architecture
- **Database** - PostgreSQL on Neon, Prisma 7 with the `adapter-pg` driver adapter
- **Frontend** - Next.js + shadcn/ui *(not started)*

Every non-obvious choice is recorded in [docs/adr](docs/adr/README.md).

## Documentation

Design work precedes implementation in this project, so the docs are the best
entry point:

| Document | What it covers |
|---|---|
| [requirements.md](docs/requirements.md) | Problem, users, MVP scope, roadmap |
| [architecture.md](docs/architecture.md) | System context, request lifecycle, module layout |
| [schema.md](docs/schema.md) | Data model and the reasoning behind each decision |
| [api-contract.md](docs/api-contract.md) | Conventions, auth flow, tenant isolation |
| [api-spec.yaml](docs/api-spec.yaml) | OpenAPI 3.1 specification |
| [adr/](docs/adr/README.md) | Architecture decision records |

## Running locally

```bash
cd api
npm install
cp .env.example .env      # then fill in DATABASE_URL

npx prisma migrate dev    # create tables
npm run seed              # create a dev owner and gym

npm run dev               # http://localhost:4000
```

| Script | Purpose |
|---|---|
| `npm run dev` | Start with file watching |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | Insert a development owner and gym |

Health checks: `GET /health` (liveness), `GET /health/ready` (database reachable).

## Repository layout

```
api/
  prisma/          schema, migrations, seed
  src/
    modules/       one folder per feature (members, payments, reminders, health)
    shared/        middleware, config, utilities
docs/
  adr/             architecture decision records
```

## A note on the authentication stub

`src/shared/middlewares/authenticate.ts` currently treats the first user in the
database as the caller, so the rest of the API can be exercised before Google
OAuth is configured. It refuses to run when `NODE_ENV=production`, so deploying
it by accident fails loudly instead of letting everyone in.
