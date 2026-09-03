# ADR 005: Modular (feature-based) structure, layered ki jagah

**Status:** Accepted
**Date:** 2026-09-03

## Context

Backend ka folder structure decide karna tha. Do standard patterns the.

**Layered (horizontal)** — technical role se organize:
```
src/routes/       src/controllers/     src/services/     src/repositories/
```

**Modular (vertical)** — feature se organize:
```
src/modules/members/{routes,controller,service,repository}.ts
src/modules/payments/...
```

Project ka declared goal hai ki features waqt ke saath badhenge — payments analytics, staff roles, member self-service — aur naya feature add karte waqt purana code touch na karna pade.

## Decision

**Modular structure**, har module ke andar mini-layering:

```
src/
  modules/
    auth/      auth.routes.ts  auth.controller.ts  auth.service.ts
    gyms/      ...
    members/   members.routes.ts  members.controller.ts  members.service.ts
               members.repository.ts  members.validator.ts
    payments/  ...
    reminders/ reminders.service.ts   ← sendReminder() abstraction yahin
    dashboard/ ...
  shared/
    middlewares/  config/  utils/
```

## Alternatives considered

**Layered structure** — chhote apps me samajhna aasan, aur zyada tar Node tutorials yahi sikhate hain. Reject kiya kyunki ek feature ke files 4 alag folders me phail jate hain. "Payment logic kahan hai" ka jawab teen jagah dekhne ke baad milta hai. 19 endpoints aur 6 modules pe ye already dikhne lagta hai.

**NestJS** — ye pattern by default enforce karta hai. Reject kiya kyunki opinionated framework seekhne ka overhead abhi nahi lena; Express + manual discipline se wahi structure milta hai aur Express ka job-market demand zyada hai (ADR 001).

## Consequences

### Positive
- Naya feature = naya folder. Purane modules untouched — regression risk kam.
- `reminders` module ko MVP ke manual `wa.me` se Phase 1 ke WhatsApp Cloud API pe shift karna ek folder ka andar ka change hai.
- Module boundaries testing ko natural banati hain — service layer independently testable.
- Kal koi module microservice banana ho to poora folder utha ke nikal sakte hain.

### Negative
- Chhote MVP ke liye thoda zyada boilerplate — 6 modules × 3-5 files.
- Cross-module logic ka dhyan rakhna padega. Jaise `payments.service` ko `member.nextDueDate` update karni hai — wo `members` module ka data hai. **Rule:** module apna repository expose karega, dusra module usi ke through jayega, direct Prisma call nahi.
- Discipline manual hai — framework enforce nahi karta. Code review me dekhna padega ki business logic controller me na ghus jaye.
