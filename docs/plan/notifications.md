# Event + Notification foundation plan

> Ye plan in plans ke saath judta hai:
> - `docs/plan/roles-permissions.md`: permissions
> - `docs/plan/observability.md`: logs, audit, analytics
> - `docs/plan/business-growth.md`: dues, leads aur stock alerts
> - `docs/plan/platform-foundations.md`: `emit()` command ke `run` se aata hai (usi transaction mein), jobs `system` actor se chalte hain, aur settings registry hai

## Context
Aage chal kar app ko mazboot notifications chahiye, aur kai channels par:
- WhatsApp
- app/web push (Android TWA app bhi web push hi use karta hai)
- email
- baad mein SMS

Ye teen tarah ke logon ko jaayengi:
- **Owner aur staff:** headcount, late skip, dues, stock kam, backup fail.
- **Customers:** bill, receipt, holiday, skip confirm. Customers ke paas sirf phone hai aur login nahi hai.
- **Platform (aap):** signup, subscription fail, at-risk org.

Abhi app mein notification ka koi system nahi hai. Bas `src/lib/links.ts` mein `wa.me` click-to-chat link hai.

**User ke faisle:**
1. Teeno recipients ke liye.
2. WhatsApp ek **adapter** ke peeche rahega. Pehla adapter Meta Cloud API ka hoga, aur BSPs (Gupshup, AiSensy, Interakt) baad mein judenge.
3. **Queue ya runner platform-agnostic ho.** Vercel Hobby, Vercel Pro, Docker, VPS, Vercel Queues, BullMQ ya QStash, kahin bhi chale. Platform badalna ho to sirf env var badle, code ya data nahi.

## Sidhant
1. **Postgres hi source of truth.** Har event, job aur delivery DB mein likhi jaati hai. Queue ya cron sirf worker ko *jagaate* hain. Isliye runner badalne par data migrate nahi karna padega.
2. **Transactional outbox.** Business write aur uska `DomainEvent` ek hi transaction mein likhe jaate hain. Isse "payment save hua par notification gaya hi nahi" kabhi nahi hoga.
3. **Ek event, kai subscribers.** Ek hi `DomainEvent` teen jagah kaam aata hai: notifications, analytics (`track`) aur, baad mein, outgoing webhooks/integrations. Observability plan ka audit apni jagah transactional hi rahega.
4. **Catalogue-driven.** Saare notification types, unke templates aur channels code mein typed declare honge, en aur hi dono mein. Naya notification jodne ka matlab: ek catalogue entry, uske templates aur ek test.
5. **Channel adapters.** `ChannelProvider` interface rahega. Fake, Meta, Resend, SMTP, MSG91 ya FCM, har provider apni ek file mein. Kaunsa provider chalega ye env ya org config se tay hoga.
6. **Consent, preferences aur paisa.** Customers ko WhatsApp/SMS sirf opt-in ke baad jaayega (Meta policy, DPDP, TRAI DLT). Quiet hours, preferences aur har plan ka quota pipeline ke andar hi check honge.
7. **Har step idempotent.** Har step par ek idempotency key hogi aur retries mein backoff hoga. Har jagah at-least-once delivery hai, isliye duplicate rokna zaroori hai.

---

## Architecture (ek nazar mein)
```
Server Action / sync op / cron
   └─ tx: business write + emit(DomainEvent)            ← same transaction
        └─ after(): wake()                              ← driver-specific
Worker drain (kisi bhi driver se):
   DomainEvent → subscribers (rules) → Notification (per recipient, idem key)
      → policy (prefs, consent, quiet hours, quota, collapse)
      → channel plan (push → whatsapp → sms → email, fallback)
      → Delivery job per channel → render template (lang) → Provider.send()
      → status: sent / delivered / read / failed  (provider webhooks update)
      → retry with backoff / dead-letter / fallback channel
```

---

## 1. Job foundation (platform-agnostic runner)

**Schema** `prisma/schema/jobs.prisma`:
```prisma
model Job {
  id          String   @id @default(uuid(7)) @db.Uuid
  queue       String                  // "events" | "notify.deliver" | "notify.schedule" | ...
  payload     Json
  key         String?  @unique        // idempotency (e.g. "notify:<notifId>:whatsapp")
  status      JobStatus @default(queued) // queued | running | done | failed | dead
  runAt       DateTime @default(now())
  attempts    Int      @default(0)
  maxAttempts Int      @default(6)
  lockedUntil DateTime?
  lastError   String?
  createdAt   DateTime @default(now())
  finishedAt  DateTime?
  @@index([status, runAt])
}
```

