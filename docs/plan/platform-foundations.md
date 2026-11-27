# Platform foundations plan (M-FOUNDATION)

> Roadmap: **Stage 1** ([../roadmap.md](../roadmap.md)), M-ROLES aur M-READY ke saath.
> Ye plan un cheezon ka hai jo **poore app mein har jagah lagti hain**. Inhe ek baar sahi bana diya to aage har module sirf "khaali jagah bharna" rahega.
>
> Isse jude plans: [roles-permissions.md](roles-permissions.md), [production-readiness.md](production-readiness.md), [observability.md](observability.md), [notifications.md](notifications.md) aur [business-growth.md](business-growth.md). Inke saath kya badalta hai, woh §18 mein hai. Billing aur catalog ka domain [core-domain-v2.md](core-domain-v2.md) mein hai.

## Context
Ye kamiyan code padh kar mili hain:

| # | Kami | Abhi ki haalat | Aage kya dikkat hogi |
|---|---|---|---|
| 1 | Service layer | Payment ka logic do jagah hai: `recordPayment` (`src/app/actions/customers.ts`) aur `applyPayment` (`src/server/mutations.ts`). Skip ka logic `actions/portal.ts` ke andar hi hai | WhatsApp bot, AI entry, public API aur import aayenge to har kaam ki 4–5 copies banengi |
| 2 | Error model | `throw new Error("not found")`, `applyOps` mein strings ki list, `FormState`, `SkipResult` union, aur API mein `{ error: "unauthorized" }`: ek hi cheez ke 4 format | Har naye entry point par errors alag tarah dikhenge |
| 3 | Entitlements | Kuch nahi hai | Billing aane par har feature ko dobara kholna padega |
| 4 | Settings | Har setting `Org` ka ek column hai (`skipCutoffHour`, `wastageTargetPct`) | Dozens settings aane wali hain. Har ek ke liye migration aur haath se banayi screen |
| 5 | Clock | Server code mein ~15 jagah seedha `new Date()`/`Date.now()` (`auth.ts`, `actions/staff.ts`, `drive-backup.ts`, aur `isSkipLocked` ka default) | "Raat 9:01" ya mahine ka end test nahi kar sakte |
| 6 | Money | Bill float mein banta hai (`data.ts`: `meals × pricePerMeal`, `reduce(+amount)`). `₹${x}` kai components mein hard-coded hai. `formatMoney` mein ₹ aur en-IN fixed hai | Paise ka farak dheere-dheere jama hoga, aur USD/US version mushkil |
| 7 | Idempotency | Offline ops mein hai. Online forms mein nahi | 2G par double tap → `saveCustomer` do customer bana dega |
| 8 | Data lifecycle | Sirf CLAUDE.md ka ek rule ("naya table export mein jodo") | DPDP delete, purge jobs aur export ka sahi hona yaad par chalta hai |
| 9 | Tenant scoping | Convention aur review par chalta hai. Misaal: `portalSetSkip` ka `deleteMany` `orgId` ke bina hai (aaj PK ki wajah se safe hai) | Ek bhi filter chhoota to ek mess ka data dusre ko dikh jaayega |
| 10 | Caching | `"use cache"` kahin nahi hai. Har mutation par `refresh()` | Reports aur public page ke liye caching chahiye hogi. Convention ke bina stale data ke bugs aayenge |
| 11 | Multi-host | `src/proxy.ts` ek hi host maan kar chalta hai | Subdomain/custom domain aane par cookies, service worker, OAuth aur TWA sab chhoone padenge |
| 12 | Files | Koi storage nahi hai | Logo, photos, receipts, invoices aur Academy content, sabko chahiye |
| 13 | Import | Export ka framework hai, import ka nahi | Onboarding, materials, leads aur AI-paste, har ek apna parser banayega |
| 14 | i18n bundle | `clientT` (`src/components/ui/shared/client-t.ts`) en aur hi dono `dictionaries` import karta hai (637 lines ki `src/lib/i18n.ts`), aur `AppRuntime`/`Toaster` har page par hain | Plans mein sainkdon naye strings aa rahe hain, jo har page ka JS badha denge aur performance budget tod denge |
| 15 | Search | `filterRows` (`src/lib/table.ts`) mein sirf lowercase `includes()` | "ramesh" likhne par "रमेश" nahi milta. Owner ye roz use karta hai |
| 16 | Kai phones par ek saath | Edit par version check nahi. Live updates nahi. Outbox sirf tab sync hota hai jab app khula ho | Do log ek customer edit karein to pehle wale ka badlav chupchaap mit jaata hai. Owner ko delivery ticks live nahi dikhte |

**Goal:** in sab ke liye ek-ek **chhota, typed foundation**, jo:
- abhi ke behaviour ko bilkul na badle (Phase 1 pure refactor hai, tests ke saath)
- aage ke modules ka kaam aadha kar de

## Sidhant
1. **Ek kaam, ek jagah.** Har business kaam ek **command** hai. Form, offline sync, portal, bot, AI, import, API aur cron, sab usi ko bulate hain.
2. **Convention nahi, enforcement.** Rules types, lint rules aur `satisfies Record<ModelName, …>` se lagte hain, taaki galti par build fail ho, review par depend na rehna pade.
3. **Skeleton abhi, poora baad mein.** Entitlements abhi sab "unlimited", hosts abhi ek, aur storage abhi sirf interface.
4. **Core mein koi nayi runtime dependency nahi.** zod, Prisma aur Node crypto se kaam chalega.
5. **Pure logic `src/lib/` mein, aur tested.** Server ka glue `src/server/` mein. Ye CLAUDE.md rule 13 hai.

## Folder structure (target)
```
src/lib/                 pure, node --test se tested
  errors.ts              AppError codes + mapping
  clock.ts               Clock type, date helpers ke saath
  money.ts  units.ts  format.ts
  entitlements.ts  settings.ts  cache-tags.ts  hosts.ts  tenant-scope.ts
  import/                CSV/TSV parse, header mapping, row validation
src/server/
  db.ts                  systemDb (raw) + scoped client
  clock.ts               now()
  commands/              defineCommand, execute, adapters (form, sync, portal, http, job)
  services/              domain commands: payments.ts, customers.ts, deliveries.ts, skips.ts,
                         wastage.ts, plans.ts, holidays.ts, dishes.ts, staff.ts, settings.ts
  queries/               read functions (data.ts ko dheere-dheere yahan baantenge)
  data-lifecycle.ts      DATA_POLICY registry
  entitlements.ts  settings.ts  storage/  import/
src/app/actions/         sirf patle adapters: FormData → command
```

---

