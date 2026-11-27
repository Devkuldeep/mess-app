# 04. Architecture aur tech decisions: "kis tech se, kis structure mein?"

## 📖 Kahani
Vikram (Tech Lead) ne ek **design review** meeting rakhi. Board par teen sawal the:

| Sawal | Option A | Option B | Faisla |
|---|---|---|---|
| App kaisa ho? | Native Android + iOS | **PWA + Play Store TWA** | PWA. Ek codebase, customer ko install nahi karna padta, aur link se chal jaata hai (D2) |
| Backend kaisa? | Microservices | **Modular monolith** (Next.js + Postgres) | Monolith. Team 3 log ki hai, aur microservices ka bojh nahi uthaya ja sakta |
| Tenant data kaise alag ho? | Har mess ka alag DB | **Ek DB, har row mein `orgId`** | Shared schema. Sasta hai aur 1,000 messes tak aasaan. Isolation code mein + composite FKs (D1) |

Tum ne poocha: "Microservices to modern hain na?"
Vikram: "Modern hona maqsad nahi hai. Maqsad hai ki 3 log jaldi aur safely bana sakein. Jab tak team aur load ek service ko alag karne ki **zaroorat** na banaye, tab tak ek hi deployable rakhenge. **Boring technology** jeet-ti hai."

Har faisla ek **ADR** (Architecture Decision Record) mein gaya, taaki 6 mahine baad koi poochhe "ye kyun kiya?" to jawab likha mile. Is repo mein ye [../roadmap.md](../roadmap.md) ka decision log hai: D1 se D23.

## 🏢 Industry mein kaise hota hai

### 1. Architecture kahan se aata hai?
**NFRs + constraints → architecture.** Constraints hain budget, team size, deadline aur skills. Is app ke drivers:
- **Offline** → outbox + sync API
- **Sasta** → ek DB, kam vendors
- **Multi-tenant** → `orgId` har jagah
- **Hindi** → i18n system shuru se
- **Chhoti team** → monolith

### 2. C4 model: architecture ko 4 zoom levels mein dikhana
```
Level 1 Context:   [Owner/Staff] ──► (Mess Manager) ◄── [Customer link]
                                   │      │
                       Google Drive ┘      └ WhatsApp/SMS (aage), Razorpay (aage)

Level 2 Containers:
  Browser/PWA (React, Service Worker, IndexedDB outbox)
        │ HTTPS (RSC, Server Actions, /api/sync JSON)
  Next.js server (App Router, Server Actions, Route Handlers, cron routes)
        │ Prisma (pg adapter)
  PostgreSQL (Neon / Docker)

Level 3 Components (server ke andar):
  proxy.ts (auth gate) → pages (RSC) → src/server (auth, data, mutations, export, drive-backup)
                                      → src/lib (pure: dates, schedule/billing, sync, validation, i18n)
Level 4 Code: classes/functions (zaroorat ho to)
```

### 3. Monolith vs microservices
| | Modular monolith | Microservices |
|---|---|---|
| Deploy | Ek | Kai, sab alag |
| Team size | 1–30 developers | Kai teams, har team ki apni service |
| Complexity | Kam | Network, versioning, distributed tracing, data consistency |
| Kab sahi | **Shuru mein, aur aksar hamesha** | Jab alag scaling, alag release cadence ya alag teams ki sach mein zaroorat ho |

"Modular" ka matlab hai ki andar boundaries saaf hon:
- `src/lib` = pure logic (DB ya browser ke bina)
- `src/server` = server-only (DB, secrets)
- `src/components` = UI

Aage foundations plan ka **command layer** bhi isi tarah ki boundary hai.

### 4. Multi-tenancy ke 3 tareeke
| Model | Kaise | Fayde | Nuksaan |
|---|---|---|---|
| **Shared schema** (hamara) | Ek DB, har tenant row mein `orgId` | Sasta, ek migration, aasaan analytics | Ek bug data leak kar sakta hai, isliye enforcement chahiye (scoped DB, RLS) |
| Schema per tenant | Ek DB, har org ka alag Postgres schema | Achha isolation | Migrations × N, connections ka jhanjhat |
| DB per tenant | Har org ka alag DB | Sabse strong isolation, enterprise clients | Mehnga, operations bhaari |

### 5. Data modeling ke faisle
- **ERD** banao: entities aur unke relations (Org → Customer → Skip/Delivery/Payment).
- **Normalization:** ek fact ek jagah. Jahan speed ke liye copy rakho (denormalize), wahan likh do ki "ye snapshot hai". Misaal: `WastageItem.costPerUnit` save hone ke waqt ka daam hai.
- **Derived vs stored:** bill derived hai (meals × daam). Aage band mahine ka bill frozen statement hoga ([../plan/core-domain-v2.md](../plan/core-domain-v2.md)).
- **Time ka modeling:** dates `YYYY-MM-DD` string mein, org ke timezone se (CLAUDE.md rule 2). Daam `effectiveFrom` ke saath.
- **Paisa:** float mein kabhi nahi. Integer paise ya `Decimal` (foundations §3).
- **IDs:** UUID. Offline wale records ki id device par banti hai, taaki replay idempotent ho.

### 6. API design
| Style | Kab | Is repo mein |
|---|---|---|
| **RPC / Server Actions** | Apni hi UI ke forms aur mutations | `src/app/actions/*` |
| **REST / JSON route** | Offline sync, cron, webhooks, mobile ya third party | `/api/sync`, `/api/cron/drive-backup`, `/api/export` |
| GraphQL | Kai alag clients, aur data ki flexible shape | Abhi nahi |

