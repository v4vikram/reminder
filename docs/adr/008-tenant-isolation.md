# ADR 008: `gymId` URL me + tenant guard middleware

**Status:** Accepted
**Date:** 2026-09-03

## Context

Multi-tenant system hai — har gym ka data dusre gym se isolated rehna chahiye. Ye is application ka **sabse critical security boundary** hai: ek bug yahan matlab ek gym owner dusre gym ke members dekh le.

Do design options the:

1. **Implicit** — `gymId` JWT me, URLs `/api/v1/members` jaise
2. **Explicit** — `gymId` URL me, `/api/v1/gyms/:gymId/members`

## Decision

**Explicit** — har tenant-scoped route `/gyms/:gymId/...` pattern follow karega, aur ek **`tenantGuard` middleware** verify karega ki authenticated user us gym ka owner hai.

```
Request → authenticate (JWT valid?) → tenantGuard (ye gym tumhara hai?) → controller
```

**Rule:** Controller me kabhi manually ownership check nahi likhna. Middleware ka kaam hai.

## Alternatives considered

**Implicit `gymId` (JWT se)** — URLs chhote, aur "galti se dusre gym ki id daal di" wala case hi nahi banta. Reject kiya kyunki:
- Naya endpoint likhte waqt isolation check lagana **bhoolna aasan** hai, aur wo bug silent hota hai — cross-tenant data leak
- Phase 4 (ek owner ke multiple gyms) me "current gym" ka concept banana padta — session state, gym switcher endpoint, client-side context. Explicit design me wahi URLs bina badle kaam karte hain.

**Prisma middleware / Postgres RLS se automatic scoping** — database level pe enforce hota, sabse strong. Reject **abhi ke liye**: Prisma 7 ke driver-adapter model me RLS ke liye per-request session variables set karne padte, jo connection pooling ke saath complexity laata hai. Future me reconsider kar sakte hain — tab ye ADR supersede hoga.

## Consequences

### Positive
- Naya route likhte waqt `:gymId` param dikhta hai — guard lagana bhoolna mushkil
- Resource hierarchy URL me honest hai
- Phase 4 (multi-gym owner) bina API change ke aata hai
- Ek jagah check, ek jagah audit — security review aasan

### Negative
- URLs lambe hain
- Frontend ko har call me `gymId` pass karna padta hai
- **Defence in depth nahi hai** — agar koi route guard lagana bhool gaya, to koi second layer nahi rokega. Database level pe RLS hota to wo backup hota. Mitigation: har `/gyms/:gymId/*` route pe guard router level pe lagega, per-route nahi — matlab default secure hai, opt-out explicit.
- Guard ek extra DB query karta hai (gym ownership check) har request pe. Chhota hai (`@@index([ownerId])`), par hai. Zaroorat pade to JWT me gym ids cache kar sakte hain.
