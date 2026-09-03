# ADR 010: Stateless JWT sessions with Google OAuth

**Status:** Accepted
**Date:** 2026-09-03

## Context

ADR 006 chose Google Sign-In as the only authentication method. This records how
the session that follows it actually works.

## Decisions

**1. `jose` rather than `jsonwebtoken`.**
The project is ESM (`"type": "module"`). `jose` is ESM-native with a promise API;
`jsonwebtoken` is CommonJS and needs interop shims and callback wrapping.
`jsonwebtoken` appears more often in job listings, but that is not a reason to
add friction to the build.

**2. Stateless tokens, no server-side session store.**
One token, signed with `JWT_SECRET`, seven-day expiry. Nothing to look up per
request, so `authenticate` is a constant-cost check with no database round trip.

**3. `POST /auth/logout` does not revoke anything.**
It cannot: a stateless token stays valid until it expires, so logout is the
client discarding it. The endpoint exists so the contract has a place to grow
into once refresh tokens and revocation are added.

**4. The token is returned in the URL fragment, not the query string.**
The callback redirects to `${FRONTEND_URL}/auth/callback#token=...`. Fragments
are never sent to servers, so the token stays out of access logs, proxy logs and
the `Referer` header - all of which a query string would leak into.

**5. OAuth `state` is bound to a cookie.**
`/auth/google` generates a random state, sends it to Google, and stores the same
value in a short-lived httpOnly `SameSite=Lax` cookie. The callback requires the
two to match. Without this, an attacker can complete a flow for *their* account
and hand the victim the callback URL, silently signing the victim into an account
the attacker controls (login CSRF).

**6. Users are keyed on `googleId`, not email.**
Google's `sub` claim is stable; an account's email address can change. Keying on
email would silently create a second user when someone updates their address.

## Alternatives considered

**httpOnly cookie for the session token.** Meaningfully stronger - immune to XSS
token theft. Rejected *for now* because the API contract, the OpenAPI spec and
the tenant guard are all Bearer-based; switching is a coherent change to make in
one piece, not halfway. This is the most likely ADR on this list to be superseded.

**Refresh tokens with rotation.** Correct eventually, unnecessary while there is
one user per gym and no sensitive action beyond editing a member list.

## Consequences

### Positive
- No session store, so nothing to scale or invalidate
- ID tokens are verified against Google's keys via `verifyIdToken`, covering
  signature, issuer, audience and expiry - not hand-rolled
- Unverified Google emails are rejected, so nobody can claim an address they do
  not control

### Negative
- **A leaked token is valid until it expires** and cannot be revoked. Seven days
  is a deliberate compromise; shorten it once refresh tokens exist.
- The token is readable by frontend JavaScript, so an XSS bug becomes an account
  compromise. The cookie alternative above is the fix when it is time.
- `JWT_SECRET` rotation invalidates every session at once. Acceptable at this
  scale, and the env schema enforces a 32-character minimum so the secret is at
  least not guessable.
