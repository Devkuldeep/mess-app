# 08. Backend deep dive: data, auth, tenancy, idempotency, jobs, performance

## 📖 Kahani
Neha (senior backend) ne Tum ko ek din "**backend ka safar**" karaya: "Ek request browser se nikal kar DB tak jaati hai aur wapas aati hai. Raste mein 10 jagah galti ho sakti hai. Har jagah ka ek rule hai." Ye chapter wahi safar hai.

## 1. Ek request ka safar (is app mein)
```
Browser ── HTTPS ──► src/proxy.ts (cookie hai? warna /login; ye sirf optimistic gate hai)
   └─► Page (Server Component) ─► requireMember() (src/server/auth.ts)
         session cookie → sha256 → DB Session → User → Member (org + role)
   └─► src/server/data.ts (har query mein orgId)  ─► Prisma ─► Postgres
   ◄── HTML/RSC stream (Suspense ke saath)
Mutation: Server Action (src/app/actions/*) ya /api/sync (offline ops) → validate → authorize → write
```
**Rule:** `proxy.ts` sirf "cookie hai ya nahi" dekhta hai. **Asli check har page aur har action ke andar** hota hai (`requireMember`), kyunki cookie purani ya chori ki hui ho sakti hai. Isse "defense in depth" kehte hain.

## 2. Authentication (kaun ho?)
| Topic | Industry practice | Is repo mein |
|---|---|---|
| Password storage | Kabhi plain text nahi. Slow hash: bcrypt, scrypt ya argon2, salt ke saath | `src/server/password.ts` (scrypt, node:crypto) |
| Sessions vs JWT | **DB sessions:** revoke karna aasaan. JWT: stateless, par revoke karna mushkil | DB sessions. Cookie mein random token, DB mein uska **sha256** (`createSession`) |
| Cookie flags | `httpOnly` (JS na padh sake), `secure` (sirf HTTPS), `sameSite=lax` (CSRF se bachav) | Teeno lage hain |
| User enumeration | "Phone galat" aur "password galat" alag mat batao | `login` dono ka ek hi error deta hai |
| Timing attack | User na mile tab bhi utna hi time lagao | `DUMMY_HASH` se dummy verify (`src/app/actions/auth.ts`) |
| Brute force | Rate limit + lockout | Planned (production-readiness §2a) |
| Account recovery | Reset link/OTP, single-use, kam expiry | Planned (§2b, §2f) |
| 2FA | TOTP; admin ke liye zaroori | Planned (`/admin`) |

```ts
// src/app/actions/auth.ts (asli code ka hissa)
// Same response time whether or not the phone exists.
const DUMMY_HASH = hashPassword("dummy-password-for-timing");
const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? (await DUMMY_HASH));
if (!user || !ok) return { error: "invalidLogin", values: { phone: parsed.data.phone } };
```

## 3. Authorization (kya kar sakte ho?) + multi-tenancy
- **RBAC** (role-based): owner/manager/delivery. Aage **permissions map** aur per-member grant/revoke ([../plan/roles-permissions.md](../plan/roles-permissions.md)).
- **Tenant isolation:**
  - Har query mein `orgId: ctx.orgId`.
  - ID se likhte waqt `updateMany/deleteMany({ where: { id, orgId } })`.
  - Form ya URL se aaya `orgId` **kabhi nahi** maanna (CLAUDE.md rule 1).
- **DB level ka bachav:** composite foreign keys `(orgId, customerId)`, taaki dusre org ke customer par payment ban hi na sake.
- **IDOR** (Insecure Direct Object Reference): URL mein `/customers/<id>` badal kar dusre ka data dekhna. Iska bachav hai `findFirst({ where: { id, orgId } })`.
- Aage: **scoped DB client**, jo Prisma extension se `orgId` khud lagaye (foundations §4). Phir Postgres **RLS**.

## 4. Validation: "client par kabhi bharosa nahi"
- Har input **boundary par** validate hota hai: form, JSON aur URL params, **zod** se.
- Error messages i18n keys hain, isliye Hindi/English dono mein dikhte hain (`src/lib/validation.ts`, `parseForm`).
- Offline ops ke liye `parseOp` (`src/lib/sync.ts`) har field check karta hai: UUID, date, amount range aur note ki lambai.
- **Native `required`** UI mein turant feedback deta hai, par **server hi source of truth** hai.