**Core** `src/server/jobs/`:
- `enqueue(queue, payload, { runAt?, key?, tx? })`
- `defineJob(queue, handler, { maxAttempts, backoff })`
- `drain({ limit, timeBudgetMs })`, jo jobs ko `UPDATE … WHERE id IN (SELECT … FOR UPDATE SKIP LOCKED LIMIT n) RETURNING *` (`$queryRaw`) se claim karta hai. Isse kai workers ek saath bhi safe chalte hain.
- Agar `lockedUntil` nikal gaya ho to job dobara claim ho jaayega, yaani crash ke baad recovery apne aap hoti hai.
- Backoff ka pure logic `src/lib/backoff.ts` mein hoga (tested): exponential + jitter, jaise 30s, 2m, 10m, 1h, 6h.

**Drivers**: sirf ye tay karte hain ki worker ko *kaun jagaata hai*. Env `JOB_DRIVER` hai, aur ek saath kai driver chal sakte hain (comma-separated):

| Driver | Kaise | Kahan |
|---|---|---|
| `inline` (default) | enqueue ke baad `after(() => drain({limit:20}))` | Har jagah, Hobby par bhi; turant bhejna |
| `tick` | `GET/POST /api/jobs/tick` (`Authorization: Bearer $CRON_SECRET`) → drain + due schedules | Koi bhi scheduler: Vercel Pro cron (har minute), VPS crontab, GitHub Actions, cron-job.org, Upstash QStash schedule |
| `worker` | `npm run worker`, ek long-running loop + Postgres `LISTEN jobs` / `NOTIFY` (instant) | Docker compose `worker` service, VPS systemd, Vercel Daemon |
| `vercel-queue` | enqueue par wake message → consumer route `drain()` chalata hai | Vercel Queues |
| `qstash` / `bullmq` | baad mein adapter files | Upstash / Redis |

- **Driver ka contract:** `interface Waker { wake(queue): Promise<void> }`. Har driver ek file `src/server/jobs/drivers/*.ts` mein hoga.
- **Hobby fallback:** `inline` turant bhejta hai, aur jo retry ya scheduled job reh jaaye woh agle tick par ya agli request par (`after()` mein `drain` ke saath sasta "due jobs" check) nikal jaata hai.
- **Purane jobs ko bhi isi par laayenge:** `drive-backup`, observability ke `rollups` aur `watchdog` bhi `defineJob` + schedules par shift honge. `vercel.json` mein sirf ek tick schedule rahega.
- **Schedules:** code mein `defineSchedule("dues.reminder", { cron, tz: "org" })` likhenge.
  - Tick par worker har org ka timezone dekh kar due schedules ke jobs enqueue karta hai.
  - Key `sched:<name>:<orgId>:<localDate>` hai, isliye ek din mein ek hi baar chalta hai.
  - Cron ka pure helper `src/lib/cron.ts` mein hoga (tested).

## 2. Domain events (transactional outbox)

**Schema**:
```prisma
model DomainEvent {
  id String @id @default(uuid(7)) @db.Uuid
  orgId String? @db.Uuid
  type String              // catalogue key: "payment.recorded"
  v Int @default(1)
  actor Json?              // { kind, id, role }
  data Json                // ids + minimal fields; no secrets
  occurredAt DateTime @default(now())
  processedAt DateTime?
  @@index([processedAt, occurredAt])
}
```
- **Catalogue:** `src/lib/events.ts` (pure). Har event ke liye ek zod schema hoga. Pehla set:
  - `payment.recorded`, `payment.deleted`
  - `customer.created`, `customer.stopped`
  - `skip.added` (customer, late flag ke saath)
  - `holiday.added`
  - `delivery.missed`
  - `wastage.saved`
  - `invite.created`, `member.joined`
  - `drive.backup_failed`
  - `stock.low`, `dues.overdue` (ye dono scheduled hain)
  - `org.signed_up`, `subscription.payment_failed`
- **Likhna:** `emit(tx, ctx, type, data)` (`src/server/events.ts`) mutation ke transaction mein event likhta hai aur ek `events` job enqueue karta hai.
  - Server Actions, `src/server/mutations.ts` (sync), `actions/portal.ts` aur cron, sab isi ko call karenge.
  - Observability plan mein jo writes transaction mein lapetne the, unhi mein `emit` bhi chalega.
