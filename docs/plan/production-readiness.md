# Production readiness plan (M-READY)

> Roadmap: **Stage 1** ([../roadmap.md](../roadmap.md)). Saath mein chalne wale modules:
> - M-ROLES: [roles-permissions.md](roles-permissions.md)
> - M-OBS-1: [observability.md](observability.md) Phase 1, jisme logging, `/api/health` aur watchdog hain
> - M-FOUNDATION: [platform-foundations.md](platform-foundations.md). Commands, error model aur scoped DB. Rate limits aur read-only mode commands ke `execute` mein lagte hain.
>
> Stage 2 (pilot) tabhi shuru hoga jab ye plan ka exit gate paar ho.

## Context
App ka MVP chal raha hai, aur ek live URL bhi hai. Par asli owners ka paisa aur data aane se pehle ye kamiyan bandh karni hain. Ye sab code dekh kar mili hain:

| Kami | Abhi ki haalat |
|---|---|
| CI | `.github/workflows` hai hi nahi. Tests, lint aur typecheck sirf haath se chalte hain |
| E2E tests | Nahi hain. Sirf `src/lib` ke unit tests hain |
| Rate limiting | `login`, `signup`, `/join`, `/c/[token]` aur `/api/sync`, kisi par limit nahi hai (`src/app/actions/auth.ts`) |
| Password bhool gaye | Koi flow nahi hai. User ke paas email nahi, sirf phone + password hai |
| Sessions | "Sab devices se logout" nahi hai. Password badalne par purane sessions bane rehte hain |
| Security headers | `next.config.ts` mein sirf `/sw.js` ka cache header hai. CSP, HSTS aur frame-ancestors nahi hain |
| Env validation | Galat ya missing env par app chal padta hai aur baad mein toot-ta hai |
| Environments | Preview aur production ka data alag karne ka koi likha hua rule nahi hai |
| Migrations | Schema aur migrations match karte hain ya nahi, ye check nahi hota. Expand/contract ka rule bhi nahi |
| DR | Restore kabhi test nahi hua, aur koi runbook nahi hai |
| Release | Deploy ke baad smoke test nahi hota, aur rollback ka tareeka likha nahi hai |
| Performance | Koi budget nahi hai, aur 2G/low-end phone par measure nahi hota |
| Phone verification | `signup` koi bhi phone number seedha le leta hai, OTP nahi hota | Koi owner ka number pehle register kar de to asli owner "phone pehle se hai" mein atak jaata hai |
| Version skew | Service worker pages 7 din cache karta hai, aur Server Action IDs har deploy par badalte hain | Naye deploy ke baad purane cached page se form bhejne par "Failed to find Server Action" aata hai |
| Region | DB aur functions ka region tay nahi hai | Region alag ho to har query par 50–100 ms judte hain, aur 2G par ye aur bura lagta hai |

**Goal:** har change apne aap check ho, attack aur galti dono se bachav ho, kuch toote to turant pata chale aur jaldi theek ho, aur ye sab **platform-agnostic** rahe (Vercel, Docker aur VPS teeno par).

## Sidhant
1. **Sab automated.** Jo check haath se karna pade, woh ek din chhoot jaayega.
2. **Pehle sasta aur bina vendor ke.** Rate limit ho ya flags, sab Postgres-backed aur pluggable. Vercel Firewall, Upstash ya Vercel Flags baad mein adapter se jod sakte hain.
3. **Platform-agnostic.** CI aur scripts teeno targets par chalne chahiye.
4. **Har kaam ke saath runbook.** Jo cheez raat 2 baje tootegi, uska ilaaj pehle se likha ho.

---

## Phase 1: CI + quality gates (pehla hafta)

**`.github/workflows/ci.yml`** har PR aur `main` push par chalega:
1. `npm ci`, jo `prisma generate` bhi chala deta hai.
2. `npm run typecheck`, `npm run lint` aur `npm test`.
3. **Migration check** Postgres 17 service container ke saath:
   - `prisma migrate deploy` ko khaali DB par chalao.
   - Phir `prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema --exit-code` chalao. Agar schema badla par migration nahi bani to CI fail hoga.
