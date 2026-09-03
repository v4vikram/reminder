# Architecture Decision Records

Har ADR ek decision record karta hai — **kya** decide kiya, **kyun**, kaunse **alternatives** the, aur uske **consequences** (achhe aur bure dono).

## Format kyun

Code batata hai *kya* ho raha hai. ADR batata hai *kyun* — aur wo information code se recover nahi hoti. 6 mahine baad jab yaad na ho ki Express kyun liya jabki Next.js API routes de sakta tha, ADR wahi gap bharta hai.

Har ADR immutable hai. Decision badle to purana ADR `Superseded` mark karke naya likhte hain — history mitate nahi. Galat decisions bhi record rehte hain, kyunki "ye try kiya tha aur kyun nahi chala" bhi valuable hai.

## Index

| # | Decision | Status |
|---|---|---|
| [001](001-separate-express-api.md) | Alag Express API, Next.js API routes ki jagah | Accepted |
| [002](002-neon-postgres.md) | Neon PostgreSQL, Supabase/Firebase ki jagah | Accepted |
| [003](003-prisma-7-pin.md) | Prisma 7.10 pin, `latest` (8.0-rc) ki jagah | Accepted |
| [004](004-prisma-adapter-pg.md) | `@prisma/adapter-pg`, `adapter-neon` ki jagah | Accepted |
| [005](005-modular-architecture.md) | Modular (feature-based) structure, layered ki jagah | Accepted |
| [006](006-google-signin-only.md) | Sirf Google Sign-In, phone OTP defer | Accepted |
| [007](007-manual-whatsapp-mvp.md) | MVP me manual `wa.me`, WhatsApp Cloud API defer | Accepted |
| [008](008-tenant-isolation.md) | `gymId` URL me + tenant guard middleware | Accepted |
| [009](009-monorepo.md) | Frontend aur backend ek hi repo me | Accepted |
| [010](010-stateless-jwt-sessions.md) | Stateless JWT sessions, Google OAuth ke saath | Accepted |

## Template

```markdown
# ADR NNN: <title>

**Status:** Proposed | Accepted | Superseded by ADR-XXX
**Date:** YYYY-MM-DD

## Context
Kaunsi problem/forces hain.

## Decision
Kya decide kiya.

## Alternatives considered
Kya aur socha, kyun reject kiya.

## Consequences
### Positive
### Negative
```