# Tier A: abhi banao (Phase 1, baaki sab inke upar hai)

## 1. Error model
**`src/lib/errors.ts`** (pure):
```ts
export type AppErrorCode =
  | "invalid" | "unauthenticated" | "forbidden" | "notFound" | "conflict"
  | "limitReached" | "readOnly" | "rateLimited" | "unavailable" | "internal";

export class AppError extends Error {
  constructor(public code: AppErrorCode, public opts: {
    key?: ErrorKey;                                   // specific i18n message, e.g. "skipCutoff", "phoneTaken"
    field?: string;                                   // form field to mark red
    fieldErrors?: Partial<Record<string, ErrorKey>>;  // from zod
    retryAfterSec?: number; meta?: Record<string, unknown>;
  } = {}) { super(code); }
}
export const fail = { invalid: (key?, field?) => …, notFound: () => …, forbidden: () => …, conflict: (key, field?) => …, limit: (limit, max) => … };
```

| Code | Kab | HTTP | Offline sync `retry` | UI |
|---|---|---|---|---|
| `invalid` | input galat, cutoff nikal gaya, future date | 400 | false | field ya form error |
| `unauthenticated` | session nahi | 401 | **true** (ops rakho, login karwao; aaj ka behaviour) | login par bhejo |
| `forbidden` | permission nahi | 403 | false | "aapko ye karne ki anumati nahi" |
| `notFound` | id is org ki nahi / mili nahi | 404 | false | "nahi mila" |
| `conflict` | slug/phone pehle se hai, purana edit | 409 | false | field error |
| `limitReached` | plan ki limit (entitlements) | 403 | false | upgrade ka message |
| `readOnly` | maintenance ya suspended org | 423 | true | banner |
| `rateLimited` | zyada koshish | 429 + `Retry-After` | true | "thodi der baad" |
| `unavailable` | Google/WhatsApp jaisi bahar ki service down | 503 | true | "baad mein try karo" |
| `internal` | unknown bug | 500 | true | "kuch gadbad hui" + request ID (support ke liye) |

**Adapters** ek-ek jagah honge:
- `toFormState(e, fd)`: `validation.ts` ke `FormState` mein, aur values echo karne ke same rules ke saath.
- `toSyncResult(e)`: `applyOps` ki string list ki jagah.
- `toHttp(e)`: `{ error: { code, key } }` + status.
- `toPortalResult(e)`.

Unknown error → `internal`. Ye `requestId` ke saath log hoga (M-OBS-1), aur user ko sirf generic message dikhega.

Har code ki i18n key `err_<code>` hogi, en aur hi dono mein. Next ka experimental `forbidden()`/`authInterrupts` abhi nahi lenge: pages ka redirect pattern hi rahega.

## 2. Clock
- **`src/server/clock.ts`:** `now(): Date`. Ek request mein ek hi time rehta hai (React `cache`), taaki request ke beech cutoff ka time na badle. Jobs aur cron mein `now()` har call par naya time deta hai.
- **Test ke liye:** `withClock(date, fn)` (AsyncLocalStorage) aur `TEST_NOW` env. Dono sirf `APP_ENV=test` mein maane jaate hain. E2E ka cutoff test isi se chalega.
- **Rule:**
  - `src/lib/*` ke functions `now` ko **parameter** ki tarah lete hain. `localNow`/`isSkipLocked` mein ye pattern pehle se hai, bas default `new Date()` hatana hai.
  - Server code `now()` pass karta hai.
- **Lint:** ESLint `no-restricted-syntax` rule `new Date()` (bina argument) aur `Date.now()` ko `src/server/**`, `src/app/actions/**`, `src/app/api/**` aur `src/lib/**` mein rokega. Sirf `clock.ts` ko chhoot hai. Client components mein UI timers ke liye ye allowed hai.
- **Migrate:** wahi ~15 jagah jo upar mili hain.

## 3. Money, units aur formatting
**Money (`src/lib/money.ts`):**
- App code mein paisa **hamesha integer paise** mein: `type Paise = number & { __paise: true }`.
- Helpers:
  - `toPaise(x)`: Decimal, string ya number se, string ke through taaki float ka error na aaye
  - `sumPaise`, `mulPaise(paise, qty)`
  - `splitPaise(total, n)`: bachi hui paise baant do (roommate split ke liye)
  - `parseMoneyInput("1,200.50")`, jo Devanagari digits bhi samjhe
- **Prisma boundary** (dates jaisa rule): `fromDbMoney(Decimal) → Paise`, `toDbMoney(Paise) → string`.
  - Purane `Decimal(10,2)` columns waise hi rahenge.
  - **Naye** money columns `Int` honge aur unke naam ke end mein `…Paise` likhna hoga.
- **Billing:** `src/lib/schedule.ts` `billing()` aur `data.ts` ke totals paise math par jaayenge, aur `SchedCustomer.pricePerMeal` ka naam `pricePerMealPaise` hoga. Ek property test random amounts par check karega ki naya total purane total se match kare.
- **Currency:** `Org.currency String @default("INR")` (ek column, sasta). US version mein `"USD"`.

**Units (`src/lib/units.ts`):**
- Units: `kg | g | litre | ml | count | packet | cylinder`, aage `lb | oz | cup`.
- Functions: `toBase` / `fromBase` / `convert`. `roundQty` ko `wastage.ts` se yahan laayenge.
- Quantities `Decimal(10,3)` mein rahengi.

**Format (`src/lib/format.ts`)** ek hi jagah:
- `formatMoney(paise, { currency, lang })`: abhi ka `i18n.ts` wala, ab currency ke saath
- `formatQty(value, unit, lang)`
- `formatDate` (`i18n.ts` se yahan aayega)
- `formatRelative` ("2 ghante pehle")
- `formatNumber` (lakh grouping)

`i18n.ts` purane naam re-export karega, taaki imports na tootein.
- `DataTable` ka `format: "money"` ab **paise** lega. `src/lib/table.ts` aur uske tests update honge.
- Components mein `₹${x}` (`customer-form.tsx`, `payment-form.tsx`, `waste-chart.tsx`) ki jagah `formatMoney`.
- Client components ko `lang` aur `currency` props se milenge (rule 5 ke hisaab se).

## 4. Tenant-scoped database (defence in depth)
- **`src/lib/tenant-scope.ts`** (pure, tested): `scopeArgs(model, operation, args, orgId)`.
  - **Reads, updates aur deletes:** `where` mein `orgId` jod deta hai.
  - **`create`/`createMany`:** `data` mein `orgId` jod deta hai.
  - **`upsert`:** dono mein.
  - **Mismatch:** agar args mein **koi doosra** `orgId` ho to `TenantViolation` throw.
  - Prisma 5+ unique `where` ke saath extra filters leta hai, isliye `findUnique({ where: { id } })` bhi scoped ho jaata hai. Dusre org ki id dene par result `null` aata hai, jo `notFound` ban jaata hai.