- **Subscribers:** `src/server/events/subscribers.ts` mein `on("payment.recorded", handler)`. Pehle subscribers:
  - notification rules
  - `track()` analytics
  - aage chal kar webhooks/integrations

  Har subscriber ka handler idempotent hona chahiye, key `evt:<eventId>:<subscriber>`.
- **Retention:** processed events 30 din baad purge honge (ye bhi ek scheduled job).

## 3. Notification model

**Catalogue:** `src/lib/notifications/catalogue.ts` (pure, tested). Har type ka shape:
```ts
{ type: "dues.reminder", audience: "customer", category: "billing",
  channels: ["whatsapp", "sms", "inapp"],          // priority order = fallback
  critical: false, collapse: { key: "dues:<customerId>", windowMin: 1440 },
  quietHours: true, whatsappTemplate: { en: "dues_reminder_en", hi: "dues_reminder_hi" },
  vars: z.object({ amount, month, upiLink, portalUrl }) }
```

**Pehla set:**

| Audience | Types |
|---|---|
| Owner/staff | `today.headcount` (cutoff ke baad: kal kitne tiffin), `skip.late`, `payment.received`, `dues.summary` (weekly), `stock.low`, `lead.followup_due`, `delivery.pending` (meal time ke 1 ghante baad), `backup.failed`, `member.joined`, `sync.ops_rejected` |
| Customer | `payment.receipt`, `dues.reminder`, `bill.monthly`, `holiday.notice`, `skip.confirmed`, `plan.ending`, `welcome` (portal link), `menu.tomorrow` (baad mein) |
| Platform | `platform.org_signed_up`, `platform.subscription_failed`, `platform.org_at_risk`, `platform.alert` (observability watchdog yahan aayega) |
| Auth (sabke liye) | `auth.otp`: signup, reset aur phone badalne ka code. `critical` hai (quiet hours ignore), collapse nahi hota, 5 min mein expire, body mein sirf code aur app ka naam. Channels: whatsapp → sms. Production-readiness §2f aur M-VERIFY |

**Schema** `prisma/schema/notifications.prisma`:
```prisma
model Notification {          // one per recipient per occurrence (= in-app inbox row)
  id String @id @default(uuid(7)) @db.Uuid
  orgId String? @db.Uuid
  type String  category String
  recipientKind String        // user | customer | platform
  userId String? @db.Uuid  customerId String? @db.Uuid
  key String @unique          // idempotency: "<type>:<recipient>:<occurrence>"
  vars Json                   // template variables (rendered per channel/lang at send time)
  url String?                 // deep link
  eventId String? @db.Uuid
  readAt DateTime?  createdAt DateTime @default(now())
  @@index([userId, createdAt(sort: Desc)])  @@index([orgId, createdAt])
}
model NotificationDelivery {  // one per channel attempt chain
  id String @id @default(uuid(7)) @db.Uuid
  notificationId String @db.Uuid  orgId String? @db.Uuid
  channel String              // inapp | webpush | email | whatsapp | sms | manual
  provider String             // fake | meta | resend | smtp | msg91 ...
  to String                   // masked in UI/logs; endpoint/email/phone
  status String               // queued | sent | delivered | read | failed | skipped
  skipReason String?          // no_consent | quiet_hours | quota | pref_off | no_address
  providerMessageId String?  attempts Int @default(0)  error String?  costPaise Int?
  createdAt DateTime @default(now())  updatedAt DateTime @updatedAt
  @@index([notificationId])  @@index([provider, providerMessageId])  @@index([orgId, createdAt])
}
```

**Contact points aur consent:**
- `PushSubscription`: `id, endpoint @unique, p256dh, auth, userId?, customerId?, orgId, userAgent, createdAt, lastSeenAt`. Agar provider 404 ya 410 lautaye to subscription delete ho jaayegi.
- `User` mein `email?`, `emailVerifiedAt?` aur `lang` judenge. Email verify karne ke liye signed link bhejenge.
- `Customer` mein ye judenge:
  - `whatsappOptIn`, `optInAt`, `optInSource` (portal | owner_confirmed | reply)
  - `smsOptIn`, `lang` (default org ki language)
  - `optedOutAt`
- **Opt-in kaise milega:** customer portal par "WhatsApp par bill/reminder chahiye" toggle, ya owner customer form mein "customer ne haan kaha" tick kare. Owner ka tick audit log mein record hoga.
- **Opt-out kaise hoga:** WhatsApp par "STOP" reply (inbound webhook), portal toggle, ya email mein unsubscribe link.

