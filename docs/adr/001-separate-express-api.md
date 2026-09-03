# ADR 001: Alag Express API, Next.js API routes ki jagah

**Status:** Accepted
**Date:** 2026-09-03

## Context

Frontend Next.js (App Router + shadcn/ui) hai. Next.js khud route handlers deta hai — matlab backend usi app me likha ja sakta tha, ek hi repo, ek hi deploy. Alag Express service rakhna technically redundant hai.

Do goals is project pe ek saath chal rahe hain:
1. Ek real product jo gym owners use karein
2. Ek portfolio/interview artifact (6–10 LPA backend/full-stack roles)

Dono goals is decision ko alag-alag directions me kheenchte hain — isliye ye explicitly record karna zaroori hai.

## Decision

Backend ek **alag Express + TypeScript service** hoga. Next.js sirf frontend rahega aur HTTP se is API ko call karega.

## Alternatives considered

**Next.js route handlers (`app/api/...`)**
Ek repo, ek deploy, koi CORS nahi, koi auth token passing nahi — MVP ke liye seedha tez. Reject isliye kiya kyunki:
- OpenAPI contract, API versioning (`/api/v1`), aur modular service layer — ye teeno tab meaningful hote hain jab API ek independent surface ho. Next.js ke andar ye zyada tar ceremony ban jate.
- Express Indian job postings me sabse commonly asked backend skill hai. Ye project ka ek declared goal hai.

**Next.js frontend + serverless functions (alag)**
Bich ka raasta, par cold starts aur cron scheduling (Phase 1 ka auto-reminder) serverless pe zyada complex hain.

## Consequences

### Positive
- API ek real, independently testable surface hai — OpenAPI spec sirf documentation nahi, actual contract hai
- Frontend aur backend alag scale/deploy ho sakte hain
- Phase 1 ka cron ek long-running process me natural baithta hai
- Backend ko kal koi aur client (mobile app) bhi use kar sakta hai

### Negative
- **Do deployments** — Vercel (web) + Render/Railway (api). Zyada moving parts.
- CORS configure karna padega
- Auth token frontend se backend tak explicitly carry karna hoga (Next.js me ye implicit hota)
- Render free tier pe backend 15 min inactivity ke baad sota hai — pehli request pe ~30-50s cold start. Owner ko lagega app hang hai. Paid tier ya keep-alive ping se solve hoga.
- Local development me do process chalane padenge
