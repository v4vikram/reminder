# ADR 002: Neon PostgreSQL, Supabase/Firebase ki jagah

**Status:** Accepted
**Date:** 2026-09-03

## Context

Data relational hai — Gym → Members → Payments/Reminders, saare foreign key relations. Budget zero se shuru ho raha hai (pehle 2-5 gyms, koi revenue nahi). Database ko perpetual free tier chahiye jo 12 mahine baad bill na bheje.

## Decision

**Neon** (serverless PostgreSQL) — sirf database ke liye. Auth alag handle hoga (dekho ADR 006).

## Alternatives considered

**Supabase** — Postgres + built-in auth (phone OTP samet) + storage + RLS, sab ek vendor me. Fastest ship hota. Reject kiya kyunki:
- Free tier project **7 din inactivity ke baad pause** ho jata hai — live customers ke liye risky
- Auth/RLS ka "magic" interview me demonstrate karna mushkil hai; Prisma + apna auth middleware zyada explicit skill dikhata hai

**Firebase / Firestore** — NoSQL. Relations (gym→member→payments) awkward ho jate. Read-based pricing pe scale karte waqt cost surprise hota hai. Reject.

**AWS RDS** — 12-month free tier ke baad cliff. Setup complexity MVP ke liye zyada. Reject.

**PlanetScale** — free tier hata diya, aur foreign key enforcement nahi. Reject.

## Consequences

### Positive
- Pure Postgres — koi vendor-specific abstraction nahi, kabhi bhi kisi bhi Postgres pe migrate ho sakta hai
- Scale-to-zero: near-zero traffic pe cost bhi near-zero
- Prisma + raw SQL knowledge transferable hai (job interviews me directly relevant)
- Branching feature hai — future me per-PR database branch possible

### Negative
- **Auth built-in nahi milta** — Google OAuth khud wire karna padega (ADR 006 me handled)
- **Storage built-in nahi** — jab member photo/ID upload feature aayega, Cloudinary ya S3 alag se add karna padega
- Serverless Postgres pe connection pooling ka dhyan rakhna padta hai — pooled connection string use karni hai, direct nahi
