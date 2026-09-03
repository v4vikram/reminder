# ADR 009: Single repository for frontend and backend

**Status:** Accepted
**Date:** 2026-09-03

## Context

The product has two deployable pieces: a Next.js frontend and an Express API
(ADR 001). They can live in one repository or two.

## Decision

**One repository**, with `api/` and `web/` as plain sibling directories. No
monorepo tooling (Turborepo, Nx, npm workspaces).

## Alternatives considered

**Two repositories.** Useful when the two sides have different owners, different
release cadences, or need separate access control. None of that applies here:
one developer, and every new API endpoint exists precisely because some screen
needs it - the two sides move together.

**Monorepo tooling (Turborepo / Nx).** Solves cross-package build orchestration
and caching. With two independent apps and no shared packages there is nothing
to orchestrate, so it would be configuration without benefit. Revisit if a
shared `packages/types` is ever extracted from the OpenAPI spec.

## Consequences

### Positive
- A change to the API contract and its frontend consumer land in one commit,
  so the two can never be reviewed or reverted separately
- One repository to clone, one place to read - and one link to share, which
  matters for a portfolio project
- Deployment is unaffected: Vercel and Render both take a root directory
  setting, so `web/` and `api/` deploy independently from the same repository

### Negative
- CI will need path filtering, otherwise editing `docs/` runs the backend test
  suite. Not yet configured - there is no CI at all yet.
- The repository root has no single `package.json`, so commands must be run from
  `api/` or `web/`. Acceptable; a root-level script runner can be added later.
- Everyone with repository access sees both sides. Fine now, and if it ever
  stops being fine, splitting a monorepo (`git filter-repo`) is far easier than
  merging two repositories with independent histories - which is the main
  reason this is the low-regret direction.