## 5. Transactions aur consistency
- **ACID:** Atomic (sab ya kuch nahi), Consistent, Isolated, Durable.
- Jahan kai writes hain (wastage entry + items), wahan **ek transaction** (`db.$transaction`, `applyWastage`).
- **Isolation levels:** Postgres ka default "read committed" hai. Paisa jaise zaroori hisaab mein race conditions socho. Inke ilaaj hain: unique constraints, `SELECT … FOR UPDATE`, ya optimistic version check (foundations §16).
- **Outbox pattern:** DB write aur "event" ek hi transaction mein likho, taaki "payment save hua par notification gaya hi nahi" na ho (notifications plan).

## 6. Idempotency: "dobara aaye to dobara na ho"
Offline app ka sabse zaroori concept. Net jaata-aata hai, isliye **ek request kai baar** pahunch sakti hai.

| Tareeka | Kab | Is repo mein |
|---|---|---|
| Device par UUID + `skipDuplicates` | Naya record (payment) | `applyPayment` |
| Natural key par upsert | Ek din-ek meal ka ek hi record | `applyDelivery`, `applyWastage` (org + date + meal) |
| Idempotency key table | Forms jinki natural key nahi | Planned (foundations §6, `$idem`) |

```ts
// src/server/mutations.ts: replayed op → no second payment
await db.payment.createMany({ data: [{ id: op.paymentId, /* … */ }], skipDuplicates: true });
```

## 7. Error handling aur retry
- Har error ko do category mein baanto:
  - **kabhi theek nahi hoga** (not found, forbidden, invalid): retry mat karo, ops ko drop karo.
  - **baad mein ho sakta hai** (DB busy, network): retry karo, backoff ke saath.
- Is repo mein `applyOps` (`src/server/mutations.ts`) aaj yahi karta hai: `retry: !["not found","forbidden","invalid"].includes(msg)`. Aage ise typed error model banana hai (foundations §1).
- **User ko** saaf, Hindi mein bata do kya hua. **Developer ko** log mein poori baat, request ID ke saath, aur password/phone jaise secrets ke bina.

## 8. Time, dates aur paisa (sabse zyada bugs yahin)
- **"Aaj" kaunsa din hai?** Server UTC mein chalta hai aur mess IST mein, isliye `new Date()` se kabhi "aaj" mat lo. `todayIn(org.timezone)` lo (rule 2).
- Calendar date `"YYYY-MM-DD"` string hai. DB ke boundary par `toDbDate`/`fromDbDate`.
- **Cutoff:** server ke time se, phone ke time se nahi (`isSkipLocked`).
- **Paisa:**
  - float mein kabhi nahi: `0.1 + 0.2 = 0.30000000000000004`.
  - Integer paise ya `Decimal` mein (foundations §3).
- **Clock ko inject karo,** taaki tests "raat 9:01" bana sakein (foundations §2).

## 9. Database: schema, migrations, indexes
- **Prisma schema** `prisma/schema/*.prisma` (multi-file). Migrations `prisma/migrations/` mein.
  - `npm run db:migrate`: dev mein naya migration
  - `npm run db:deploy`: production mein apply
- **Migration ke rules** (production-readiness Phase 4):
  - **Expand → migrate → contract:** pehle naya column, phir backfill, phir code shift, aur purana column agli release mein hatao.
  - Apply ho chuki migration ko kabhi edit mat karo.
  - Bada backfill migration SQL mein nahi, script mein, batches mein.
- **Indexes:** jo `where` aur `orderBy` mein aata hai, jaise `@@index([orgId, date])`. Har index write ko thoda slow karta hai, isliye sirf zaroori wale.
- **N+1 problem:** loop mein ek-ek query. Ilaaj hai `include` ya `in: [...]`, ek hi baar mein.
- **EXPLAIN ANALYZE:** query slow ho to Postgres se poochho ki woh kya kar raha hai (index use hua ya poori table padhi?).
- **Connection pooling:** serverless mein har request naya connection kholti hai, isliye pooled URL (Neon) use hota hai. Migrations ke liye unpooled URL (`prisma.config.ts`).

## 10. Background jobs aur scheduling
- **Kya:** jo kaam request ke andar nahi hona chahiye: roz ka backup, reminders, reports.
- **Cron route:** `/api/cron/drive-backup`, jo **secret header** maangta hai (`timingSafeEqual` se compare hota hai, taaki timing attack na ho).
- **Queue ke concepts** (notifications plan):
  - job table
  - `FOR UPDATE SKIP LOCKED`: kai workers ek hi job na uthayein
  - retry + **exponential backoff** + jitter
  - **dead letter**: baar-baar fail hone wale jobs alag
  - idempotent handlers