- **`src/server/db.ts`:**
  - `systemDb`: abhi ka raw client, naye naam se.
  - `scopedDb(orgId) = systemDb.$extends({ query: { $allModels: { $allOperations } } })`. Ye sirf un models par lagta hai jinka registry (§7) mein `scope: "tenant"` hai. Interactive transactions (`$transaction(async tx => …)`) mein bhi extension lagi rehti hai.
- **`OrgCtx` mein `db` judega**, jo lazy banega. Queries aur commands `ctx.db.customer.findMany(…)` use karenge. Explicit `orgId` filters bhi rakhenge (padhne mein saaf, aur baad ke RLS ke liye).
- **`systemDb` sirf in jagah import ho sakta hai** (ESLint `no-restricted-imports` ki allowlist):
  - `auth.ts` (session, user aur member lookup)
  - portal/invite token lookup (token se customer ya invite dhundhna, phir scoped)
  - jobs/cron, platform admin, aur `data-lifecycle` purge
- **Kya cover nahi hota:**
  - **Raw SQL** (`$queryRaw`): ye sirf allowlist files mein chalega, review ke saath.
  - **Nested writes:** extension inhe nahi dekhta. Composite FKs `(orgId, customerId)` DB level par pehle se bachate hain, aur naye relations mein bhi yahi pattern rakhna hai.
- **Baad mein:** Postgres RLS. `execute` transaction mein `SET LOCAL app.org_id`, aur policies ki ek migration (decision D1).

## 5. Command layer (service layer)
Har write ek command hai:
```ts
// src/server/services/payments.ts
export const recordPayment = defineCommand({
  name: "payment.record",              // = audit action = event name (ek hi vocabulary)
  input: paymentInputSchema,           // zod, src/lib/validation.ts
  actors: ["member"],                  // kaun bula sakta hai: member | customer | system | platform
  permission: "payments.record",       // M-ROLES
  requires: {},                        // entitlements: { feature?, limit? }
  idempotency: { natural: (i) => i.paymentId },   // ya "request" (form $idem / sync opId)
  rateLimit: "write.default",          // production-readiness ki limits
  invalidates: (i, r, a) => [tags.payments(a.orgId), tags.customer(a.orgId, i.customerId)],
  async run({ tx, actor, input, now, record, emit }) {
    await assertCustomer(tx, input.customerId);
    await tx.payment.createMany({ data: [{ … }], skipDuplicates: true });
    record({ action: "payment.record", entity: "payment", id: input.paymentId, after: { amountPaise: … } });
    emit("payment.recorded", { paymentId: input.paymentId, customerId: input.customerId, amountPaise: … });
    return { id: input.paymentId };
  },
});
```

**`execute(cmd, actor, rawInput, { source, requestKey })` ki pipeline:**
1. **Context:** log context banta hai (source, command, actor) aur timing (M-OBS-1 ka `withAction` yahin hai).
2. **Input** zod se check hota hai → galat ho to `invalid` + `fieldErrors`.
3. **Org state:** `readOnly`/`suspended`/maintenance (§8) → `readOnly`.
4. **Actor:** kya ye actor ye command bula sakta hai? Phir permission check (`can()`).
5. **Entitlement** feature/limit check (§8).
6. **Rate limit** (production-readiness).
7. **Transaction** (`ctx.db.$transaction`), jiske andar:
   - idempotency claim (§6)
   - `run`
   - `record`/`emit` ki buffered entries ka flush: audit (M-AUDIT) aur DomainEvent (M-EVENTS). Jab tak ye modules nahi bante, flush sirf log karta hai. **Services abhi se audit aur events declare kar dengi**, isliye baad mein har service dobara nahi kholni padegi.
   - idempotent result save
8. **Commit ke baad:** cache invalidation (§10), aur `after()` mein analytics `track()`.
9. **Error** ko adapter ke format mein badalna (§1).

**Actors:**
- `member`: `OrgCtx` + permissions.
- `customer`: portal token se resolve hota hai. Sirf woh commands chala sakta hai jinke `actors` mein `"customer"` likha ho, jaise `skip.set` aur aage `portal.optIn`.
- `system`: job ya cron, `orgId` ke saath.
- `platform`: super admin/support. Ye audited support session hai (`observability.md`).

**Adapters** (`src/server/commands/adapters/`):
- `formAction(cmd, mapFormData)`: Server Action `(prev, fd) => FormState` lautata hai, `$idem` padhta hai, aur success par `refresh()`/`updateTag`.
- `syncAdapter`: `applyOps` har op ke `kind` se command dhundhta hai, `requestKey = opId` deta hai, aur `toSyncResult` lautata hai.
- `portalAdapter`: token → customer actor (rate-limited).
- `httpAdapter` (public API/webhooks, baad mein) aur `jobAdapter` (system actor).

**Queries:** padhne wale functions sade rahenge, `(ctx, args)` lete hain aur `ctx.db` use karte hain, `execute` ki zaroorat nahi. Rule ye hai ki queries **kabhi write nahi karengi**. `src/server/data.ts` ko dheere-dheere `queries/` mein baantenge.

**Abhi ke code ka migration** (Phase 1, bina behaviour change):

| Abhi kahan hai | Command |
|---|---|
| `mutations.ts` `applyPayment` + `actions/customers.ts` `recordPayment` | `payment.record` |
| `actions/customers.ts` `deletePayment` | `payment.delete` |
| `mutations.ts` `applyDelivery` | `delivery.set` |
| `mutations.ts` `applyWastage` | `wastage.save` |
| `actions/customers.ts` `saveCustomer`, `setCustomerEnd` | `customer.save`, `customer.setEnd` |
| `actions/portal.ts` `portalSetSkip` | `skip.set` (actor: customer) |
| `actions/settings.ts` (org, plan, holiday, dish) | `org.update`, `plan.save`/`plan.delete`, `holiday.add`/`holiday.remove`, `dish.save`/`dish.archive` |
| `actions/staff.ts` (owner side) | `invite.create`/`invite.cancel`, `member.changeRole`/`member.remove` |

- **Bahar rahenge:** identity ke flows (`signup`, `login`, `logout`, `joinWithInvite`) aur Google OAuth/Drive ke routes. Ye apni jagah rahenge, par error model, clock aur rate limit use karenge.
- `createOrg` ek command banega `user` actor ke saath, kyunki us waqt tak org nahi hoti.
- **Migration ka order:** pehle abhi ke behaviour par integration tests (production-readiness Phase 3). Phir migrate. Phir wahi tests pass hone chahiye.