4. `npm run build`, CI ke dummy env ke saath. Build ke baad `public/sw.js` bana hai, ye bhi check karo.
5. **Integration aur e2e** (Phase 3 se) alag jobs mein, parallel.
6. `npm run check:legal` abhi sirf warning ke liye. Launch (M-LAUNCH) ke baad ye blocking hoga.
7. `npx changeset status --since=origin/main`. Agar `feat/fix` commit hai aur changeset nahi, to warning.
8. `npm audit --omit=dev --audit-level=high`.

**Repo settings:**
- `main` par branch protection: CI green hona chahiye aur PR se hi merge.
- `.github/dependabot.yml`: npm weekly, aur GitHub Actions monthly.
- PR template (`.github/pull_request_template.md`) mein [../roadmap.md](../roadmap.md) ki "Definition of Done" checklist.

**Env validation:** `src/server/env.ts` (server-only) mein ek zod schema hoga, jise pure `src/lib/env-schema.ts` se test kiya jaayega.
- **Required:** `DATABASE_URL` aur `APP_URL`.
- **Format check:** `CRON_SECRET` kam se kam 16 characters, aur `TOKEN_ENCRYPTION_KEY` 32-byte base64.
- **Optional groups:** Google aur Android. Inmein se kuch bhi set ho to group ki saari values chahiye.
- **`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`** (base64, 32 bytes) self-host par production mein **required** hai. Docker mein kai instances hon to sab par same key honi chahiye, warna Server Actions toot jaate hain (Next docs: `self-hosting.md` → "Server Functions encryption key"). Ise sirf build time par set karo, aur `.env.production.example` mein jodo.
- `instrumentation.ts` ke `register()` mein production mein env galat hone par **boot hi fail** ho. Dev mein sirf warning.
- Code mein `process.env.X` seedha padhne ki jagah `env.X` use ho. Ye ESLint `no-restricted-properties` rule se enforce hoga (`src/server/env.ts` ko chhod kar).
- `.env.example` isi schema se match karega, aur ek test ise check karega.

## Phase 2: Security hardening

### 2a. Rate limiting (pluggable)
- **Pure algorithm:** `src/lib/rate-limit.ts` mein fixed-window + sliding approximation, tested.
- **Store:** `src/server/rate-limit.ts`, interface `RateLimitStore`.
  - Default **Postgres** table hogi: `RateLimit { key @id, count, windowStart }`, ek atomic `INSERT … ON CONFLICT DO UPDATE … RETURNING`. Purani rows ko ek scheduled job saaf karega, jo M-EVENTS ke baad aayega aur tab tak cron se chalega.
  - Baad ke adapters: `memory` (tests ke liye), `upstash`, `vercel-firewall` (dashboard rules).
- **Client IP:** `x-forwarded-for` ka pehla trusted hop, `TRUSTED_PROXY` env ke hisaab se: Vercel, ya Docker ke peeche nginx.
- **Kahan lagega:**

| Jagah | Key | Limit |
|---|---|---|
| `login` | phone + IP | 5/15 min per phone, 30/15 min per IP. Usse zyada par 15 min ka soft lock aur saaf Hindi message |
| `signup`, `createOrg` | IP | 5/hour |
| `/join/[token]` | IP | 20/hour |
| `/c/[token]` page + `actions/portal.ts` | IP (+ token) | 60/min. Galat token par 10/hour per IP (token guessing rokne ke liye) |
| `/api/sync` | userId | 30/min (har call mein 200 ops tak) |
| `/api/export` | orgId | 5/hour |
| Password reset (2b) | phone + IP | 3/hour |

- **Response:** Server Action `FormState` mein `error: "tooManyAttempts"` lautayega, aur API `429` ke saath `Retry-After` header dega. Saare messages `en` aur `hi` dono mein.

### 2b. Password reset (bina email/SMS ke, abhi ke liye)
- **Model:** `PasswordReset { id, userId, tokenHash, createdBy, expiresAt (30 min), usedAt }`. Token ek hi baar use hoga, aur DB mein sirf uska sha256 jaayega (session wala pattern).
- **Staff ka reset:** owner More → Staff → member → "Password reset link" dabata hai. Isse ek link `/reset/<token>` banta hai, jo WhatsApp par share hota hai (invite jaisa).
- **Owner ka reset:**
  - **Abhi:** support-assisted. Platform admin identity verify karke link banata hai, aur ye audit mein record hota hai (M-AUDIT).
  - **M-NOTIFY-4 ke baad:** WhatsApp/SMS OTP se khud reset.
