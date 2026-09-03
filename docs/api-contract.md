# API Contract

**Status:** Round 1 — MVP
**Machine-readable spec:** [`api-spec.yaml`](./api-spec.yaml) (OpenAPI 3.1)
**Base path:** `/api/v1`

Ye doc **kyun** batata hai. **Kya** (exact request/response shapes) `api-spec.yaml` me hai.

---

## 1. Conventions

### 1.1 Versioned base path — `/api/v1`

Din 1 se version prefix. Baad me breaking change karni pade to `/api/v2` saath-saath chal sakta hai aur purane clients tootenge nahi. Baad me add karna mehnga hai — har URL, har client badalna padta.

### 1.2 Response envelope

Har response ek hi shape me:

```jsonc
// Success
{ "success": true, "data": { ... } }

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Phone number invalid hai",
    "details": [{ "field": "phone", "message": "E.164 format expected" }]
  }
}
```

**Kyun envelope:** Frontend ka error handling ek hi jagah likha jata hai — har endpoint ke liye alag parsing nahi. Naked responses me client ko har call pe guess karna padta hai ki success kaisa dikhta hai.

**Trade-off:** Ek extra nesting level (`res.data.data`). Accepted — consistency zyada valuable hai.

### 1.3 Error codes

| Code | HTTP | Kab |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Body/params invalid — `details[]` me field-wise |
| `UNAUTHORIZED` | 401 | Token missing ya invalid |
| `FORBIDDEN` | 403 | Token valid hai, par ye resource tumhara nahi |
| `NOT_FOUND` | 404 | Resource exist nahi karta |
| `CONFLICT` | 409 | Duplicate — jaise same phone dobara add karna |
| `INTERNAL_ERROR` | 500 | Unexpected. Client ko stack trace kabhi nahi jata |

**401 vs 403 ka farq:** 401 = "tum kaun ho pata nahi" (dobara login karo). 403 = "pata hai tum kaun ho, par ye cheez tumhari nahi" (login karne se kuch nahi hoga). Clients inhe alag handle karte hain — 401 pe login screen, 403 pe error message.

### 1.4 Pagination

Sab list endpoints pe:

```jsonc
{ "items": [...], "page": 1, "limit": 20, "total": 143, "hasNext": true }
```

Offset-based (cursor nahi) — kyunki gym ke members 250 tak hi hain aur owner ko page numbers chahiye. Cursor pagination is scale pe unnecessary complexity hai.

### 1.5 Auth

`Authorization: Bearer <JWT>` har request pe (sirf `/auth/*` ko chhod ke).

---

## 2. Tenant isolation — sabse important rule

Har gym-scoped route `/gyms/:gymId/...` pattern follow karta hai. Ek **middleware** verify karta hai ki logged-in user us `gymId` ka owner hai. Fail hone pe 403.

```
Request → authenticate (JWT valid?) → tenantGuard (ye gym tumhara hai?) → controller
```

**Kyun URL me `gymId` (token se implicit lene ki jagah):**

1. **Resource hierarchy honest rehti hai** — URL se saaf hai ki member kis gym ka hai. Implicit hone pe `/members` ka matlab context pe depend karta.
2. **Phase 4 (multi-gym owners) bina API change ke aata hai** — owner ke paas 3 gyms hue to wahi URLs kaam karte hain. Implicit design me "current gym" ka concept banana padta (session state, gym switcher endpoint) — client aur server dono me.
3. **Har endpoint pe isolation check force hota hai** — naya route likhte waqt `gymId` param hai to guard lagana bhoolna mushkil hai. Implicit design me bhoolna aasan hai, aur wo bug **dusre tenant ka data leak** karta hai.

**Rule:** Controller me kabhi manually ownership check mat likho. Middleware ka kaam hai. Do jagah check hone se ek jagah update hona reh jata hai.

---

## 3. Modules

| Module | Zimmedari |
|---|---|
| `auth` | Google OAuth, JWT issue, current user |
| `gyms` | Onboarding, settings/plan |
| `members` | Member CRUD, due-status derivation |
| `payments` | Payment record + due date advance (transactional) |
| `reminders` | Pending list + wa.me link generation + send logging |
| `dashboard` | Summary counts |

Har module apna `routes / controller / service / validator` rakhta hai. Business logic **service** me — controller sirf request parse karke service call karta hai aur response format karta hai.

---

## 4. Key flows

### 4.1 First login → onboarding

```
GET  /auth/google                 → Google consent
GET  /auth/google/callback        → user find-or-create, JWT issue
GET  /auth/me                     → { user, gyms: [] }
                                     gyms khali → onboarding screen dikhao
POST /gyms                        → gym ban gaya
```

### 4.2 Member add karna