## 6. Idempotency (har write par)
**Do tarah ki keys:**
- **Natural:** jahan DB ka unique key khud duplicate rokta hai. Misaal: device par bana `paymentId`, skip/delivery ka PK, aur wastage ka `org+date+meal`. Inke liye extra table ki zaroorat nahi.
- **Request:** form ka `$idem`, sync ka `opId`, bot ka message ID, ya webhook ka event ID. Ye table mein jaata hai:
  ```prisma
  model IdempotencyKey {
    scope String      // orgId (ya "global")
    key   String      // "<command>:<requestKey>"
    result Json?      // pehli baar ka result (jaise naye customer ki id → wahi redirect)
    createdAt DateTime @default(now())
    @@id([scope, key])
  }
  ```

**Flow:** ye `run` ki **usi transaction** mein chalta hai:
1. `INSERT … ON CONFLICT DO NOTHING`.
2. Agar key pehle se hai, to stored result lautao.
3. Agar `run` fail hua, to key bhi rollback ho jaati hai, isliye retry chal jaata hai.
4. Agar do request ek saath aayein, to doosri unique index par ruk jaati hai aur pehli ke commit hone ke baad stored result paati hai.

**Client:**
- `ActionForm` aur `QuickForm` mount hote waqt hidden `$idem` (`crypto.randomUUID()`) daalte hain, aur `{ ok: true }` ke baad naya banate hain.
- Bina JS ke chalne wale form ke liye server bhi hidden field render karta hai.
- Agar service worker ke cached page se wahi key dobara aaye, to wahi purana result milega, aur yahi sahi behaviour hai.

**Retention:** 7 din. Purge §7 ke registry se.

## 7. Data lifecycle registry
**`src/server/data-lifecycle.ts`:**
```ts
type Policy = {
  scope: "tenant" | "global";                       // §4 isi se scoping lagata hai
  pii?: readonly string[];                          // personal data wale fields
  secret?: readonly string[];                       // kabhi export/log nahi
  export: false | { file: string };                 // export.ts mein hona zaroori
  retention: "orgLifetime" | "accountLifetime" | { days: number; after: string };  // purge rule
  onOrgDelete: "cascade" | "anonymize" | "keep";
  onPersonErase?: "delete" | "anonymize" | "keep";  // DPDP "mera data hatao"
};
export const DATA_POLICY = { … } satisfies Record<ModelName, Policy>;
```
Prisma ka generated `ModelName` use hota hai, isliye **naya model registry mein na ho to `npm run typecheck` fail** ho jaayega. Ise yaad rakhne ki zaroorat nahi.

**Abhi ke models:**

| Model | Scope | PII / secret | Export | Retention | Org delete | Person erase |
|---|---|---|---|---|---|---|
| User | global | name, phone / passwordHash | staff.csv (name, phone) | account lifetime | keep | anonymize |
| Session | global | / id (hash) | no | `expiresAt` ke baad purge | n/a | delete |
| Org | tenant | phone, upiId | data.json | org lifetime | delete | n/a |
| Member | tenant | n/a | staff.csv | org lifetime | cascade | delete |
| Invite | tenant | name, phone / token | no | `expiresAt` + 30 din | cascade | delete |
| Plan, Holiday, Dish | tenant | n/a | csv | org lifetime | cascade | n/a |
| Customer | tenant | name, phone, address, notes / portalToken | customers.csv | org lifetime | cascade | anonymize |
| Skip, Delivery, WastageEntry, WastageItem | tenant | n/a | csv | org lifetime | cascade | keep (customer anonymized) |
| Payment | tenant | note | payments.csv | org lifetime | cascade | keep (financial record, note hata do) |
| DriveConnection | tenant | email / refreshTokenEnc | **no** | disconnect tak | cascade | delete |

**Ye registry kahan-kahan use hoti hai:**
1. **Export:** ek integration test check karta hai ki har `export.file` `buildExport` ke output mein hai.
2. **Scoping:** §4.
3. **Logs:** observability ke `redact()` ko `pii` aur `secret` ki list yahin se milti hai.
4. **Purge:** `retention` ke rules ek scheduled job chalata hai. M-EVENTS se pehle ye cron hai.
5. **Delete flows:** DPDP delete aur org delete (M-LAUNCH / M-ORG) `onPersonErase` aur `onOrgDelete` follow karte hain.
6. **Privacy page:** `npm run docs:retention` registry se retention ki table banata hai, taaki privacy page sahi rahe (lawyer review ke liye).

Aage ke plans ke models bhi isi mein judenge: `AuditLog` 2 saal, `AnalyticsEvent` 180 din, `Job` done hone ke 14 din baad, `DomainEvent` 30 din, `Notification` 180 din, `RateLimit` 1 din, `IdempotencyKey` 7 din.

---

# Tier B: skeleton abhi (Phase 2), poora jab zaroorat ho

## 8. Entitlements (plan features + limits) aur org state
**`src/lib/entitlements.ts`** (pure):
```ts
export const FEATURES = ["reports.advanced", "forecast", "whatsapp.api", "staff.multiple", "ai.assist",
                         "customDomain", "academy.pro"] as const;
export const LIMITS = ["customers", "staff", "whatsapp.monthly", "sms.monthly", "storage.mb"] as const;
export const PLAN_KEYS = ["pilot", "trial", "starter", "growth", "pro"] as const;
export const PLAN_ENTITLEMENTS: Record<PlanKey, { features: readonly Feature[] | "all"; limits: Partial<Record<Limit, number | null>> }>;
// pilot = "all" + koi limit nahi  → aaj ke saare orgs
export function resolveEntitlements(planKey, overrides?): Entitlements;
```

**`Org` mein ye judega:**
- `planKey String @default("pilot")`
- `entitlementOverrides Json?`: sirf platform support badal sakta hai
- `state String @default("active")`: `active | readOnly | suspended`

M-BILL aane par `planKey` aur `state` subscription se sync honge. Production-readiness ka `MAINTENANCE=readonly` ek global state hai, jo `execute` ke step 3 mein check hota hai.

**Server:**
- `getMember` mein `ctx.entitlements` banega (permissions ki tarah).
- Functions: `entitled(ctx, feature)`, `limitOf(ctx, limit)`, aur `usage(ctx, limit)`. `usage` counters deta hai: active customers, staff, aage messaging ka `NotificationUsage` aur storage.
- Command `requires: { feature: "forecast" }` ya `{ limit: "customers" }` declare karega, aur `execute` check karega. Limit paar hone par `limitReached` + meta `{ limit, max }` milega.