- **Reset ke baad:** us user ke **saare sessions delete** ho jaate hain aur naya session banta hai.

### 2c. Sessions
- Login par naya token banta hai (pehle se aisa hai). Password change ya reset par saare purane sessions delete honge.
- `Session` mein `userAgent`, `ipHash` aur `lastSeenAt` judenge. `lastSeenAt` har request par nahi, ghante mein ek baar update hoga.
- More → Profile → **"Logged-in devices"** list, "is device se logout" aur "baaki sab se logout".
- Sliding expiry: 60 din, jo use hote rehne par badhta rahega.

### 2d. Security headers (`next.config.ts` → `headers()`)
- Saare routes par ye headers:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (sirf production mein)
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `/c/*` aur `/join/*` par `no-referrer`, taaki secret token link se bahar leak na ho
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()` (inmein se jo baad mein chahiye, use kholenge)
  - `X-Frame-Options: DENY` / CSP `frame-ancestors 'none'`
- **CSP:** pehle `Content-Security-Policy-Report-Only` lagayenge.
  - Policy: `default-src 'self'`, `script-src 'self'`, `img-src 'self' data: blob:`, `connect-src 'self'`, `style-src 'self' 'unsafe-inline'`, `worker-src 'self'`, `manifest-src 'self'`.
  - Reports `/api/csp-report` par jaayenge, jo log karta hai (M-OBS-1).
  - 2 hafte tak violations dekhne ke baad enforce karenge.
  - Agar inline script chahiye to Next ke nonce pattern ke liye pehle `node_modules/next/dist/docs/` padhna hai.
- **Server Actions:** Next origin check karta hai. TWA aur production domain ke liye `serverActions.allowedOrigins` ko domain final hone par (M-LAUNCH) check karna hai.

### 2e. Secrets aur tokens
- **`TOKEN_ENCRYPTION_KEY` versioning:** `src/server/secretbox.ts` ka ciphertext `v1:` prefix ke saath banega. `TOKEN_ENCRYPTION_KEYS="v2:…,v1:…"` mein naya key encrypt karega aur purana sirf decrypt. Isse rotation ke liye reconnect nahi karna padega.
- **Rotation runbook** (Phase 5) in sab ke liye: `CRON_SECRET`, DB password, Google client secret aur VAPID/WhatsApp keys (aage chal kar).
- **Customer link reset:** customer page par "Link badlo" ka action, jo naya `portalToken` banata hai. Jab phone kho jaaye ya link galat insaan ko chala jaaye, tab kaam aata hai.
- **Logs:** koi secret ya token log nahi hoga. Ye observability ka `redact()` sambhalega.

### 2f. Phone verification aur admin 2FA
- **Abhi ki kami:** `signup` (`src/app/actions/auth.ts`) phone ko bina OTP ke account bana deta hai.
- **Jab tak OTP nahi aata** (Stage 2): signup sirf **invite-only** rahega, ya pilot accounts hum khud banayenge. Feature flag `publicSignup` default off.
- **OTP** (module M-VERIFY, Stage 3, public signup se pehle):
  - `PhoneVerification { id, phone, codeHash, purpose (signup | reset | change), attempts, expiresAt (5 min), usedAt }`
  - 6 digits ka code, jiska sirf hash save hota hai. Max 5 galat try, aur phone + IP par rate limit (2a).
  - Code notifications plan ke `auth.otp` type se jaata hai (WhatsApp ya SMS, "OTP fast-track").
  - Signup, password reset (2b ka owner self-reset) aur phone badalna, teeno isi se honge.
- **Process ka kaam abhi shuru karo:** SMS ke liye TRAI DLT par sender ID aur template registration, aur WhatsApp ke liye OTP template ki approval. In dono mein din lag jaate hain.
- **Platform admin (`/admin`) ke liye 2FA pehle din se:**
  - TOTP (authenticator app) zaroori. Secret `secretbox` se encrypt hoga.
  - Recovery codes, aur admin session 12 ghante ka.
  - Har admin login audit hoga.
  - Inko saare messes dikhte hain, isliye sirf password kaafi nahi.

## Phase 3: Testing

**Teen layers:**

| Layer | Tool | Kya test hota hai | Kab chalta hai |
|---|---|---|---|
| Unit | `node --test` (pehle se hai) | `src/lib/*` ka pure logic | Har PR |
| Integration | `node --test` + asli Postgres | `src/server/*`: tenant isolation, mutations ki idempotency, sync replay, billing queries | Har PR (CI ka Postgres service) |
| E2E | **Playwright** (`@playwright/test`, nayi dev dependency, **approval chahiye**) | Asli browser mein poore flows, production build par | Har PR (chhota set), nightly (poora set) |

**Integration setup:**
- `src/server/**/*.itest.ts` aur `npm run test:int`. `TEST_DATABASE_URL` mein har run se pehle `migrate reset --force`, aur har test apni org banata hai (factories), isliye tests parallel chal sakte hain.
- **Factories:** `prisma/fixtures.ts` mein `makeOrg()`, `makeCustomer()`, `makePayment()`. Ye seed aur tests dono use karenge.
- **Zaroori test: tenant isolation.** Org A ka ctx lekar Org B ki IDs se har `data.ts`, `mutations.ts`, `actions/*` aur API call ki koshish karo. Har call ko khaali result ya error dena chahiye. Naya data function jode to us par bhi ye test hona chahiye; ek list wala test fail karega agar `data.ts` ka koi export test mein cover nahi hua.

**E2E (`e2e/`, `playwright.config.ts`)** `npm run build && npm start` par chalega, seeded DB ke saath, aur mobile viewport (Pixel 5) mein:
1. Signup → onboarding → plan → customer jodo.
2. `/today` headcount, aur kal ke liye skip ke baad count ghatna chahiye.
3. Delivery tick **offline** mein (`context.setOffline(true)`) → reload → online → sync hua aur server par ek hi row bani.
4. Payment record (offline) → balance update.
5. Customer link: cutoff se pehle skip ho, cutoff ke baad mana ho (server time mock: `TEST_NOW` env, sirf test mode mein).
6. Staff invite → join → delivery role ko sirf `/delivery` dikhe.
7. Login rate limit: 6th galat try par mana ho.
8. Logout ke baad cached pages aur local DB saaf ho.

**Saath mein:**
- `@axe-core/playwright` (dev dependency, approval chahiye) har e2e page par chalega. Serious accessibility violations par test fail.
- Visual screenshot test nahi karenge, ye flaky hote hain. Manifest screenshots wala script apni jagah rahega.

## Phase 4: Environments, flags, migrations, release

### Environments
| Env | DB | Data | URL | Kaun deploy karta hai |
|---|---|---|---|---|
| local | Docker Postgres (5433) | `db:seed` demo | localhost:3000 | developer |
| test (CI) | Postgres service | factories | n/a | CI |
| preview | **Neon branch** per PR (Vercel Marketplace integration) | demo seed, **kabhi production ka data nahi** | Vercel preview URL | har PR |
| production | Neon main (pooled + unpooled) | asli | final domain | `main` merge |

- `APP_ENV=local|test|preview|production` env var hoga. Isse ye cheezein preview mein band rahengi: cron, asli notifications ("fake" provider) aur Google OAuth (test client).
- Docker/VPS ke liye `.env.production.example`, aur `docker-compose.prod.yml` (app + migrator + worker baad mein).
- **Region:** DB aur functions **ek hi region** mein. Misaal: Vercel functions ka region aur Neon DB dono Mumbai, ya dono Singapore, jo bhi available ho. Vercel par project settings mein function region DB ke paas set karo. VPS par server DB ke paas. Prisma ek page ke liye kai queries chalata hai, isliye ye faisla sabse sasta speed fix hai.
- **Data kahan hai:** region aur providers ke naam privacy page par likho, aur ye data lifecycle registry ke docs ke saath ek jagah rakho (foundations §7).

### Feature flags (pilot ke liye zaroori)
- **Definitions:** `src/lib/flags.ts` mein pure definitions, `{ key, default, description }`. Har flag ka default code mein, env se override (`FLAGS="menu:on"`), aur per-org override `OrgSetting` table ki `flag.<name>` keys se, jinhe sirf platform badal sakta hai ([platform-foundations.md](platform-foundations.md) §9).
- **Server:** `flag(ctx, "weeklyMenu")`. Client ko boolean props ke roop mein milega.
- **Use:** naya feature pehle 1–2 pilot orgs par on karenge, phir sab par. Pura rollout hone ke baad flag code se hata denge. Ye roadmap ki Definition of Done mein jodna hai.
- Baad mein Vercel Flags adapter, interface wahi rahega.

### Migration rules (`prisma/CLAUDE.md` mein jodna)
1. **Expand → migrate → contract.** Pehle naya column (nullable ya default) jodo, phir backfill script/job, phir code naye column par shift karo. Purana column **agli release** mein hatao.
2. Jo migration ek baar apply ho chuki ho, use kabhi edit mat karo.
3. Rename = add + copy + drop, teen releases mein.
4. Bada backfill migration SQL mein nahi, `scripts/backfill-*.ts` (idempotent, batch mein) mein.
5. Bade tables (audit, events) par index baad mein raw SQL `CREATE INDEX CONCURRENTLY` se.
6. Har migration PR mein ek line likho: "rollback kaise hoga".

### Release process
```
branch → PR (CI + preview deploy + Neon branch) → review → merge main
  → Vercel: prisma migrate deploy → build → deploy → smoke test
  → Docker/VPS: migrator image → app image (tag = version) → smoke test
```
- **Smoke test:** `scripts/smoke.ts` (`npm run smoke -- <URL>`) check karta hai:
  - `/api/health` 200 de (M-OBS-1)
  - `/sw.js` service worker de
  - `/login` 200 de
  - `/.well-known/assetlinks.json` valid ho

  Vercel deploy hook ya CI ka post-deploy job ise chalayega. Fail hone par alert jaayega.
- **Rollback:**
  - Vercel par "Instant Rollback" se pichhla deployment.
  - Docker par pichhla image tag.
  - Migration expand/contract ki wajah se purana code naye schema par bhi chal jaata hai.
- **Version:** `chore(release): vX.Y.Z` se tag hoga (changesets, pehle jaisa). App version More screen ke neeche dikhega (support ke liye).
- **Service worker update:** abhi `skipWaiting: true` hai. Naya SW aane par "Naya version aaya, refresh karo" toast dikhega, aur agar outbox mein pending ops hon to pehle sync. Isse purane JS aur naye server ke beech mismatch nahi hoga.
- **Maintenance / read-only mode:** `MAINTENANCE=readonly` env se (`execute` ka org-state step, [platform-foundations.md](platform-foundations.md) §8) saare mutations "abhi update ho raha hai" lautayenge, par reads chalte rahenge. Bade migration aur incident mein kaam aayega, aur aage billing ke suspend mode (M-BILL) mein bhi yahi reuse hoga.

### Version skew (deploy ke baad purane pages)
**Problem** (Next docs: `node_modules/next/dist/docs/01-app/02-guides/server-actions.md` → "Deployment considerations", aur `self-hosting.md` → "Version Skew"):
- Har deploy par Server Action IDs badalte hain, aur kuch na badle tab bhi 14 din mein ek baar.
- Hamara service worker pages 7 din tak cache karta hai, aur `useOffline` offline mein ruke actions ko reconnect par dobara bhejta hai.
- Beech mein deploy ho jaaye to "Failed to find Server Action" aata hai.

**Fix:**
1. **Deployment ID:**
   - Vercel par project ki **Skew Protection** on karo.
   - Self-host par `next.config.ts` mein `deploymentId: process.env.DEPLOYMENT_VERSION` (git SHA ya release tag) rakho.
   - Mismatch hone par Next khud hard reload karta hai.
2. **Encryption key:** `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` sab instances aur releases par same rahe (env validation upar).
3. **Error ka UX:** ye error aaye to form ka data bacha rahe. `ActionForm` aur `QuickForm` values aur `$idem` (foundations §6) rakhte hain, aur message dikhta hai: "App update hua, ek baar aur bhejo". Phir naye page par wahi data aur wahi `$idem`, isliye duplicate nahi banega.
4. **Offline wale zaroori writes** hamesha outbox + `/api/sync` (versioned JSON API) se jaayenge, Server Actions se nahi. Ye architecture abhi jaisi hai, aur ise rule bana dena hai. Ops ka `v` aur Dexie migrations foundations §16 mein hain.
5. **Service worker update toast** (upar) ke saath pending ops pehle sync hon, phir naya version aaye.

## Phase 5: Reliability, DR aur performance

### Backup aur restore
- **Primary:** Neon PITR. Plan aisa lena hai jisme **kam se kam 7 din** ki history ho. Free tier ka retention kam hai, isliye launch se pehle check karna hai.
- **Secondary (independent copy):** roz encrypted `pg_dump` ek alag storage par jaayega, kisi doosre vendor ke paas (Cloudflare R2, S3 ya Backblaze), 30 din tak rakha jaayega.
  - Ye ek scheduled job hoga: pehle cron, M-EVENTS ke baad job system par.
  - Script `scripts/db-dump.ts`, aur `pg_dump` Docker image mein milega.
- **Targets:**
  - RPO: PITR se kuch minute, dump se ≤ 24 ghante.
  - RTO: ≤ 2 ghante.
- **Restore drill har 3 mahine:**
  1. PITR se ek Neon branch banao.
  2. Us par smoke + integration tests chalao.
  3. Time note karo.
  4. Result `docs/ops/runbook.md` ke log mein likho.

  Pehla drill Stage 1 ke exit gate ka hissa hai.

### Runbook (`docs/ops/runbook.md`, naya)
Har incident ke liye: kaise pehchanein → turant kya karein → theek kaise karein → owners ko kya batayein (WhatsApp broadcast template).
- Site down / 5xx
- DB down ya slow
- Kharab deploy → rollback
- Galat data / bug ne data bigaada → PITR branch se sirf woh rows wapas laao
- Secret leak → rotation steps (2e)
- Drive backup ya cron fail
- Service worker phas gaya → kill-switch: `public/sw.js` ka ek "unregister" version deploy karo

**Uptime:** BetterStack ya UptimeRobot (free) ka monitor `/api/health` par, aur ek public status page. Alerts phone par.

### Performance budget
- **Targets:** mid-range Android aur slow 4G par, `/today`, `/delivery` aur `/c/[token]` ke liye:
  - LCP < 2.5s
  - INP < 200ms
  - in routes ka first-load JS < 180 KB gzip
- **Lighthouse CI** (`@lhci/cli`, dev dependency, approval chahiye) PR par in pages par chalega, budget file `lighthouserc.json` ke saath.
- **Load / scale test** (`scripts/load-seed.ts`), production jaisa data banata hai:
  - 1 org × 100 customers × 12 mahine
  - 300 orgs

  Phir `autocannon` (dev dependency) se `/api/sync` aur main pages par load. Slow query log (M-OBS-1) dekh kar zaroori indexes jodo.
- **Query budget:** har page ki DB queries ginti mein ho (dev mein Prisma query log). N+1 nahi chalega.

### Device QA matrix (har release se pehle, haath se, 10 minute)
- Low-end Android Chrome (2–3 GB RAM)
- Play Store TWA app
- iOS Safari
- Desktop Chrome
- Hindi font aur bada text size (accessibility)

---

## Naye files aur badlaav
- **New:**
  - `.github/workflows/ci.yml`, `.github/dependabot.yml`, `.github/pull_request_template.md`
  - `src/lib/env-schema.ts`, `src/server/env.ts`, `src/lib/rate-limit.ts`, `src/server/rate-limit.ts`, `src/lib/flags.ts` (+ tests)
  - `prisma/schema/security.prisma` (`RateLimit`, `PasswordReset`)
  - `src/app/(auth)/reset/[token]/page.tsx`, `src/app/api/csp-report/route.ts`, `src/app/(app)/more/devices/*`
  - `prisma/fixtures.ts`, `src/server/**/*.itest.ts`, `e2e/*`, `playwright.config.ts`
  - `scripts/{smoke,db-dump,load-seed}.ts`, `lighthouserc.json`
  - `docs/ops/runbook.md`, `.env.production.example`, `docker-compose.prod.yml`
- **Modified:**
  - `next.config.ts` (headers), `src/app/actions/{auth,portal,staff}.ts` (rate limit, reset, sessions)
  - `prisma/schema/auth.prisma` (`Session` fields), `src/server/auth.ts`
  - `src/server/secretbox.ts` (key versions), `src/app/sw.ts` + `AppRuntime` (update toast)
  - `prisma/seed.ts` (fixtures use kare), `package.json` scripts (`test:int`, `test:e2e`, `smoke`)
  - `prisma/CLAUDE.md` (migration rules), `CLAUDE.md` (Commands + "Production readiness" section)
- **Reuse:**
  - session hashing pattern (`src/server/auth.ts`), invite-link pattern (`actions/staff.ts`) reset link ke liye
  - `timingSafeEqual` cron auth (`api/cron/drive-backup`), `FormState`/`fieldError` (`src/lib/validation.ts`)
  - `ConfirmButton` / `List` (`@/components/ui`)

## Nayi dependencies (sab dev-only, approval chahiye)
`@playwright/test`, `@axe-core/playwright`, `@lhci/cli`, `autocannon`. Production bundle mein koi nayi dependency nahi.

## Exit gate (Stage 1 → Stage 2)
- [ ] CI har PR par green, aur branch protection on
- [ ] Integration tenant-isolation suite + 8 e2e flows pass
- [ ] Rate limits live, aur staff password reset kaam karta hai
- [ ] Security headers live, aur CSP report-only mein bina bade violation ke
- [ ] Env validation boot par
- [ ] Preview deploys Neon branch par, production data se alag
- [ ] Feature flags chal rahe hain
- [ ] Smoke test har deploy ke baad
- [ ] Pehla restore drill ho chuka, runbook likha hua, uptime monitor on
- [ ] Performance budget CI mein, aur `/delivery` budget ke andar
- [ ] Skew protection / `deploymentId` + stable encryption key, aur deploy ke baad purane page ka form data ke saath recover ho
- [ ] DB aur functions ek region mein
- [ ] Signup invite-only (`publicSignup` off). OTP M-VERIFY ke saath Stage 3 mein

## Verification
- **CI:**
  - Ek PR mein jaan-boojh kar ek type error daalo, phir ek schema change bina migration ke. Dono par CI red hona chahiye.
  - Fix karo, CI green hona chahiye.
- **Rate limit:**
  - 6 baar galat login → 6th par Hindi mein "zyada koshish" message.
  - 15 min baad (ya test clock) phir se login ho sake.
  - `/api/sync` par 31st call → 429.
- **Reset:**
  - Owner staff ka reset link banaye → link se naya password → purane device ka session khatam.
  - Link dobara kholo → "link use ho chuka".
- **Headers:** `curl -I` se saare headers dikhein, `/c/x` par `no-referrer` ho, aur CSP report endpoint par violations log hon.
- **Env:** production mode mein `CRON_SECRET=short` → boot fail, saaf message ke saath.
- **Flags:** ek org par `weeklyMenu` on karo → sirf usi org ko dikhe.
- **Release:** preview deploy → smoke pass. Kharab deploy simulate karo → rollback 5 min ke andar.
- **DR:** PITR branch restore + tests, aur time log karo. `db-dump` file decrypt hokar local par restore ho sake.
- **Perf:** Lighthouse CI report budget ke andar. Load test mein p95 `/api/sync` < 500ms (100 customers wala org).
- **Skew:**
  1. Ek page kholo, aur naya build deploy karo.
  2. Purane tab se form submit karo → "App update hua" message aaye, data bacha rahe, aur dobara bhejne par ek hi record bane.
  3. Offline mein delivery tick karo, deploy karo, phir online jao → op `/api/sync` se sync ho.
- **Region:** production mein `/api/health` ka DB ping < 10 ms aaye. Isse pata chalega ki DB aur function same region mein hain.
