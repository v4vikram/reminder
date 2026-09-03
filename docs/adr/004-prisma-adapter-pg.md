# ADR 004: `@prisma/adapter-pg`, `@prisma/adapter-neon` ki jagah

**Status:** Accepted
**Date:** 2026-09-03

## Context

Prisma 7 me SQL databases ke liye **driver adapter mandatory** hai — native Rust engine binary hata diya gaya hai. `PrismaClient` ko ek adapter pass karna padta hai.

Database Neon hai (ADR 002), aur Neon ke liye do adapters available hain:

| Adapter | Underlying driver | Transport |
|---|---|---|
| `@prisma/adapter-pg` | `pg` | Standard TCP |
| `@prisma/adapter-neon` | `@neondatabase/serverless` | WebSocket / HTTP |

## Decision

**`@prisma/adapter-pg`** use karo.

## Alternatives considered

**`@prisma/adapter-neon`** — Neon ka apna serverless driver. Ye tab zaroori hota hai jab runtime pe **TCP sockets available hi na hon** — Vercel Edge Runtime, Cloudflare Workers, ya koi bhi V8-isolate based environment. Wahan `pg` chal hi nahi sakta.

Hamara backend ek **long-running Express process** hai Render/Railway pe (ADR 001). Wahan TCP available hai, aur ek persistent connection pool banake rakhna hi behtar hai — har request pe naya HTTP/WebSocket connection banane se kam overhead.

Matlab `adapter-neon` ka fayda hamare deployment model me milta hi nahi, aur ek extra Neon-specific dependency aa jati.

## Consequences

### Positive
- Standard `pg` driver — Neon-specific nahi. Kal Neon se Railway Postgres ya kisi bhi managed Postgres pe shift karna ho to sirf connection string badalti hai, code nahi.
- Long-running process ke liye connection pooling natural hai
- `pg` sabse mature Node Postgres driver hai — bada ecosystem, zyada documentation

### Negative
- Agar kabhi backend ko edge runtime pe move karna pada (Vercel Edge, Cloudflare Workers), to adapter badalna padega. Abhi aisa koi plan nahi.
- Neon ke pooled connection endpoint ka dhyan rakhna hoga — direct endpoint pe connection limits jaldi hit hoti hain. `.env.example` me pooled string documented hai.