**Permission aur entitlement mein farak:**
- **Permission** = mess ke andar *kaun* ye kaam kar sakta hai. Jisko permission nahi, use UI hi nahi dikhta.
- **Entitlement** = mess ne *kya kharida* hai. Jo plan mein nahi, wo dikhega par locked, "Growth plan mein" badge aur pricing link ke saath. Paid features kabhi chupchaap gayab nahi honge.

**Ek source of truth:** pricing page (`src/lib/business.ts` `PLANS`) ki feature list `PLAN_ENTITLEMENTS` aur i18n labels se banegi. Isse jo page par likha hai aur jo code enforce karta hai, dono kabhi alag nahi honge.

## 9. Settings registry
**`src/lib/settings.ts`** (pure):
```ts
export const SETTINGS = defineSettings({
  "skip.cutoffHour":   { scope: "org",  schema: z.number().int().min(0).max(23), default: 21, permission: "settings.org", group: "mess",    control: "stepper" },
  "wastage.targetPct": { scope: "org",  schema: z.number().int().min(1).max(50), default: 5,  permission: "settings.org", group: "kitchen", control: "stepper" },
  "notify.quietHours": { scope: "org",  schema: quietHoursSchema, default: { from: "21:30", to: "07:30" }, permission: "notifications.manage", group: "notify", control: "timeRange" },
  "ui.lang":           { scope: "user", schema: z.enum(["hi", "en"]), default: "hi", control: "radio" },
  // naya setting = ek entry + en/hi label (labelKey/hintKey = `set_<key>`)
});
```

**Storage:**
- `OrgSetting { orgId, key, value Json, updatedBy, updatedAt, @@id([orgId, key]) }`, jo tenant-scoped hai.
- `UserSetting { userId, key, value Json, … }`.

Har key alag row mein hai, isliye do log alag settings ek saath badlein to ek dusre ka badlav nahi mitega, aur audit mein har key ka purana/naya value saaf dikhega.

**Read aur write:**
- **Read:** `getSettings(ctx)` per request cached hai aur defaults ke saath typed object lautata hai. DB mein galat value ho to default use hoga aur `warn` log.
- **Write:** ek hi command `settings.update` (key + value). Key ke schema aur permission se validate hota hai, aur audit apne aap milta hai.

**UI:** `SettingsRows keys={[…]}` server component har key ke `control` se sahi form control banata hai: `FormNumberStepper`, `FormSwitch`, `FormRadioGroup`, ya time range. Ye `QuickForm` ke andar hota hai. More ki har screen bas keys ki ek list rahegi (rule 6).

**Column ya registry?** Agar koi field query, filter ya join mein use hoti hai, ya pehchaan ka hissa hai, to column rahegi: `name`, `slug`, `timezone`, `phone`, `upiId`, `brandColor`, `currency`. Baaki preferences registry mein jaayengi. `skipCutoffHour` aur `wastageTargetPct` ko expand/contract se registry mein shift karenge (do releases).

**Feature-flag overrides** bhi isi table mein `flag.<name>` keys se rahenge. Inhe sirf platform badal sakta hai, owner nahi. Isse production-readiness ka `Org.flags Json` hat jaata hai.

## 10. Cache aur invalidation ka convention
- **Abhi kuch nahi badlega.** Pages dynamic hain aur mutation ke baad `refresh()` hota hai.
- **Tags** sirf `src/lib/cache-tags.ts` se aayenge, kahin string likhne ki jagah nahi. Har tag 256 characters se chhota ho.
  - `tags.org(id)`, `tags.customers(id)`, `tags.customer(id, cid)`, `tags.payments(id)`
  - `tags.menu(id)`, `tags.reports(id)`, `tags.public(id)`
- **Cached reads:** `"use cache"` sirf `src/server/queries/*` mein. Saath mein `cacheTag(...)` aur `cacheLife(...)`.
  - `orgId` aur output par asar dalne wali har cheez (`lang`, permission-related flags) **argument** mein aayegi.
  - Cached scope ke andar `cookies()`/`headers()` nahi padh sakte. Ye Next docs ka restriction hai: `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md`.
- **Invalidation:** command ka `invalidates()` tags lautata hai, aur `execute` context ke hisaab se call karta hai:
  - Server Action mein `updateTag(tag)`, taaki user ko apna badlav turant dikhe.
  - Route handler, sync ya job mein `revalidateTag(tag, "max")`.
- **Pehle users:**
  - M-REPORTS (`cacheLife("hours")`)
  - M-MENU
  - M-PUBLIC (`tags.public`)
- **Kabhi cache nahi:** per-user permission-filtered data (jab tak permissions args mein na hon), aur `/api/*`.
- **Service worker ka cache alag hai** (offline ke liye). Server cache sirf speed ke liye hai.

## 11. Host resolution (multi-host ki taiyaari)
**`src/lib/hosts.ts`** (pure, tested):
```ts
resolveHost(host, { appHost, rootDomain }) →
  | { kind: "app" } | { kind: "mess"; slug } | { kind: "custom"; domain } | { kind: "unknown" }
```
- **Env:** `APP_HOST` (`APP_URL` se) aur `ROOT_DOMAIN?`. Ye production-readiness ke env schema mein judenge.
- **`src/proxy.ts`:** pehle `resolveHost`. Abhi sirf `app` kind hai, aur baaki logic wahi rahega. Dev mein test ke liye `?__host=` override, sirf `APP_ENV=local` mein.
- **URL helpers:** `src/lib/links.ts` mein `appUrl(path)`, `portalUrl(token)` aur `messUrl(org, path)`. Host ko string jod kar URL banana band. Misaal: `customers/[id]/page.tsx` abhi `${origin}/c/${token}` jodta hai.
- **Abhi ke faisle** (taaki baad mein galat na bane):
  1. Session cookie **host-only** rahegi, app host par, `Domain=` ke bina. Mess ke public hosts ko session kabhi nahi dikhega.
  2. Customer portal `/c/[token]` app host par hi rahega.
  3. Service worker, TWA assetlinks, OAuth callbacks aur Server Actions sirf app host par.
  4. Public mess pages read-only honge. Enquiry/lead form sirf rate-limited `POST /api/public/lead` se.
- **M-PUBLIC mein:**
  - `mess` host → `/m/[slug]` par rewrite
  - `OrgDomain { orgId, domain @unique, verifiedAt, status }` + DNS TXT verification
  - TLS ka adapter: Vercel Domains API ya VPS par Caddy on-demand

---