- **Platform-agnostic drivers:** inline, cron tick, worker process ya Vercel Queues (D8).

## 11. Caching
- **Pehla rule:** cache tabhi karo jab measure karke pata ho ki slow hai. Cache = stale data ka risk.
- **Kahan:** HTTP/CDN (static), server data cache (Next `"use cache"` + `cacheTag`), aur browser/service worker (offline).
- **Invalidation sabse mushkil hai.** Tags ka convention rakho (foundations §10). Mutation ke baad `updateTag`/`revalidateTag`, ya is repo mein abhi `refresh()`.

## 12. Integrations (bahar ki services)
- **OAuth 2.0** (Google Drive backup): `state` (CSRF ke liye) + **PKCE** verifier, ek httpOnly cookie mein jo sirf `/api/google` par scoped hai. Refresh token **encrypt** karke save hota hai (`src/server/secretbox.ts`). Ise kabhi log ya return mat karo.
- **Webhooks** (aage WhatsApp/Razorpay):
  - **signature verify** karo
  - replay window check karo
  - idempotent processing
  - jaldi `200` do, aur bhaari kaam job mein karo
- **Retries + timeouts** har bahar ki call par.
- **Fake provider** testing ke liye. Is repo mein `GOOGLE_TEST_BASE` (sirf localhost) pehle se hai.

## 13. API design ki chhoti baatein jo badi hain
- `/api/sync` **JSON-only** hai. Doosri site ka HTML form `application/json` bina CORS preflight ke nahi bhej sakta, aur ye CSRF se bachav hai:
  ```ts
  if (!req.headers.get("content-type")?.startsWith("application/json")) return Response.json({ error: "unsupported media type" }, { status: 415 });
  ```
- **Limits:** ek baar mein max 200 ops, note max 200 chars. Har input ki seema tay karo.
- Return mein sirf woh do jo UI ko chahiye, poora DB record nahi (Next docs: "Constrain return values").

## 14. Logging aur observability (backend ka hissa)
- Structured JSON logs, request ID, aur PII redact ([../plan/observability.md](../plan/observability.md) Level A).
- Kya log karo: kaunsa kaam, kitna time, nateeja, aur error ka type. Kya nahi: password, token, phone, ya poora payload.

## 📄 Namuna: backend PR ka security checklist
- [ ] Har entry point (page/action/API) par auth + role/permission
- [ ] Har tenant query mein `orgId`. ID se likhte waqt `updateMany/deleteMany` + `orgId`
- [ ] Input zod se validate, aur length/range ki seema
- [ ] Bahar se aaye IDs (customer, plan) usi org ke hain, ye check
- [ ] Retry/replay par duplicate nahi (idempotent)
- [ ] Multi-step writes ek transaction mein
- [ ] Error user ko saaf, log mein bina secrets ke
- [ ] Migration backward compatible, aur zaroori index

## ⚠️ Aam galtiyan
- Sirf UI mein button chhupana, aur server par permission check nahi.
- `findUnique({ where: { id } })`: dusre org ka record bhi mil jaata hai.
- `new Date()` ko "aaj" maanna.
- Float mein paisa.
- Retry par duplicate payment.
- Migration mein column rename/drop ek hi release mein.
- Logs mein tokens.

## ✅ Seekh
Backend ki 5 kasam:
1. **Validate**
2. **Authorize** (+ `orgId`)
3. **Idempotent**
4. **Transactional**
5. **Observable**

## 🔗 Is repo mein
- `src/server/CLAUDE.md` (tenant isolation checklist), `src/server/auth.ts`, `src/server/mutations.ts`, `src/server/data.ts`
- `src/app/api/sync/route.ts`, `src/app/api/cron/drive-backup/route.ts`, `src/server/secretbox.ts`
- [../plan/platform-foundations.md](../plan/platform-foundations.md) (errors, clock, money, scoped DB, commands, idempotency)

## 🏋️ Practice task
`src/app/actions/portal.ts` ka `portalSetSkip` padho aur 3 sawal ka jawab likho:
1. Isme `skip.deleteMany` mein `orgId` kyun nahi hai, aur kya ye safe hai?
2. Cutoff kahan check hota hai?
3. Agar foundations ka scoped DB aa jaaye, to ye code kaise badlega?
