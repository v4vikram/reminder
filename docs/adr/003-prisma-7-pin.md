# ADR 003: Prisma 7.10 pin, `latest` (8.0-rc) ki jagah

**Status:** Accepted
**Date:** 2026-09-03

## Context

Project setup ke waqt `npx prisma@latest` chalaya to pata chala ki npm ka `latest` tag **`8.0.0-rc.12`** pe point kar raha hai — ek release candidate, stable release nahi.

Prisma 8 ka CLI poori tarah alag hai ("Prisma Developer Platform" CLI). Classic commands top-level pe hain hi nahi:

```
$ npx prisma@latest validate
Error: No command registered for `validate`
```

npm dist-tags:
```
latest: 8.0.0-rc.12    ← release candidate
prev:   7.10.0         ← last stable
next:   8.0.0-rc.10
```

Matlab `npm install prisma` chalane se ek RC project me aa jata.

## Decision

**`prisma@^7.10.0`** pin karo — yahi current stable hai. `latest` tag pe bharosa mat karo.

Prisma 7 ke saath ye shape aata hai:
- Generator `prisma-client` (na ki `prisma-client-js`), aur `output` mandatory
- `datasource` block me `url` allowed nahi — `prisma.config.ts` me jata hai
- `.env` automatically load nahi hoti — `import "dotenv/config"` explicitly chahiye

## Alternatives considered

**Prisma 8.0.0-rc** — naya, par RC hai. Production product ka data layer RC pe nahi baithate; breaking changes RC-to-stable ke beech normal hain. Reject.

**Prisma 6.x** — mera original plan yahi tha, aur ye kaam bhi karta (schema 6 pe validate ho gaya tha). Reject kiya kyunki naya greenfield project do major versions peeche shuru karna galat hai — upgrade debt din 1 se.

## Consequences

### Positive
- Stable, supported version
- Prisma 7 ka driver-adapter model (ADR 004) actually behtar hai — chhota bundle, better serverless compatibility
- `prisma.config.ts` typed config hai, schema file me stringly-typed env se behtar

### Negative
- **`npm audit` me 4 high-severity advisories** hain, saare Prisma ki apni dependency tree se (`@prisma/config` → `deepmerge-ts`, `prisma` → `mysql2`). Ye dev-only hain (CLI devDependency hai) aur `mysql2` ka code path Postgres project me kabhi execute nahi hota. Hamara koi fix nahi — Prisma ke deps bump karne ka intezaar.
- Prisma 8 stable aane pe migrate karna padega. Tab tak `latest` tag pe koi bhi `npm install` galti se RC la sakta hai — isliye version pin karna zaroori hai, `^` ke saath bhi 8 nahi aayega.
- Zyada tar online tutorials abhi Prisma 6 ke hain — `url` in schema wala purana pattern dikhega, wo ab kaam nahi karta.
