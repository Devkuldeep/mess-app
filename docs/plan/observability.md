# Observability plan: analytics, reporting, logging aur auditing

> Roles aur permissions ka plan (Phase 0) alag file mein hai: `docs/plan/roles-permissions.md`.
> Commands (`execute`) ka plan `docs/plan/platform-foundations.md` mein hai. Logging (`withAction`), audit ka flush aur `track()` usi ke hooks mein lagte hain, aur `redact()` ke saath retention bhi wahan ke `DATA_POLICY` registry se aati hai.

## Context
Abhi app mein in chaaron mein se lagbhag kuch nahi hai:
- **Logging:** sirf 2 jagah `console.error` hai.
- **Audit:** koi audit log nahi hai.
- **Analytics:** koi analytics nahi hai.
- **Reporting:** sirf `/wastage/report` hai.

Iska matlab owner ko pata nahi chalta ki kisne payment delete kiya. Hamein production errors nahi dikhte, cron fail ho jaaye to kisi ko khabar nahi hoti, aur saare messes ka usage hum dekh nahi sakte.

Plan **chaar levels** ka hai, aur sab ek hi foundation par bante hain:

| Level | Kiske liye | Sawal jiska jawab deta hai |
|---|---|---|
| A. Tech logging & monitoring | Hum (developers) | "Kya toota, kab, kis request mein?" |
| B. Audit log | Owner (aur support) | "Kisne kya badla, pehle kya tha?" |
| C. Owner reports & analytics | Owner/manager | "Kamai, dues, skips, churn, peak days?" |
| D. Product & platform analytics | Super Admin (baad mein Reseller) | "Kitne mess active hain, kaun sa feature use ho raha hai?" |

**Faisle (user ke chune hue):**
- **Postgres-first + pluggable.** Shuru mein koi nayi dependency ya vendor nahi. Har output ek `Sink` interface ke peeche hoga, taaki baad mein Sentry, PostHog, OpenTelemetry, ClickHouse ya Vercel Queues sirf env var se jod sakein aur app code na badle.
- **Charaon levels design honge** aur phases mein build honge.
- **Dependency:** roles aur permissions plan (Phase 0) pehle ya saath mein. Audit ko actor aur role chahiye. Reports aur Activity ke liye nayi permissions chahiye, aur `/admin` ke liye `requirePlatform`.

## Design ke 6 sidhant (aage scale karne ke liye)
1. **Teen alag streams, teen alag tables.** Logs (ops ke liye, jaldi expire) ≠ Audit (legal record, append-only, transactional) ≠ Analytics events (product ke liye, sampled ho sakta hai, async). Inhe mix karne se baad mein migrate karna mushkil hota hai.
2. **Catalogue-driven.** Har audit action aur analytics event ek typed catalogue mein declared hoga, `src/lib/*` mein, zod se aur i18n labels ke saath. Free-form strings nahi hongi. Naya event jodne ka matlab ek entry aur ek test.
3. **Business data derived rahega.** CLAUDE.md rule #3 ke hisaab se reports operational tables se aate hain. Rollups sirf cache hain aur kabhi bhi dobara compute ho sakte hain. Kabhi bhi source of truth nahi.
4. **Tenant isolation har level par.** Audit, analytics aur rollups, sabme `orgId`. Platform level sirf aggregates padhega, kisi org ki rows nahi.
5. **Privacy by default.** Ek central `redact()` hai. Logs aur analytics mein phone, naam, token aur password nahi jaayenge. Audit mein sirf zaroori fields ka diff jaayega. Retention periods tay hain (DPDP Act, privacy page update).
6. **Hot path par bojh nahi.** Analytics aur logs response ke baad `after()` se likhe jaayenge (Next 16, `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md`). Sirf audit usi transaction mein likha jaayega, kyunki paisa aur permission ke records kabhi miss nahi hone chahiye.

---

## Level A: Tech logging & monitoring