# Tier C: jab pehla feature maange (Phase 3)

## 12. File storage
**Kab:** pehli zaroorat par, yaani M-LAUNCH mein logo ya M-PUBLIC mein photos. Interface abhi tay kar rahe hain.

**Interface** (`src/server/storage/`):
```ts
interface StorageProvider { put(key, body, { contentType }); get(key); signedUrl(key, ttlSec); createUploadUrl?(key, opts); delete(key) }
```

**Drivers** (`STORAGE_DRIVER` env se):
- `local`: dev aur Docker volume
- `vercel-blob`: private, `@vercel/blob` dependency (approval chahiye)
- `s3`: R2/S3/Backblaze ke liye, bina SDK ke ek chhota SigV4 signer `fetch` par

**Model:**
```prisma
model File {
  id String @id @default(uuid(7)) @db.Uuid
  orgId String? @db.Uuid
  purpose String           // catalogue: logo | public_photo | receipt | invoice | kitchen_photo | complaint | academy
  key String  contentType String  size Int  sha256 String
  createdBy String? @db.Uuid  createdAt DateTime @default(now())  deletedAt DateTime?
  @@index([orgId, purpose])
}
```

**Purpose catalogue** (`src/lib/files.ts`): har purpose ke rules: max size, allowed types, visibility (private/public), retention aur max image size.

**Upload:**
- Client par canvas se resize/compress (max 1600px, WebP/JPEG). Isse 2G par jaldi upload hota hai aur **EXIF/GPS bhi hat jaata hai** (privacy).
- Server magic bytes aur size check karta hai.
- Vercel function body ki limit 4.5 MB hai, isliye usse bade files ke liye `createUploadUrl` se seedha storage par upload.

**Access:**
- `/api/files/[id]`: scoped lookup + purpose ki permission → 5 minute ka signed URL par redirect (local driver par stream).
- Public purpose wale files ka public URL, lamba cache ke saath.

**Baaki:**
- **Quota:** entitlement `storage.mb`.
- **Export:** export mein `files.csv` aur chhote files (20 MB tak).
- **Offline:** upload online-only. Offline mein "net chahiye" dikhayenge.

## 13. Generic import framework
**Kab:** M-ONBOARD (customers) mein, phir materials, leads, menu aur AI-paste mein.

**Pure part** (`src/lib/import/`):
- `parseDelimited(text)`: CSV/TSV, delimiter khud pehchanta hai, BOM aur UTF-16LE (Excel ka "Unicode text") handle karta hai, quoted fields bhi.
- `normalizeCell`: trim, NBSP, aur **Devanagari digits ०–९ → 0–9**. Phone numbers ke liye zaroori. Helper `src/lib/text.ts` mein.
- `defineImporter(...)`:
  ```ts
  defineImporter({ entity: "customers", command: "customer.save",
    columns: [{ key: "name", aliases: ["name", "naam", "नाम", "customer"], schema: f.requiredText(1, 80, "nameRequired"), required: true }, …],
    identity: (row) => row.phone,           // dedupe
    toInput: (row) => ({ … }) })
  ```
- `mapHeaders` (aliases + fuzzy match) aur `validateRows`: har row ki errors (i18n keys), aur file ke andar ke duplicates.

**Server** (`src/server/import/`):
- **`previewImport`:** validate karta hai, aur DB ke saath dedupe karke har row ko naya/update/skip mein baantta hai.
- **`commitImport`:**
  - 50-50 ke batches mein `execute(command)`, `source: "import"` ke saath.
  - Har row ka idempotency key `import:<runId>:<rowHash>`, isliye import dobara chalana safe hai.
  - Permissions, entitlement limits, audit aur events sab apne aap lagte hain.
- **`ImportRun`:** `{ id, orgId, entity, status, total, created, updated, skipped, failed, errors Json, fileId?, createdBy, createdAt }`.

**UI (generic):**
1. File upload karo ya paste karo (Google Sheets se copy → TSV).
2. Column mapping (har column ke liye `FormSelect`).
3. Preview `DataTable`, badges ke saath.
4. Confirm.
5. Result, aur galat rows ka CSV download.

**Isi pipeline se aur bhi kaam chalenge:**
- Android Contact Picker
- AI-paste: [../modules/academy-content.md](../modules/academy-content.md) ka free alternative. Prompt AI se hamare headers wala CSV maangta hai.

XLSX parser baad mein, approval ke saath. Tab tak "Excel mein Save As CSV" ka hint.

---

# Additions: i18n, search, multi-device

## 14. i18n architecture (namespaces)
- **`src/lib/i18n/` folder:**
  - `index.ts`: `Lang`, `fmt`, `isLang`, aur plural helper.
  - Namespaces: `common.ts`, `runtime.ts` (toasts, confirm, sync, offline: **sirf yahi client bundle mein**), `auth.ts`, `customers.ts`, `payments.ts`, `wastage.ts`, `settings.ts`, `errors.ts` (§1 ki `err_*` keys), `notify.ts` (notification templates), `billing.ts` …
  - Har file `{ en: {...}, hi: {...} }` export karti hai. `satisfies` se **compile time par** check hota hai ki dono bhashaon mein same keys hain.
- **Server:** `getT("customers", "common")` sirf zaroori namespaces jodta hai. Client components ko strings props se milti hain (rule 5, pehle jaisa). `clientT` sirf `runtime` namespace padhega.
- **Migration:** `src/lib/i18n.ts` kuch samay tak saare namespaces merge karke purana `Dict` re-export karega, taaki imports na tootein. Phir module-by-module shift karenge.
- **Plural aur placeholders:** `fmt` mein `{ one, other }` variants `Intl.PluralRules` se. Ek test check karega ki har key ke placeholders (`{n}`, `{name}`) dono bhashaon mein same hon, aur koi string khaali na ho.
- **Naye bhasha ka workflow** (M-LANG): namespace ko JSON mein export karo, translator bhare, phir import. Kisi key ka translation na ho to pehle Hindi, phir English dikhegi.
- **Budget:** CI ka bundle check (production-readiness Lighthouse) ye bhi dekhega ki client bundle mein `runtime` ke alawa koi namespace na ho.

