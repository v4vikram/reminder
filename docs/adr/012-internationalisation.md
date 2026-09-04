# ADR 012: Two languages, two audiences

**Status:** Accepted
**Date:** 2026-09-04

## Context

The interface was written in Hinglish throughout, on the assumption that owner
and member wanted the same thing. They do not:

- The **owner** reads the app. Some prefer English.
- The **member** reads a WhatsApp message. Gym-goers at a neighbourhood gym are
  generally better served in Hinglish, whatever the owner prefers.

Treating these as one setting would mean an owner switching the app to English
silently changes what every one of their members receives - a change to other
people's experience, made as a side effect of a personal display preference.

## Decisions

**1. Two independent settings.**

| | Owner interface | Reminder message |
|---|---|---|
| Who reads it | The owner | Their members |
| Stored | `localStorage`, per device | `Gym.messageLanguage` |
| Mechanism | next-intl message bundles | Server-side template function |

The interface language is a display preference: no schema column, no API
round-trip, no migration. The cost is that a new device starts at the default.
The message language belongs to the gym, so it is server state.

**2. next-intl, without locale routing.**

The usual App Router setup puts the locale in the URL (`/en/dashboard`) and
resolves it in middleware. This app is client-rendered and sits behind auth, so
there is no SEO to serve and no server render to localise - the locale comes
from the store and is passed to the provider directly.

next-intl earns its place on more than string lookup: month counts were
`count === 1 ? "month" : "months"` ternaries scattered across five components,
which ICU plural rules now handle in the message itself.

**3. The reminder copy stays out of the message bundles.**

Those bundles ship to the browser and are chosen per device. The reminder text
is produced on the server precisely so that Phase 1's cron sends the same
wording as the manual flow (ADR 007). Putting it in next-intl would tie the
message a member receives to the device the owner happens to be holding.

**4. Locale tags `en` and `hi-Latn`.**

`hi-Latn` is Hindi in Latin script, which is what "Hinglish" means. There is no
standard code for Hinglish, and inventing one would break any tooling that
expects BCP-47.

## Alternatives considered

**react-i18next.** Works, framework-agnostic, common in job listings. Heavier
setup for no gain here, and next-intl is the App Router default.

**A hand-rolled dictionary and hook.** Tempting at 64 strings, and genuinely
viable - unlike the React Query case (ADR 011) there is no caching or race
handling hiding in the problem. Rejected on pluralisation and number formatting,
which are exactly the parts that are fiddly to get right by hand.

**One setting for both audiences.** Simpler, and wrong for the reason above.

## Consequences

### Positive
- An owner can read the app in English while members still get Hinglish
- Plural forms live in the message, not in five separate ternaries
- Both bundles ship in the client, so switching is instant with no network call
- Adding a third language is two JSON files and one array entry

### Negative
- Every user-visible string is now indirect: a wrong key renders the key itself
  rather than failing the build. Key parity between bundles is checked by hand
  today; it should be a test.
- The interface language does not follow the owner to a new device.
- Reminder copy lives in two places by design - the bundles for the app, a
  server template for the message - so a wording change to one does not update
  the other. That separation is deliberate, but it is a thing to remember.
