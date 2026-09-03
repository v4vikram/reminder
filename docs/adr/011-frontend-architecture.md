# ADR 011: Feature-based frontend with React Query, Zustand and Axios

**Status:** Accepted
**Date:** 2026-09-03
**Supersedes:** the ad-hoc structure introduced with the first frontend commit

## Context

The first version of the frontend was built as route files under `app/` plus a
flat `lib/` holding everything else:

```
lib/types.ts          every type for every feature
lib/format.ts         generic helpers and member-specific ones together
lib/api.ts            a hand-rolled fetch wrapper
lib/use-resource.ts   a hand-rolled data-fetching hook
lib/auth-context.tsx  session state in React Context
```

That is precisely the layered arrangement [ADR 005](005-modular-architecture.md)
rejected for the backend, and for the same reason it fails here: a change to
members touches `app/(app)/members/`, `lib/types.ts` and `lib/format.ts`. The
backend was built feature-first and the frontend was not, with no reason for the
difference beyond inattention.

Three libraries were also skipped. The reasoning at the time was to avoid
dependencies that had not yet earned their place. It did not survive contact
with the code:

- `use-resource.ts` grew to reimplement loading and error states, request
  cancellation and manual reloading - a worse React Query, hand-maintained.
- The race condition it contained (a slow earlier search response overwriting a
  faster later one) is a class of bug React Query does not have.
- Recording a payment ended with `Promise.all([member.reload(), payments.reload()])`
  at the call site. That is cache invalidation, written by hand, in the one place
  most likely to be forgotten when a new screen appears.

This project is also a portfolio artifact. React Query, Zustand and Axios are
common in the roles it is meant to support, so their absence is a cost even
where a hand-rolled alternative would function.

## Decision

**Feature-based structure**, mirroring the backend:

```
features/<name>/
  api.ts         transport only: one function per endpoint
  queries.ts     React Query hooks, cache keys, invalidation
  types.ts       the feature's wire types
  utils.ts       pure display and business helpers
  components/    UI belonging to this feature
app/             thin route files that compose the above
lib/             genuinely shared: axios client, query client, formatters
```

The `api.ts` / `queries.ts` split is the frontend's version of
repository / service: `api.ts` knows how to call an endpoint and nothing else,
`queries.ts` owns caching and invalidation, components own presentation.

**React Query for server state, Zustand for client state.** The line is the
question "who owns this?". The session token is the client's and must survive a
reload, so it lives in a persisted Zustand store. Users, gyms, members and
payments belong to the server and can always be refetched, so they live in
React Query and nowhere else.

**Axios with interceptors.** One request interceptor attaches the bearer token,
one response interceptor unwraps the `{ success, data }` envelope and converts
every failure into a typed `ApiError`. No caller touches `response.data.data`,
and React Query's `error` is always an `ApiError` carrying a usable `code`.

## Alternatives considered

**Keeping `fetch`.** Defensible: the previous wrapper did what the interceptors
do, with no dependency. Rejected because the interceptor split is clearer than a
single function handling both directions, and because Axios is what a reviewer
of this repository will expect to see.

**Keeping React Context for the session.** Also defensible at one piece of state.
Rejected because the moment server state moved to React Query, the Context was
left holding only a token - which is exactly the shape Zustand's persist
middleware handles, without a provider.

**Route-colocated code (`app/members/_components`).** Keeps files near their
route, but ties code to a URL. A `features/` directory survives a route being
renamed or a component being used from two places.

## Consequences

### Positive
- A feature is one folder; adding one does not touch existing features
- Cache invalidation is declared beside the mutation that causes it, so a new
  screen reading that data is correct without remembering to refresh
- Transport, caching and presentation are separable, which makes each testable
- Frontend and backend now share one organising principle, so the same
  explanation covers both

### Negative
- More files for the same behaviour; a four-line feature still gets a folder
- Three dependencies now carry weight that hand-written code did not
- React Query's cache is another place state can be stale, and its keys have to
  stay consistent - handled with a key factory per feature, but it is a rule
  that has to be followed rather than something the compiler enforces
- The rewrite invalidated a working implementation. The cost was accepted
  because the structure was wrong from the first commit rather than having
  drifted, and it would only have grown more expensive to correct.