**Preferences:**
- `NotificationPreference (subjectKind, subjectId, category|type, channel, enabled)`. Isme sirf woh rows save hongi jo default se alag hain, baaki defaults catalogue se aate hain.
- Org ki notification settings ke liye alag `Json` column nahi banega. Ye settings registry ki `notify.*` keys hongi ([platform-foundations.md](platform-foundations.md) §9): customer messages on/off per type, `notify.quietHours` (default 21:30 se 07:30, org timezone), aur reminder ka din.

**Policy:** `src/lib/notifications/policy.ts` (pure, tested). `planChannels(type, recipient, prefs, consent, now, quota) → [{channel, skipReason?}]`.
- `critical` (jaise backup fail) quiet hours ko ignore karega, par consent ko nahi.
- Collapse window mein agar naya event aaye to naya message nahi jaayega; purane in-app item ka count badhega, jaise "3 late skips".
- Push fail ho jaaye to agla channel try hoga, sirf jab type ki list mein ho.

**Quota aur cost:**
- `NotificationUsage (orgId, month, channel, count, costPaise)`.
- Har SaaS plan (`src/lib/business.ts` PLANS) ka monthly WhatsApp/SMS quota hoga. Quota khatam hone par `skipped: quota` aur owner ko in-app alert.
- Yahi data business-growth plan ke SaaS billing aur add-on packs mein jaayega.

**Kharche aur abuse ke guardrails** (M-TRUST ke saath):
- **Har org ki daily send limit** har channel par, plan ke quota se alag. Ye bugs aur spam ke khilaaf ek hard cap hai. Limit paar hone par `skipped: quota`, aur owner aur platform dono ko alert.
- **Global kill-switch:** env `NOTIFY_OUTBOUND=off`, ya platform setting. Isse saare bahar jaane wale messages turant ruk jaate hain, par in-app chalta rehta hai. Incident runbook mein iska step hoga.
- **Provider ke budget:** Meta/SMS par monthly spend cap ka alert. Isse aage observability watchdog `platform.alert` bhejega.
- **Shared WhatsApp number ki suraksha:** ek mess ki galti se Meta number ki quality rating girti hai, aur saare messes ke messages ruk sakte hain. Isliye:
  - customers ko sirf approved templates jaayenge, aur consent ke bina kuch nahi
  - har org ki block/report rate track hogi, aur threshold paar hone par us org ki outbound sending apne aap ruk jaayegi, jab tak platform review na kare
  - naye orgs ki pehle 7 din ki limit kam hogi
- **Loop se bachav:** ek hi recipient, ek hi type, ek ghante mein N se zyada nahi. Ye collapse ke upar ek aur cap hai, kyunki ek bug hazaron messages bhej sakta hai.

## 4. Channels (adapters)

Har channel ka ek hi interface hoga (`src/server/notify/channels/`):
```ts
interface ChannelProvider { id; channel; send(msg: RenderedMessage, to): Promise<{ id?: string; costPaise?: number }>;
  // throws ProviderError { retryable, code }  → retry / fallback / dead
  parseWebhook?(req): Promise<StatusUpdate[]> }
```
Templates: `src/lib/notifications/templates/*.ts` mein pure `render(type, channel, lang, vars)` banega. Iska output channel ke hisaab se alag hoga:
- push: `title`, `body`, `url`
- email: `subject`, html, text
- WhatsApp: template name + params
- SMS: text + DLT id

Har type ke en aur hi templates hone chahiye, aur isse ek test check karega.

| Channel | Pehla adapter | Notes |
|---|---|---|
| `inapp` | DB (Notification row) | Hamesha milta hai. Bell + `/more/notifications` inbox, read/unread. Offline mein cached page dikhega |
| `webpush` | VAPID (Web Push protocol) | Staff app + customer portal (Android Chrome; iOS sirf installed PWA 16.4+). TWA app mein bhi yahi chalega (Chrome notification delegation). `sw.ts` mein `push` + `notificationclick` handlers. `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`. Encryption ke liye `web-push` npm dependency chahiye (approval) |
| `email` | `resend` (fetch-only) + `smtp` | `EMAIL_PROVIDER`, `EMAIL_FROM`. `List-Unsubscribe` header. Receipts/digests. Baad mein SES adapter |
| `whatsapp` | `meta` Cloud API (fetch-only) | Business-initiated messages sirf approved templates se jaayenge. 24h session window ka logic. Har template ka naam en/hi mein, aur ek template registry. Webhook `/api/webhooks/whatsapp` (`X-Hub-Signature-256` verify) se status aur inbound STOP. Credentials org ke ya shared (dekho neeche) |
| `sms` | `msg91` (baad mein) | India DLT: sender ID aur template ID chahiye. Sirf fallback ke liye |
| `manual` | n/a | Jab koi provider na ho, to owner ko "WhatsApp par bhejo" task dikhega jisme `whatsappLink()` (`src/lib/links.ts`) se pehle se bhara message hoga. Isse day 1 se bina kisi cost ke kaam chalta hai |
| `fake` | DB/console | Dev aur tests ke liye. Pattern `GOOGLE_TEST_BASE` jaisa: sirf localhost par |

