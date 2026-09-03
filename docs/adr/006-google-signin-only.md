# ADR 006: Sirf Google Sign-In, phone OTP defer

**Status:** Accepted
**Date:** 2026-09-03

## Context

Gym owner ko login chahiye. Owner phone se app use karega (laptop nahi) — ye ek hard requirement hai.

Original plan me Google OAuth **aur** phone OTP dono the. India me phone OTP ke liye SMS bhejna padta hai, aur uski real cost hai:

- **DLT registration mandatory** — TRAI ka rule. Business PAN/GST chahiye, approval me din lagte hain.
- SMS gateway (MSG91/2Factor/Twilio) ka per-message charge
- OTP ka apna logic khud likhna: generation, expiry, resend cooldown, rate limiting (OTP bombing se bachna), hashed storage

Ye 1-2 din ka kaam hai, aur MVP me abhi tak koi paying customer nahi hai.

## Decision

MVP me **sirf Google Sign-In**. Phone OTP Phase 1+ me, tab jab koi actual owner bina Google account ke aaye.

## Alternatives considered

**Google OAuth + phone OTP dono** — original plan. Reject: do auth methods = double implementation, account linking ka edge case, aur DLT ka bureaucratic block — sab kuch ek MVP ke liye jiska abhi tak product-market fit prove nahi hua.

**Sirf phone OTP** — local gym owner ke liye sabse natural (phone number hi identity hai). Reject: DLT registration MVP ko hafton block kar deta.

**Clerk / Auth0** — dono methods ready-made. Reject: ek aur vendor, aur auth khud wire karna is project ka ek learning goal hai (ADR 002 me Supabase auth isi wajah se reject hua).

## Consequences

### Positive
- Android phone pe Google account already logged in hota hai — one-tap sign-in, OTP type karne se bhi tez
- Zero messaging cost, zero DLT paperwork
- MVP hafton pehle ship ho sakta hai

### Negative
- **Google Cloud Console pe OAuth consent screen** setup karna padega. App verify hone tak users ko *"This app isn't verified"* warning dikhegi — chhote gym owner ke liye bharosa kam karti hai. Verification me time lagta hai, isliye pehle hi shuru karna hai.
- Jis owner ke paas Google account nahi hai wo login hi nahi kar sakta. Practically rare hai (Android = Google account), par possible hai — us case me manual onboarding karna padega.
- Phone OTP baad me add karte waqt existing Google users ke saath **account linking** handle karna padega. `User` model me `googleId` optional banana pad sakta hai — ek future migration.