**Naye files:**
- `src/lib/log-format.ts` (pure, tested):
  - `redact(obj)`: in keys ko mask karta hai: `phone`, `password`, `*Token`, `*Secret`, `*Pin`, `refreshTokenEnc` aur `authorization`, aur 10-digit numbers ko bhi.
  - `formatLogLine(level, msg, fields)` → ek JSON line.
  - Level filter `LOG_LEVEL`.
- `src/server/obs/context.ts`: `AsyncLocalStorage<{ requestId, orgId?, userId?, role?, route, source }>`. `getMember()` milte hi `orgId`, `userId` aur `role` context mein jud jaate hain.
- `src/server/obs/log.ts`: `log.debug/info/warn/error(msg, fields)`. Context apne aap jud jaata hai, phir output `sinks` ko jaata hai.
- `src/server/obs/sinks.ts`: `interface LogSink { write(line) }`.
  - Default sink `console` (stdout JSON), jise Vercel, Docker aur VPS teeno padh lete hain.
  - Baad ke adapters (env se on): `sentry`, `otel`, `vercel-metrics`. Har adapter ek file, aur core code nahi badlega.
- `src/server/obs/timed.ts`: `withAction(name, fn)` wrapper Server Actions aur API handlers ke liye. Ye duration, outcome aur error ko log karta hai, aur `"forbidden"`/validation ko `warn` level par, crash ko `error` par rakhta hai.
- `src/instrumentation.ts`: `register()` sinks init karta hai, aur `onRequestError` har server error ko `log.error` mein route aur requestId ke saath bhejta hai. Docs: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md`.

**Request ID:** `src/proxy.ts` aane wale `x-request-id` ko rakhta hai ya naya banata hai, aur response header mein bhi lautata hai. Isse user ka screenshot ya support call seedha log line tak le jaata hai.

**Slow queries:** `src/server/db.ts` mein Prisma `$extends` query timing extension. `SLOW_QUERY_MS` (default 500) se upar wali query ka model aur action `warn` mein jaayega, params nahi.

**Background jobs:**
- Naya `JobRun` model: `id, name, startedAt, finishedAt, status (ok | partial | failed), summary Json, error String?`.
- Helper `runJob(name, fn)` `src/server/obs/jobs.ts` mein.
- `api/cron/drive-backup` aur aage aane wale saare cron isi se chalenge.

**Health:**
- `GET /api/health`: DB ping aur last JobRun ki umar, jawab `200` ya `503`, `no-store`. Uptime monitor (UptimeRobot, BetterStack) ke liye.
- `GET /api/cron/watchdog`, din mein ek baar. Ye check karta hai:
  - koi job 26 ghante se nahi chala
  - pichhle din `log.error` ya sync failures ki ginti threshold se upar hai
  - provider ka kharcha (WhatsApp, SMS, email), DB ka size ya storage budget se upar hai (budgets env mein)

  Gadbad ho to `ALERT_WEBHOOK_URL` par alert jaata hai (Slack, Discord, Telegram ya email-relay webhook, pluggable).
- Error counts ke liye `ErrorDigest` table rakhenge (`day, fingerprint, route, count, lastMessage`). `log.error` ise `after()` se upsert karega, taaki bina vendor ke "top errors" dikh sakein. Sentry adapter aane par ise hata sakte hain.

**Client errors:** `src/app/(app)/error.tsx` aur global error boundary `POST /api/events` par `client_error` bhejenge (redacted, rate-limited: har device ke liye 10 per minute).

**Sync observability:** `/api/sync` har batch ke liye ek log line likhega: op counts by kind, ok, retry aur forbidden counts, aur duration. Rejected ops ka `kind` aur error, payload nahi.

---

## Level B: Audit log (kisne kya badla)

**Schema** (`prisma/schema/audit.prisma`, naya):
```prisma
model AuditLog {
  id          String   @id @default(uuid(7)) @db.Uuid   // time-ordered
  orgId       String?  @db.Uuid      // null = account-level (login etc.)
  actorKind   String                 // user | customer | system | support
  actorId     String?  @db.Uuid      // userId / customerId
  actorName   String?                // snapshot (user delete ho jaaye tab bhi padhne layak)
  actorRole   String?                // snapshot: owner/manager/delivery
  action      String                 // catalogue key, e.g. "payment.delete"
  entityType  String                 // customer | payment | plan | member | org ...
  entityId    String?
  changes     Json?                  // { field: [before, after] } — redacted, only changed fields
  meta        Json?                  // e.g. { amount, customerName } for readable rows
  source      String                 // web | sync | portal | cron | api
  requestId   String?
  createdAt   DateTime @default(now())
  @@index([orgId, createdAt(sort: Desc)])
  @@index([orgId, entityType, entityId])
}
```
- **Append-only.** Ek migration mein Postgres trigger hoga jo `UPDATE` aur `DELETE` ko rok dega. Retention job ek alag DB role se purge karega.
- Org delete hone par audit rows ke `actorName` aur `meta` ki PII hata di jaayegi (DPDP), aur `action`, `entity` aur `time` bache rahenge.

**Catalogue:** `src/lib/audit.ts` (pure, tested).
- `AUDIT_ACTIONS`: har action ke `entityType`, tracked fields ki allowlist aur i18n key `audit_<action>`.
- `diffFields(before, after, allow)` → `changes`.
- `describeAudit(row, t)`: Hindi/English sentence, jaise "रमेश ने ₹500 का भुगतान हटाया (सुनीता)".

**Kya audit hoga:**

| Area | Actions |
|---|---|
| Paisa | `payment.record`, `payment.delete` |
| Customers | `customer.create`, `customer.update`, `customer.stop`, `customer.resume`, `customer.link_reset` |
| Customer portal | `skip.add`, `skip.remove` (actorKind=customer) |
| Setup | `plan.*`, `dish.*`, `holiday.*`, `org.update` |
| Wastage | `wastage.save` (replace hota hai, isliye pichhla total `changes` mein) |
| Team | `invite.create`, `invite.cancel`, `member.join`, `member.role_change`, `member.permissions_change`, `member.remove` |
| Data/security | `export.download`, `drive.connect`, `drive.disconnect`, `auth.login`, `auth.login_failed`, `auth.logout` |

**Kya audit nahi hoga:** har delivery tick. Bahut zyada volume hai, aur `Delivery.deliveredBy` aur `deliveredAt` pehle se record hai. Sirf delivery ko *undo* karna audit hoga.

**Kaise likhenge:** `src/server/audit.ts` mein `audit(tx, ctx, { action, entityType, entityId, before?, after?, meta? })`.
- Ye **mutation ki same transaction** mein chalega. Commands ke `run` mein `record()` likha jaata hai, aur `execute` use usi transaction mein flush karta hai ([platform-foundations.md](platform-foundations.md) §5). Isliye har action ko alag se lapetna nahi padega.
- Sync replay mein `source: "sync"` aur device ka op time (`at`) `meta` mein jaayega.

**UI:**
- `/more/activity`: permission `audit.view`, owner ke paas default, manager ko grantable.
- `List` aur `ListItem` mein din ke hisaab se group, aur actor, entity type aur date range ke filters URL params mein.
- Customer ke page par "History" section, jo sirf us entity ki rows dikhata hai.
- Pagination cursor `id` (uuid v7) se.

**Export:** `src/server/export.ts` mein `audit.csv` (CLAUDE.md rule: naya tenant table matlab export mein bhi).

**Retention:** default 2 saal (`AUDIT_RETENTION_DAYS`). Baad mein premium plan par zyada.

---

## Level C: Owner reports & analytics

**Sidhant:** reports operational data se derived hain. Speed ke liye **rollup cache** hai, source of truth nahi.

**Rollup table** (`prisma/schema/reports.prisma`):
```prisma
model DailyOrgStat {
  orgId String @db.Uuid
  date  DateTime @db.Date
  // meals
  scheduledLunch Int  scheduledDinner Int  skipped Int  lateSkips Int  holidays Boolean
  delivered Int  undelivered Int
  // money (paise, Int)
  billed Int  collected Int
  // customers
  activeCustomers Int  newCustomers Int  stoppedCustomers Int
  // wastage
  wastedKg Float?  wasteLoss Int?  wastePct Float?
  computedAt DateTime @default(now())
  version Int                        // formula version → bump = recompute
  @@id([orgId, date])
}
```
- **Pure compute:** `src/lib/reports/daily.ts` mein `computeDailyStat(input)`. Ye `scheduledMeals`/`billing` (`src/lib/schedule.ts`) aur `wastageReport` (`src/lib/wastage.ts`) ko reuse karta hai, duplicate logic nahi.
- **Nightly job:** `GET /api/cron/rollups` (`runJob`). Har org ke **pichhle 35 din** dobara compute karta hai, kyunki skip ya plan price badalne se history re-price hoti hai (CLAUDE.md rule #3).
- **Upsert, aur `version` mismatch par recompute.** Aaj ka din hamesha live compute hoga.
- Bada mess ya bahut saare orgs hon to job org-by-org batches mein chalega. Baad mein Vercel Queues/Workflow adapter mein jaayega aur interface same rahega.

**Report catalogue** (`src/lib/reports/catalogue.ts`; har report = `{ key, perm, range options, compute, columns }`):

| Report | Data | Kahan se |
|---|---|---|
| Summary (aaj, hafta, mahina) | orders, skips, wastage, kamai, collection | rollup + live |
| Revenue & dues | billed vs collected trend, top dues, ageing (0–30/30–60/60+) | `getBilling`, payments |
| Skips & cutoff | skip rate, peak skip days, aakhri ghante ke skips (`Skip.createdAt` vs cutoff) | Skip |
| Customer insights | regulars, high-skip, churn risk (score: skip trend, unpaid dues, ending soon) | pure `src/lib/reports/churn.ts` |
| Peak & slow days | weekday ke hisaab se avg tiffins | rollup |
| Delivery | delivery % aur avg delivery time per meal, staff-wise ginti | Delivery |
| Wastage | `/wastage/report` jo hai woh, ab hub mein | as-is |
| Profit (baad mein) | kamai − kharche (expense tracker aane par) | n/a |

**UI:**
- Naya `/reports` hub, permission `reports.view` (owner default, manager ko grantable): `StatCard` grid + `Card href` per report → `/reports/[key]?range=7|30|90|month`.
- Tables `DataTable` (`total`, `format: money`) mein hongi.
- **Charts:** naye UI lib allowed nahi hain, isliye `src/components/ui/charts/` mein chhote SVG components (`LineChart`, `BarChart`, `Sparkline`). Ye server-renderable, accessible (`<title>`, table fallback), theme tokens wale aur `/dev/charts` gallery ke saath honge.
- More menu ka "Reports" section `/reports` par point karega.
- **Download:**
  - CSV per report `src/lib/csv.ts` reuse karke (`GET /api/reports/[key].csv`, permission check).
  - PDF ke liye print stylesheet (`@media print` in `@layer components`) aur "Print / Save PDF" button, nayi dependency nahi.
- **Offline:** reports online-only hain. SW cached page dikhayega aur "last updated" time ke saath.

---

## Level D: Product & platform analytics (Super Admin, baad mein Reseller)

**Event schema** (`prisma/schema/analytics.prisma`):
```prisma
model AnalyticsEvent {
  id         String   @id @default(uuid(7)) @db.Uuid
  name       String                 // catalogue key
  v          Int      @default(1)   // schema version of props
  orgId      String?  @db.Uuid
  userId     String?  @db.Uuid      // staff only; never customer identity
  sessionHash String?               // daily-rotating hash, no raw ids from client
  props      Json?                  // validated, PII-free
  source     String                 // server | client
  occurredAt DateTime @default(now())
  @@index([name, occurredAt])
  @@index([orgId, occurredAt])
}
```
- **Catalogue:** `src/lib/analytics-events.ts`, har event ka zod props schema. Ek test check karega ki kisi bhi schema mein `phone`, `name` ya `token` jaise keys na hon.
- **Server events** `track(name, props)` (`src/server/obs/track.ts`, `after()` se) business actions par:
  - `org.created`, `customer.created`
  - `payment.recorded` (amount bucket, exact nahi)
  - `wastage.saved`, `skip.added`, `invite.sent`
  - `report.viewed`, `export.downloaded`, `drive.connected`
- **Client events:** `POST /api/events` (JSON-only, batched, `sendBeacon`, rate-limited). Sirf woh jo server nahi dekh sakta:
  - `pwa.installed`, `app.opened_offline`, `outbox.flushed` (count, wait time)
  - `screen.viewed` (route pattern, ids nahi)
  - `client_error`
- **Sink:** default `postgres`. Baad mein `posthog` ya `clickhouse` adapter, ya dual-write. App code sirf `track()` jaanta hai.

**Platform rollup:** `PlatformDailyStat (date, metric, dimension, value)` long format, jisme naya metric jodne ke liye migration nahi chahiye. Nightly `/api/cron/rollups` hi bharega:
- active orgs (pichhle 7 din mein koi action), total customers, tiffins/day
- staff DAU/WAU
- feature adoption % (wastage, drive, staff invites, reports)
- sync failure rate, backup success rate, error counts (Level A se)
- signup → first customer → first payment funnel
- **har org ka kharcha bata uski kamai** = per-org margin. Kharche mein messages ka asli cost (`NotificationDelivery.costPaise`), storage (MB), DB rows/size ka andaaza aur jobs ki ginti. Ghaate wale orgs ki list, taaki ₹299 ka plan ghaate mein na jaaye

**UI:** `/admin` route group, `requirePlatform("platform.analytics")` ke saath (permissions plan ka section 7: `User.platformRole`).
- Dashboard `StatCard` aur charts ke saath, org list mein sirf metadata (naam, plan, created, last active, health).
- **Customer data kabhi nahi dikhega.** Kisi org ke andar dekhne ke liye audited support session (`actorKind: support`) chahiye.

**Reseller (baad mein):** same `PlatformDailyStat`, filter `Org.resellerId`. Sirf apne messes ke aggregates dikhenge.

**Benchmarking (baad mein):** "Aapke area ka avg wastage" sirf tab dikhega jab bucket mein **≥ 5 orgs** hon (k-anonymity), aur ye rollups se aayega.

**Retention:** raw `AnalyticsEvent` 180 din (`ANALYTICS_RETENTION_DAYS`) ke baad purge hoga. Rollups hamesha rahenge.

---

## Permissions integration (Phase 0 plan mein jodna)

| Permission | Owner | Manager default | Grantable |
|---|---|---|---|
| `reports.view` | ✓ | ✗ | ✓ |
| `reports.export` | ✓ | ✗ | ✓ (needs `reports.view`) |
| `audit.view` | ✓ | ✗ | ✓ |
| Platform: `platform.analytics`, `platform.orgs.view`, `platform.support_session` | n/a | n/a | sirf `User.platformRole` se |

---

## Scale karne ka raasta (bina redesign)

| Jab | Kya karenge | Code change |
|---|---|---|
| Logs ko search karna ho | Sentry, OTel ya Axiom sink on karo | sirf env aur adapter file |
| `AuditLog` / `AnalyticsEvent` > ~10M rows | Monthly range partitioning (`createdAt`), BRIN index | migration only |
| Analytics queries DB ko slow karein | Sink ko ClickHouse/PostHog par shift karo, ya Postgres read replica | adapter + rollup job source |
| Rollup job 5 min se lamba ho | Per-org Vercel Queue messages ya Workflow | `runJob` ke andar |
| Real-time dashboards | Event par incremental rollup update | `track()` hook |

---

## Phases (build order)

0. **Roles & permissions** (`docs/plan/roles-permissions.md`), upar wali nayi permissions ke saath.
1. **Foundation (Level A).** `log-format`, obs context, log, sinks, `withAction`, `instrumentation.ts`, request ID, slow query, `JobRun` + `runJob`, `/api/health`, watchdog, `ErrorDigest`, client error endpoint. Saare current `console.*` aur cron isme migrate.
2. **Audit (Level B).** Schema + trigger, catalogue, `audit()`, mutations ko transactions mein, `/more/activity`, customer History, export, retention job.
3. **Owner reports (Level C).** `DailyOrgStat` + compute + cron, SVG charts + `/dev/charts`, `/reports` hub aur reports, CSV/print.
4. **Analytics & admin (Level D).** `AnalyticsEvent` + catalogue + `track()` + `/api/events`, `PlatformDailyStat`, `/admin`.
5. **Adapters & scale** (zaroorat par). Sentry/OTel/PostHog sinks, alerts channels, partitioning.

**Har phase mein:**
- naye strings `en` + `hi` mein (`src/lib/i18n.ts`)
- pure logic `src/lib` mein `node --test` ke saath
- user-visible phase par changeset (minor)
- `CLAUDE.md` mein naya "Observability" section, aur `src/server/CLAUDE.md` checklist mein "har mutation par `audit()`"
- privacy page mein logs, analytics aur retention (`src/lib/business.ts` / `(public)/privacy`), aur lawyer review note

## Critical files
- **New:**
  - `src/lib/log-format.ts`, `src/lib/audit.ts`, `src/lib/analytics-events.ts`, `src/lib/reports/*`
  - `src/server/obs/*`, `src/server/audit.ts`, `src/instrumentation.ts`
  - `prisma/schema/{audit,reports,analytics,ops}.prisma`
  - `src/components/ui/charts/*`
  - `src/app/(app)/reports/*`, `src/app/(app)/more/activity/*`, `src/app/admin/*`
  - `src/app/api/{health,events,cron/rollups,cron/watchdog}`
- **Modified:**
  - `src/proxy.ts` (request ID), `src/server/db.ts` (timing extension), `src/server/auth.ts` (context enrich)
  - `src/server/mutations.ts`, `src/app/actions/*.ts` (audit + transactions + `withAction`)
  - `src/app/api/sync/route.ts`, `src/app/api/cron/drive-backup/route.ts`
  - `src/server/export.ts`, `src/app/(app)/more/page.tsx`, `vercel.json` (naye schedules)
- **Reuse (dobara mat likhna):**
  - `scheduledMeals`/`billing` (`src/lib/schedule.ts`), `wastageReport` (`src/lib/wastage.ts`), `getBilling` (`src/server/data.ts`)
  - `toCsv` (`src/lib/csv.ts`), `DataTable`/`StatCard`/`List` (`@/components/ui`), cron auth pattern (`api/cron/drive-backup`)

## Verification
- **Unit tests:**
  - `redact` ke saare PII cases
  - `diffFields`/`describeAudit`
  - analytics catalogue mein PII-key ban
  - `computeDailyStat` ka live `getBilling` se match, fixture data par
  - churn score
  - chart scale helpers
- **Phase 1:**
  - `npm run build && npm start`. Ek error wala action chalao: stdout mein ek JSON line aaye jisme requestId, orgId aur route ho, aur phone redacted ho.
  - Response header mein wahi `x-request-id`.
  - `/api/health` → 200. DB band karo → 503.
  - Watchdog ko purane `JobRun` ke saath chalao → webhook call (local fake URL).
- **Phase 2:**
  - Seed owner se payment record + delete karo, phir manager se customer edit karo. `/more/activity` mein Hindi sentences sahi actor ke saath dikhein.
  - psql `UPDATE "AuditLog"` fail ho.
  - Offline payment sync → `source: sync`.
  - Manager bina `audit.view` ke `/more/activity` → redirect.
  - Export ZIP mein `audit.csv`.
- **Phase 3:**
  - `/api/cron/rollups` chalao, `DailyOrgStat` rows bane, aur revenue report ka total `/payments` billing se match kare.
  - Plan price badlo, rollup dobara chalao, numbers update hon.
  - CSV Excel mein Hindi sahi dikhe (BOM).
  - Print preview A4 mein theek ho.
- **Phase 4:**
  - Actions karo → `AnalyticsEvent` rows bina PII ke.
  - `/api/events` par junk ya bade batch par 400, aur rate limit par 429.
  - `/admin` normal owner ke liye 404 ya redirect, aur platformRole wale user ke liye aggregates.
- **Har phase:** `npm test && npm run typecheck && npm run lint`, phir `npm run changeset:status`.