**WhatsApp sender ke do model** (dono support honge, `OrgChannelConfig` table se):
1. **Shared platform number:** "Mess Manager" ke naam se, sabse aasaan aur sasta. Message mein mess ka naam variable mein jaata hai.
2. **Mess ka apna number:** Embedded Signup / BSP ke zariye. Token `src/server/secretbox.ts` se encrypt hoga aur export mein nahi jaayega (jaise `DriveConnection`).

**Provider webhooks:** `/api/webhooks/[provider]`.
- Har request par signature verify hoga.
- `providerMessageId` se delivery status update hoga.
- Inbound message aaye to opt-out ya baad mein chatbot (WhatsApp bot roadmap) ka hook chalega.

## 5. UI

- **Bell + inbox:** `PageHeader` mein unread count, aur `/more/notifications` par `List`, din ke hisaab se group. Tap karne par read ho jaata hai aur `url` khulta hai.
- **More → Notifications settings** (har user ke liye): har category ke liye channel ke `FormSwitch`, push on/off (permission prompt sirf user ke tap par, page load par nahi), email jodna/verify karna, aur quiet hours.
- **More → Customer messages** (owner, permission `notifications.manage`):
  - Kaunse customer messages on hain, reminder ka din aur samay.
  - WhatsApp connection ka status (shared ya apna number), aur is mahine ka usage/quota.
  - Delivery log (`DataTable`: type, customer, channel, status).
- **Customer portal `/c/[token]`:** WhatsApp opt-in toggle, "notifications on karo" (web push), aur language.
- **Customer page:** consent status, aur "is customer ko bheje gaye messages".
- **Dev gallery `/dev/notifications`:** har type × channel × lang ka preview, aur fake provider se test send.

## 6. Security, privacy, observability

- **Tenant isolation:** recipients hamesha event ke `orgId` se resolve honge. Customer ko sirf apne org ke messages, staff ko sirf apne org ke.
- **Logs:** phone/email/endpoint masked honge (observability plan ka `redact`). Message body logs mein nahi jaayegi.
- **Retention:** Notification/Delivery 180 din tak rahenge. Customer messages ka log `src/server/export.ts` mein jaayega (`notifications.csv`, bina message body ke), lekin credentials nahi.
- **Webhooks:** signature check, `timingSafeEqual`, replay window, aur JSON size limit.
- **Privacy page** (`src/lib/business.ts` / `(public)/privacy`): kaun se processors use hote hain (Meta, email provider), aur opt-in/opt-out ki jaankari.
- **Metrics:** jobs ki queue depth, oldest queued age, aur channel-wise sent/failed/delivery rate. Ye observability ke health/watchdog mein jaayenge, aur alert khud `platform.alert` notification se jaayega (dogfooding).
- **Permissions** (Phase 0 plan mein jodna):
  - `notifications.manage` owner ke paas, grantable.
  - Personal preferences har member khud badal sakta hai.

## Phases (build order)
1. **Foundation.**
   - `Job` + drivers (`inline`, `tick`, `worker`), `DomainEvent` + `emit` + subscribers, aur catalogue, policy aur templates (pure + tests).
   - `Notification` + in-app inbox + bell, preferences, aur `fake` + `manual` (wa.me) channels.
   - `/dev/notifications` gallery.
   - Drive-backup aur rollups ko schedules par shift karna, aur `vercel.json` mein ek tick.
1b. **OTP fast-track** (M-VERIFY ke liye, Stage 3 se pehle). Sirf `auth.otp` type, ek WhatsApp ya SMS adapter, template/DLT approval, aur guardrails. Poora WhatsApp phase (P4) iske baad bhi aa sakta hai.
2. **Web push.** VAPID, `PushSubscription`, `sw.ts` handlers, staff opt-in, customer portal opt-in, aur TWA par test.
3. **Email.** `User.email` + verify, Resend/SMTP adapters, unsubscribe, weekly digest.
4. **WhatsApp.**
   - Customer consent fields + portal/owner opt-in, aur Meta adapter + template registry + webhook.
   - Shared number pehle, apna number baad mein. Usage/quota.
   - Customer messages ki settings + delivery log.
