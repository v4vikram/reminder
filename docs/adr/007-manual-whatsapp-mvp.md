# ADR 007: MVP me manual `wa.me`, WhatsApp Cloud API defer

**Status:** Accepted
**Date:** 2026-09-03

## Context

Product ka core hi ye hai ki fee reminder automatically jaye. Toh MVP me automation **na** karna counter-intuitive lagta hai. Ye decision explicitly justify karna zaroori hai.

WhatsApp Cloud API ki real cost (India, utility category):
- ~₹0.12–0.20 per message
- Meta Business verification chahiye (docs, review time)
- Template approval process
- Dedicated phone number

Ek 120-member gym pe ~₹36-50/month messages. 2 gyms ka pilot ~₹85-150/month — cost problem nahi hai.

**Asli problem alag hai:** abhi tak ye validate nahi hua ki reminder aane se member actually jaldi pay karta hai. Ek gym owner ne bola "aisa kuch dhoondh raha tha", par wo ek statement hai, evidence nahi. Verification/template setup pe hafta lagakar automation banane se pehle wo assumption test hona chahiye.

## Decision

MVP me server **`wa.me` deep link + pre-filled message text** generate karega. Owner tap karke apne hi WhatsApp se bhejega.

Har bheja gaya reminder phir bhi `reminders` table me log hoga, `channel = WHATSAPP_MANUAL` ke saath.

## Alternatives considered

**WhatsApp Cloud API din 1 se** — actual product vision. Reject: Meta verification + template approval MVP ko hafton block karta, aur wo investment ek untested assumption pe hota.

**`whatsapp-web.js` / Baileys (unofficial)** — free, automation bhi milta. **Reject:** Meta ToS violation, number ban hone ka real risk. Owner ka business number ban ho gaya to hum unhe nuksan pahuncha denge. Ye line cross nahi karni.

**SMS** — DLT registration ka wahi block jo ADR 006 me hai. Reject.

**Telegram bot** — free aur automatic. Reject member-facing ke liye: ₹400-gym ka member base WhatsApp pe hai, Telegram pe nahi, aur bot ko user khud "Start" karta hai — jo aadmi fees bhool jata hai wo bot start nahi karega. (Owner-facing alerts ke liye future me consider ho sakta hai.)

## Consequences

### Positive
- **Zero messaging cost** — pilot poore free-tier pe chalta hai
- Meta verification/template approval MVP ko block nahi karta
- Message owner ke apne number se jata hai — member ko pehchana hua number dikhta hai, unknown business number se zyada bharosa
- Assumption test ho jata hai automation me invest karne se **pehle**

### Negative
- **Automatic nahi hai** — owner ko roz app kholna padega. Ye product ka core promise abhi adhoora hai. Isliye ye MVP hai, final product nahi.
- Owner ke device pe WhatsApp hona zaroori hai
- Scale nahi karta — 200 members pe 200 taps. Yahi wo pain hai jo Phase 1 ko justify karega (aur owner ko paid tier lene ka reason dega).
- `messageText` client-side edit ho sakta hai bhejne se pehle — log me wahi text jayega jo server ne banaya, wo nahi jo actually gaya. Accepted limitation.

## Phase 1 me kya badlega

Sirf `reminders.service.ts` ke andar ka code. Schema, API contract, baaki modules — untouched:

| | MVP | Phase 1 |
|---|---|---|
| Trigger | Owner tap | Cron |
| Send | Owner ka WhatsApp | Cloud API |
| `channel` | `WHATSAPP_MANUAL` | `WHATSAPP_API` |
| Schema/API change | — | **zero** |