API ke zaroori gun:
- **idempotent** (dobara bhejne par duplicate na bane)
- **validated** (zod)
- **authorized** (kaun bula sakta hai)
- **versioned** (purane client na tootein)
- ek **error model** ke saath

### 7. Offline-first ke tareeke
- **Outbox pattern** (hamara): kaam pehle phone ke DB (IndexedDB) mein jaata hai, UI turant update hota hai, aur net aane par server ko order mein replay hota hai. Server idempotent hai.
- **Conflict resolution:** last write wins (delivery tick), version check (edit forms), ya CRDTs (collaborative editing, hamein abhi nahi chahiye).
- **Kya offline nahi:** jahan server ka time ya rule zaroori ho, jaise skip cutoff.

### 8. Back-of-envelope (andaaza lagana): kya ek Postgres kaafi hai?
```
1,000 messes × 60 customers × 2 meals   = 1,20,000 meals/din
Delivery rows                            ≈ 1.2 lakh/din ≈ 4.4 crore/saal
Ek row ≈ 100 bytes (+ index)             ≈ 10 GB/saal: Postgres ke liye aaraam se
Peak (11:30–14:00): 1,000 staff × ~60 ticks ÷ 9,000 sec ≈ 7 writes/sec (peak 50/s)
```
→ Ek achha Postgres + indexes + connection pooling kaafi hai. Bade tables ke liye partitioning aur archival baad mein. **Pehle measure, phir scale** (chapter 14).

### 9. Tech choose karne ka framework
Maturity, team ka anubhav, ecosystem/docs, kharcha, lock-in, hiring, aur **reversibility**. Amazon ki bhasha mein:
- **One-way door:** palatna mushkil. Database aur tenancy model jaise faisle. Inhe dheere aur soch kar lo.
- **Two-way door:** wapas badal sakte ho. Jaise kaunsi charting library. Inhe jaldi lo.

### 10. RFC / Tech design doc
Bade kaam se pehle 1–3 page ka doc, jise team review karti hai:
- problem
- goals/non-goals
- options aur unke trade-offs
- recommendation
- data model
- API
- rollout/migration
- risks
- testing
- open questions

Is repo ke `docs/plan/*.md` exactly yahi hain.

## 👨‍💻 Developer deep dive
1. **Code likhne se pehle ADR aur plan padho.** "Kyun" samajh kar hi "kaise" sahi banta hai.
2. **Boundaries todo mat.**
   - `src/lib` mein DB ya browser ka import nahi (rule 13).
   - Client component mein server code nahi.
   - Tenant query bina `orgId` ke nahi (rule 1).
3. **Ek naya pattern = ek naya faisla.** Agar tum koi naya tareeka laa rahe ho (nayi library, naya state store), to PR mein "kyun" likho, ya ADR ka draft banao.
4. **Trade-off ki bhasha seekho:** "X se Y milega, par Z ka kharcha hai, aur hum ise A se kam karenge."
5. **Failure modes socho:** net gaya, DB slow hai, request do baar aayi, deploy beech mein hua, ya user ka phone ka time galat hai.

## 📄 Namuna: ADR
```
# ADR-008: Jobs aur notifications ke liye Postgres hi source of truth
Status: Accepted (2026-11-27)
Context: Notifications/jobs chahiye. Vercel Hobby par cron din mein ek baar; aage Docker/VPS bhi.
         Vendor lock nahi chahiye; ₹299 ke plan mein kharcha kam.
Decision: Har job/event Postgres table mein likha jaayega. Worker ko jagaane wale "drivers"
          (inline after(), cron tick, worker process, Vercel Queues…) env se chunte hain.
          Claim: SELECT … FOR UPDATE SKIP LOCKED.
Consequences: + platform badalne par data migrate nahi; + transaction ke saath atomic
              − bahut bade volume par DB load → tab dedicated queue (adapter se)
Alternatives: Redis+BullMQ (alag infra), Vercel Queues only (lock-in), cron only (Hobby par slow)
```

## ⚠️ Aam galtiyan
- **Resume-driven development:** tech isliye chunna ki "CV mein achha lagega".
- Bina zaroorat microservices, Kubernetes ya event sourcing.
- Faisle sirf baat-cheet mein lena, likha hua koi record nahi (ADR nahi).
- NFR ignore karna, phir offline ya Hindi ko baad mein thoonsna.
- Float mein paisa, aur `new Date()` ko "aaj" maan lena (timezone bugs).

## ✅ Seekh
- Architecture = **trade-offs ka record**. Har faisle ka "kyun" likho.
- Chhoti team ke liye simple, boring, reversible tech.
- Andaaza lagao (back-of-envelope) aur failure modes socho.

## 🔗 Is repo mein
- [../roadmap.md](../roadmap.md) → "Faisle jo ho chuke hain" (D1–D23)
- [../plan/platform-foundations.md](../plan/platform-foundations.md), [../plan/core-domain-v2.md](../plan/core-domain-v2.md): RFC style docs
- CLAUDE.md → "Offline architecture", "Rules that matter"

## 🏋️ Practice task
Faisla D10 ("customer ko login nahi, token link") ka ek poora ADR likho:
- context
- decision
- 3 consequences (security ka risk bhi)
- alternatives (OTP login, magic link)

Phir check karo ki production-readiness plan ka "customer link reset" us risk ko kaise kam karta hai.