5. **Scale aur extras.**
   - SMS (DLT), aur `vercel-queue`/`qstash`/`bullmq` drivers.
   - Native FCM adapter, sirf agar TWA ki jagah native wrapper aaye.
   - Outgoing webhooks for integrations, aur WhatsApp inbound bot.

Har phase ke saath:
- en/hi strings `src/lib/i18n.ts` mein
- changeset (minor)
- `CLAUDE.md` mein naya "Events & notifications" section (naya notification kaise jodein: 4 steps), aur `src/server/CLAUDE.md` mein `emit` checklist

## Critical files
- **New:**
  - `src/server/jobs/{index,drain,drivers/*}.ts`, `src/server/events.ts`, `src/server/events/subscribers.ts`
  - `src/server/notify/{dispatch,recipients,channels/*}.ts`
  - `src/lib/{events,backoff,cron}.ts`, `src/lib/notifications/{catalogue,policy,templates/*}.ts` (+ tests)
  - `prisma/schema/{jobs,notifications}.prisma`
  - `src/app/api/jobs/tick/route.ts`, `src/app/api/webhooks/[provider]/route.ts`
  - `src/app/(app)/more/notifications/*`, `src/app/dev/notifications/*`
  - `scripts/worker.ts` (+ `npm run worker`, compose `worker` service)
- **Modified:**
  - `src/app/sw.ts` (push/notificationclick), `src/server/mutations.ts` + `src/app/actions/*.ts` (`emit` in tx)
  - `src/app/c/[token]/*` (opt-in), `prisma/schema/{auth,customers,org}.prisma` (contact/consent fields)
  - `src/app/api/cron/drive-backup/route.ts` (schedule par), `vercel.json`, `docker-compose.yml`
  - `src/server/export.ts`, `src/lib/i18n.ts`, `.env.example`
- **Reuse:**
  - `whatsappLink` / `normalizePhone` (`src/lib/links.ts`), `secretbox` (`src/server/secretbox.ts`)
  - cron auth pattern (`api/cron/drive-backup`), `GOOGLE_TEST_BASE` style fake-provider pattern
  - `List` / `FormSwitch` / `DataTable` / `QuickForm` (`@/components/ui`), `toast` (in-app foreground notice)

## Verification
- **Unit tests:**
  - backoff, cron next-run (org timezone)
  - event aur notification catalogue ke zod schemas
  - har type ke en aur hi templates
  - `planChannels`: consent, quiet hours, critical, quota, collapse aur fallback order
  - idempotency keys
- **Runner:**
  1. Driver `inline` rakho. Payment record karo, aur check karo ki `DomainEvent` → `Notification` → `fake` delivery turant ban jaaye.
  2. Wahi flow `JOB_DRIVER=tick` ke saath chalao. Tick se pehle notification pending rahe, aur `curl -H "Authorization: Bearer $CRON_SECRET" /api/jobs/tick` ke baad bhej di jaaye.
  3. `npm run worker` chalao: `NOTIFY` se turant pickup ho.
  4. Do workers ek saath chalao: koi duplicate na ho (SKIP LOCKED).
  5. Worker ko beech mein kill karo: job `lockedUntil` ke baad dobara chale.
- **Retry:** fake provider se `retryable` error do. Retries backoff ke saath hon, phir `dead`, aur fallback channel try ho.
- **Web push:** `npm run build && npm start`, phir staff aur customer portal par subscribe karo. Ye check karo:
  - push aaye, aur tap karne par sahi URL khule
  - expired subscription par 410 aaye aur subscription delete ho jaaye
  - Android TWA build par bhi chale
- **WhatsApp** (Meta test number):
  - opt-in ke bina `skipped: no_consent`
  - opt-in ke baad template message jaaye, aur webhook se `delivered`/`read` aaye
  - "STOP" reply ke baad opt-out ho
- **Policy:**
  - quiet hours mein customer message subah 7:30 tak ruke
  - `critical` turant jaaye
  - quota khatam par `skipped: quota` + owner alert
- **Har phase:** `npm test && npm run typecheck && npm run lint`, phir `npm run changeset:status`.