```
POST /gyms/:gymId/members
  { name, phone, feeAmount, joinDate }
```

`phone` server pe E.164 me normalize hota hai (`98765 43210` → `919876543210`). `nextDueDate` na do to `joinDate + 1 month`.

Same gym me same phone dobara → **409 CONFLICT**.

### 4.3 Dashboard

```
GET /gyms/:gymId/dashboard/summary    → counts
GET /gyms/:gymId/members?dueFilter=overdue
```

`dueStatus` har member pe server compute karke bhejta hai (`overdue` / `due_soon` / `upcoming`) — client date math nahi karta. Timezone bugs ek hi jagah handle hote hain.

### 4.4 Reminder bhejna — MVP ka core

```
GET  /gyms/:gymId/reminders/pending
     → [{ member, messageText, waLink, lastRemindedAt }]

     owner waLink tap karta hai → WhatsApp khulta hai, message pre-filled
     owner send dabata hai

POST /gyms/:gymId/members/:memberId/reminders
     { channel: "WHATSAPP_MANUAL", status: "SENT", messageText }
```

**Server hi `messageText` aur `waLink` banata hai, client nahi.** Kyunki:
- Template ek jagah rehta hai — badalna ek deploy, saare clients pe asar
- Phone normalization aur URL encoding server-side, har jagah repeat nahi
- Phase 1 me cron **wahi endpoint** call karega, `waLink` ignore karke API se bhejega — template logic reuse hota hai

`lastRemindedAt` isliye bheja jata hai taaki owner dekh sake kise abhi-abhi reminder gaya — same din do baar bhejne se bacha ja sake.

### 4.5 Payment mark karna

```
POST /gyms/:gymId/members/:memberId/payments
     { amount?, paidAt?, method? }
     → { payment, member }   ← member nayi nextDueDate ke saath
```

**Ek transaction me do cheezein:** Payment row insert + `member.nextDueDate` ek cycle aage. Dono ya koi nahi.

Beech me fail hua to — ya paisa liya par member due dikhta rahega (owner phir reminder bhejega), ya due date badhi par revenue record nahi bana. Isliye ye logic **sirf** `payments.service.ts` me hai, Prisma `$transaction` ke andar. Detail: [`schema.md` §4](./schema.md).

Response me updated `member` isliye wapas jata hai ki client ko turant refetch na karna pade.

---

## 5. Phase 1 me kya badlega

Automation add karte waqt **API contract me zero breaking change**:

| | MVP | Phase 1 |
|---|---|---|
| `GET /reminders/pending` | Owner ka UI consume karta hai | Cron consume karta hai |
| `POST /.../reminders` | `channel: WHATSAPP_MANUAL` | `channel: WHATSAPP_API` |
| Endpoints | — | **Same** |
| Naya | — | Sirf ek internal cron trigger |

Ye is design ka asli test hai: automation ek naya code path hai, naya contract nahi.

---

## 6. Abhi jaan-boojh kar nahi

| Cheez | Kyun / Kab |
|---|---|
| Refresh tokens | MVP me long-lived JWT. Session management Phase 1. |
| Rate limiting | Traffic aane pe. Abhi 2-5 gyms. |
| Bulk member import (CSV) | Onboarding friction dikhne pe — Phase 2. |
| Webhooks | Koi consumer nahi hai abhi. |
| `PUT` endpoints | Sirf `PATCH` — partial updates hi chahiye. |

---

## 7. Verification

```bash
npx @redocly/cli lint docs/api-spec.yaml
```

Ya spec ko [editor.swagger.io](https://editor.swagger.io) pe paste karke check karo.

**Status:** Spec valid hai ✅ — 4 warnings bache hain, teeno triage ho chuke hain:

| Warning | Kyun accept kiya |
|---|---|
| `no-server-example.com` (×1) | Abhi sirf `localhost` server listed hai kyunki API deploy nahi hui. Production URL deploy ke time add hoga. |
| `operation-2xx-response` (×2) | `/auth/google` aur `/auth/google/callback` design se **302 redirect** karte hain — OAuth flow browser redirect pe chalta hai, 2xx return karna galat hota. |
| `operation-4xx-response` (×1) | `/auth/google` sirf Google pe redirect karta hai, koi client error condition hai hi nahi. |

Warnings ignore nahi kiye — dekhe, samjhe, aur ye teeno genuinely is API pe lagu nahi hote. Baaki 20 warnings fix kiye gaye (19 missing `operationId`, 1 missing license).

**`operationId` kyun zaroori hai:** codegen tools (openapi-typescript, orval) inhi se client method names banate hain. Missing ho to auto-generated names milte hain jaise `getGymsGymIdMembers` — isliye har operation pe explicit, readable id set kiya hai (`listMembers`, `recordPayment`, `logReminder`).