## 15. Search (Hindi aur English naam)
- **`src/lib/search.ts`** (pure, tested): `searchKey(text)`. Pehle NFKC normalize aur lowercase. Phir Devanagari → Latin transliteration, ek chhoti mapping table se: क→k, ख→kh, श/ष→sh, and matras → vowels. Phir Latin ko simple phonetic roop mein laata hai: doubled letters, `ee`/`i`, `oo`/`u`, `w`/`v`, `aa`/`a` ek kar deta hai. Isse dono scripts **ek hi key** mein aa jaati hain. Query bhi isi function se guzarti hai, aur match substring par hota hai.
- **Phone:** aakhri 4–10 digits se bhi search, aur Devanagari digits bhi (`normalizeCell`, §13).
- **Storage:** `Customer.searchKey String` naam/phone/area badalne par command mein ban jaata hai, aur purani rows ke liye backfill. Bade lists ke liye server-side search, aur baad mein `pg_trgm` index (fuzzy). `DataTable` ki client search bhi chhupe hue `searchKey` column par usi function se chalti hai, isliye dono ek jaisa result dete hain.
- **Tests:** "Ramesh" / "रमेश" / "ramesh ji"; "Sharma" / "शर्मा"; "Pooja" / "Puja" / "पूजा".
- **Kahan use hoga:** customers, payments, leads, import ka dedupe (milte-julte naam par warning), aur aage command palette.

## 16. Multi-device: concurrency, live updates, offline v2
- **Optimistic concurrency:**
  - Edit hone wale entities (`Customer`, `Plan`, `Dish`, `Subscription`, settings rows) par `version Int @default(0)`.
  - Edit form `expectedVersion` bhejta hai, aur command `updateMany({ where: { id, orgId, version: expected }, data: { …, version: { increment: 1 } } })` chalata hai.
  - `count === 0` ka matlab kisi aur ne pehle badal diya. Tab error `conflict` (key `editedByOther`: "kisi aur ne abhi badla, naya data dekh kar dobara karo") aur latest data milta hai.
  - Toggle wale ops (delivery tick, skip) mein last write wins theek hai. Har command apna rule declare karega: `concurrency: "version" | "lastWriteWins"`.
- **Live updates:**
  - **Pehla kadam (P2):** live screens (`/delivery`, `/today`) par page dikh raha ho to focus par aur har 60s par `router.refresh()`. Sasta hai, aur kisi naye infra ki zaroorat nahi.
  - **Doosra kadam (P3, M-EVENTS ke baad):** `GET /api/live` SSE stream (Node runtime par streaming chalti hai), jo DomainEvents ke ek "live" subscriber se per org channel par chalta hai. Message chhota hota hai, jaise `{ type, tags }`, aur client sirf asar wali screen refresh karta hai. Driver-agnostic: VPS/worker par Postgres `LISTEN/NOTIFY`, warna polling. WebSockets tabhi, jab sach mein zaroorat ho.
- **Background Sync:**
  - Op queue hote hi service worker ek `outbox-flush` sync tag register karta hai (Background Sync API, Chrome/Android/TWA). Isse **app band hone ke baad bhi** ops sync ho jaate hain.
  - Jahan support nahi hai (iOS), wahan abhi ke triggers chalenge: reconnect, focus aur 30s.
- **Outbox ops ka version:**
  - Har op mein `v` hoga. `parseOp` abhi ka aur pichhla version dono maanega, taaki purane app wala phone bhi sync kar sake (production-readiness "Version skew").
  - Dexie ke local tables mein `version(n).upgrade()` migrations. Pending ops kabhi delete nahi honge, sirf naye format mein badlenge.

---

## 17. Conventions (har naye code par)
- **IDs:**
  - Naye server-side tables par `@default(uuid(7))` (time-ordered, index ke liye achha).
  - Offline par bani rows ki id device par `crypto.randomUUID()` (jaisa abhi hai).
- **Columns:**
  - `createdAt`, edit hone wali rows par `updatedAt @updatedAt`, aur `createdBy` (userId).
  - Calendar date `@db.Date` + `ISODate` string, naam `date` ya `…On`.
  - Timestamp ka naam `…At`.
  - Naya money column `…Paise Int` hoga.
  - Quantity `Decimal(10,3)`.
- **Delete:** history mein referenced business records **archive** hote hain (`archived`, `endDate`), delete nahi (Dish wala pattern). Asli delete sirf user ki galti sudharne ke liye (jaise galat payment), aur wo hamesha audited.
- **Enum ya catalogue:**
  - Band, kam badalne wale sets ke liye Prisma enum: `Meal`, `Role`, `PayMethod`.
  - Badhte rehne wale sets (audit actions, events, notification types, setting keys, file purposes) `src/lib` mein zod-validated strings. Isse naye value ke liye migration nahi chahiye.
- **Naming:** command = `domain.verb`. Audit action aur event ka naam bhi wahi, taaki poore system mein ek hi vocabulary ho.
- **Lists:** cursor pagination (`id` uuid7, ya `(date, id)`), page size 50, aur filters URL mein (rule 9).
- **Schemas:** form, sync op, import aur API, sab ek hi zod schema use karte hain (`src/lib/validation.ts`). Sync ka `parseOp` bhi dheere-dheere usi schema se banega.

## 18. Dusre plans par asar
| Plan | Kya badla |
|---|---|
| [roles-permissions](roles-permissions.md) | Command `permission` + `actors` declare karta hai, aur `execute` `can()` chalata hai. Pages par `requirePermission` waise hi rahega |
| [observability](observability.md) | `withAction` logging, audit ka flush aur `track()` sab `execute` ke hooks mein hain, isliye har action ko alag se wrap nahi karna. Audit ke fields `record()` se aate hain. `redact()` aur retention §7 ke registry se |
| [notifications](notifications.md) | `emit()` = command ka `emit` (usi transaction mein). Jobs `system` actor se chalte hain. `Org.notifySettings Json` ki jagah settings registry ki keys (`notify.*`) |
| [production-readiness](production-readiness.md) | Rate limit per command declare hoga. Maintenance read-only `execute` mein check hoga. Feature flags ke overrides `OrgSetting` mein (`flag.*`). Integration tests zyada tar command level par. Env schema mein `APP_HOST`, `ROOT_DOMAIN` aur `STORAGE_*` judenge |
| [business-growth](business-growth.md) | Paisa paise mein, naye columns `…Paise`. Expenses, stock aur leads commands hain, offline wale sync adapter se. Customers, materials aur leads ka import §13 se. Kitchen mode registry mein |
| M-BILL (likhna baaki) | `planKey`/`state` subscription se sync, entitlements §8 se, aur suspend → `readOnly` |
| [core-domain-v2](core-domain-v2.md) | Is foundation ka sabse bada pehla user: billing engine paise mein, naye commands, settings keys (`billing.*`, `menu.*`), registry entries, aur import se opening balance + subscriptions |

## Phases aur Stage 1 ka poora order
Taaki confusion na ho, Stage 1 ke teeno plans ka **milaa-jula order** ye hai:

1. **M-READY P1:** CI + env validation, sabse pehle safety net.
2. **M-READY P3 ka harness:** fixtures + abhi ke code par tenant-isolation aur flow integration tests. Isse aaj ka behaviour lock ho jaata hai.
3. **FOUNDATION P1a** (pure, kam risk): errors §1, clock §2, money/units/format §3.
4. **M-ROLES:** `permissions.ts` + `requirePermission`. Commands ko permission ke naam chahiye.
5. **FOUNDATION P1b:**
   - scoped DB §4
   - command layer + adapters §5 aur idempotency §6
   - abhi ke saare mutations ka migration (§5 ki table)
   - data lifecycle registry §7

   Step 2 ke tests pass rehne chahiye.
6. **M-OBS-1:** logging `execute` aur `instrumentation.ts` mein judega.
7. **FOUNDATION P2** (skeletons): entitlements §8 (sab `pilot`), settings registry §9 (cutoff aur wastage target ko shift karna), cache tags §10, host resolver §11, i18n namespaces §14, search key §15, aur §16 ka version check + refresh polling + Background Sync + op versions.
8. **M-READY P2, P4, P5:** rate limits per command, flags (§9 storage), release aur DR.
9. **FOUNDATION P3** aage ke stages mein jab zaroorat ho: storage §12 (M-LAUNCH/M-PUBLIC), import §13 (M-ONBOARD), multi-host rollout (M-PUBLIC), SSE live updates §16 (M-EVENTS ke baad) aur RLS.

## Naye files aur badlaav (P1 + P2)
- **New:**
  - `src/lib/{errors,clock,money,units,format,tenant-scope,entitlements,settings,cache-tags,hosts,search}.ts` (+ `*.test.ts`), `src/lib/i18n/*` (namespaces)
  - `src/server/clock.ts`, `src/server/commands/{define,execute,adapters/*}.ts`, `src/server/services/*.ts`, `src/server/queries/*.ts`
  - `src/server/data-lifecycle.ts`, `src/server/entitlements.ts`, `src/server/settings.ts`
  - `prisma/schema/platform.prisma` (`IdempotencyKey`, `OrgSetting`, `UserSetting`)
  - `src/components/settings-rows.tsx`
- **Modified:**
  - `src/server/db.ts` (`systemDb` + `scopedDb`), `src/server/auth.ts` (`ctx.db`, `ctx.entitlements`)
  - `src/server/mutations.ts` (sync adapter ban jaata hai), `src/app/actions/*.ts` (patle adapters), `src/app/api/sync/route.ts`
  - `src/lib/schedule.ts` + `src/server/data.ts` (paise), `src/lib/table.ts` + `src/lib/i18n.ts` (format re-exports)
  - `src/components/ui/forms/{action-form,quick-form}.tsx` (`$idem`), `src/proxy.ts` (resolveHost)
  - `prisma/schema/org.prisma` (`currency`, `planKey`, `entitlementOverrides`, `state`)
  - `eslint.config.mjs` (clock aur `systemDb` rules)
  - `CLAUDE.md`: naye rules — money paise mein, writes sirf commands se, `systemDb` allowlist, aur naye model ka registry mein hona
  - `src/server/CLAUDE.md`

## Exit gate (Stage 1 ke gate mein jodna)
- [ ] Abhi ke saare writes commands se chalte hain. `mutations.ts` aur `actions/*` mein koi business logic nahi bacha
- [ ] Ek hi error model, aur sync ke `retry` codes se
- [ ] `new Date()`/`Date.now()` aur `systemDb` ke lint rules on
- [ ] Billing paise mein, purane totals ke barabar (property test)
- [ ] Har form submit idempotent (double-submit test)
- [ ] `DATA_POLICY` saare models cover karta hai (typecheck), aur export completeness test pass
- [ ] Scoped DB on, aur dusre org ki id dene par `notFound`
- [ ] Entitlements, settings, cache tags aur host resolver ke skeletons merged, bina behaviour change ke
- [ ] Client bundle mein sirf `runtime` i18n namespace
- [ ] Hindi/English naam search
- [ ] Customer/plan edit par version check, aur outbox par Background Sync

## Verification
- **Unit:**
  - `scopeArgs`: har operation, mismatch par throw, aur unique `where` mein inject
  - money: `toPaise` ke float cases, `splitPaise`, `parseMoneyInput` (commas, Devanagari digits)
  - format snapshots, en + hi dono mein
  - error mapping: har code → FormState, SyncResult aur HTTP
  - `resolveEntitlements`, settings ke defaults aur galat stored value
  - `resolveHost`, importer ka header mapping aur Devanagari digits
- **Integration** (production-readiness ka harness):
  - **Parity:** migration se pehle aur baad ke flow tests same result dein (payments, delivery, wastage, skip cutoff, settings, staff).
  - **Double submit:** ek hi `$idem` ke saath do `customer.save` ek saath → sirf 1 customer, aur dono ko same redirect id.
  - **Sync replay:** same `opId` dobara bhejo → ek hi row.
  - **Tenant:** org A ke `ctx.db` se org B ka customer `findUnique` → `null`, aur explicit `orgId: B` → `TenantViolation`.
  - **Actor:** customer actor `payment.record` bulaye → `forbidden`.
  - **Entitlements:** test org ka `planKey` aisa rakho jisme customers ki limit 2 ho → teesra customer banao → `limitReached`, Hindi message ke saath.
  - **Clock:** `withClock("…T21:01+05:30")` → kal ka skip mana ho, aur `20:59` par ho jaaye.
- **Build checks:**
  - ek naya Prisma model banao par registry mein mat jodo → `npm run typecheck` fail ho
  - `src/server` mein `new Date()` likho → `npm run lint` fail ho
- **i18n:** ek key sirf `en` mein jodo → typecheck fail ho. Client bundle report mein sirf `runtime` namespace dikhe.
- **Search:** "रमेश" likhne par "Ramesh" mile, "puja" likhne par "Pooja" mile, aur aakhri 4 digits se phone mile.
- **Concurrency:** do tabs mein ek hi customer kholo, pehle mein save karo, phir doosre mein save karo → `editedByOther` message aaye aur data na mite.
- **Background Sync:** offline mein tick karo, app band karo, net on karo (app band hi rakho) → server par row ban jaaye (Android Chrome/TWA par).
- **E2E:** production-readiness ke 8 flows bina badlav ke pass hon.
- **Har phase:** `npm test && npm run typecheck && npm run lint`, phir `npm run changeset:status`. Phase 1 refactor hai, isliye changeset ki zaroorat nahi. Jahan user-visible badlav ho (jaise "limit" message), wahan changeset.
