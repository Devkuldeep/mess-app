# Mess Manager

Multi-tenant SaaS for small Indian tiffin/mess businesses (15–100 customers).
Owners see how many tiffins to cook, delivery staff tick off deliveries, customers
skip meals from a no-login link. Product plans live in `docs/` (Hinglish);
`docs/init-4.md` has the build order.

@AGENTS.md

## Stack

- **Next.js 16** (App Router, Turbopack, `cacheComponents`, `partialPrefetching`, `experimental.useOffline`). APIs differ from older Next — read `node_modules/next/dist/docs/` before using one you're unsure of.
- **React 19**, **Tailwind v4** (tokens in `src/app/globals.css`, no config file).
- **Prisma 7** + **PostgreSQL** via `@prisma/adapter-pg`. Client is generated into `src/generated/prisma` (git-ignored; `npm install` regenerates it).
- **Serwist** (service worker) + **Dexie** (IndexedDB) for offline. No other UI or state libraries.
- Auth is our own: phone + password (scrypt), DB-backed sessions (`src/server/auth.ts`).

## Commands

```bash
docker compose up -d db     # Postgres 17 on localhost:5433 (user/pass/db: mess; port 5433 avoids clashing with other local Postgres)
cp .env.example .env        # first time
npm install                 # also runs prisma generate
npm run db:deploy           # apply migrations   (db:migrate to create a new one)
npm run db:seed             # demo data — owner 9876543210 / password123
npm run dev                 # http://localhost:3000

npm test                    # unit tests (node --test, src/**/*.test.ts)
npm run typecheck && npm run lint
npm run build && npm start  # production build — the ONLY mode where the service worker runs
```

Containerised dev server instead: `docker compose --profile app up`.
No Docker? `npx prisma dev -n mess -d` starts a local Postgres; put its TCP URL in `.env`.

## Layout

```
src/app/(auth)/        login, signup, onboarding
src/app/(app)/         owner/staff screens: today, delivery, customers, payments, wastage, more
src/app/(app)/more/    menu (profile + grouped rows) → one screen per option: mess, plans, dishes, holidays, backup
src/app/c/[token]/     customer self-service link (no login)
src/app/actions/       Server Actions (all mutations except offline sync)
src/app/api/sync/      offline outbox replay endpoint
src/app/sw.ts          service worker source → public/sw.js (scripts/build-sw.ts, runs after next build)
src/server/            server-only: db, auth/session, org-scoped queries, mutations
src/lib/               pure, shared logic (dates, schedule/billing, i18n, links, sync types, local-db)
src/components/        UI; "use client" only for interactive leaves
prisma/                schema, migrations, seed
```

## Rules that matter

1. **Tenant isolation.** Every query on tenant data filters by `ctx.orgId` from `requireMember()` / `requireStaff()`. Never take an orgId from a form, URL or body. Writes by id use `updateMany/deleteMany({ where: { id, orgId } })`. Details: `src/server/CLAUDE.md`.
2. **Dates are `"YYYY-MM-DD"` strings** in app code, computed in the org's timezone (`todayIn(org.timezone)`), converted only at the Prisma boundary (`toDbDate` / `fromDbDate`). Never use `new Date()` to mean "today".
3. **Billing is derived, not stored**: charges = scheduled meals × plan price (`src/lib/schedule.ts`). Skips and holidays reduce the bill automatically. Changing a plan's price re-prices history — known MVP limitation.
4. **Cache Components**: anything that reads cookies/params/DB must render inside `<Suspense>`. Pattern used on every page: a sync `default export` that wraps an async component in `<Suspense fallback={<ConnectivityFallback …/>}>`. Don't `await` the session at the top of a layout.
5. **Hindi-first i18n**: every UI string goes in both `en` and `hi` in `src/lib/i18n.ts`. Server: `const { t, lang } = await getT()`. Client components get strings as props.
6. **Mobile-first UI**: follow the `mobile-ui` skill (`.claude/skills/mobile-ui/SKILL.md`) for any screen work. Settings live as a menu (`MenuSection`/`MenuRow` in `src/components/menu.tsx`) with one screen per option — never pile forms onto one page. Small edits use `QuickForm` (shows "…" then "✓ saved"); deletes use `ConfirmButton` (two taps).
7. **CSS**: custom classes go in `globals.css` as `@utility` (reusable via `@apply`) or inside `@layer components { }`. Plain unlayered rules there are silently dropped by the Tailwind v4 Turbopack loader.
8. Keep `src/lib/*` free of server/browser-only imports so it stays unit-testable with plain `node --test` (relative imports there use the `.ts` extension).

## Offline architecture

Three layers, each covering what the one above can't:

| Layer | What | Where |
|---|---|---|
| Service worker (Serwist) | Precaches build assets + `/offline`; pages and RSC payloads network-first with a 4s timeout, kept 7 days; offline document fallback. Production only. | `src/app/sw.ts`, `scripts/build-sw.ts`, `AppRuntime` |
| Next `useOffline` | Keeps navigations/Server Actions pending while offline and retries on reconnect; drives the offline banner. Only while the tab stays open. | `next.config.ts`, `SyncBar` |
| Outbox (Dexie) | Field actions (mark delivered, record payment) are written to IndexedDB first, shown optimistically, replayed to `POST /api/sync` in order on reconnect/focus/30s. Survives app restarts. | `src/lib/local-db.ts`, `src/components/outbox.ts`, `src/lib/sync.ts`, `src/server/mutations.ts` |

Adding a new offline-capable action:
1. Add an op type + validation to `src/lib/sync.ts` (`parseOp`).
2. Make the server side **idempotent** in `src/server/mutations.ts` (upsert on a natural key, or a device-generated UUID + `skipDuplicates`). Return `retry: false` for errors that will never succeed.
3. In the UI, `enqueue()` the op and overlay `usePendingOps()` on server data for optimistic display.

Online-only on purpose: customer skip/unskip (the cutoff must be checked against server time), creating/editing customers, settings.

Logout clears cached pages and the local DB (warns first if unsynced ops remain) — phones are often shared.

The worker is generated at build time, not by Serwist's `/serwist/[path]` route: with `cacheComponents` that route would bundle on every request and needs source + esbuild in production. `public/sw.js` is a git-ignored build artifact.

Testing offline: `npm run build && npm start`, open a page once, then DevTools → Network → Offline (or stop the server) and reload / tap.

## Deploying to Vercel

- `vercel.json`: daily `drive-backup` schedule (2 AM IST) → `GET /api/cron/drive-backup`. It's a `path` target (not a private `function` target) on purpose: the same endpoint serves Docker/VPS crontabs, and it checks `CRON_SECRET`, which Vercel sends automatically. Hobby plan: runs once a day with up to 15 min jitter.
- Vercel runs `npm run vercel-build` = `prisma migrate deploy && npm run build` (migrations use `DATABASE_URL_UNPOOLED` when present, see `prisma.config.ts`). `output: "standalone"` is only used off Vercel.
- Database: Neon Postgres from the Vercel Marketplace (sets `DATABASE_URL` pooled + `DATABASE_URL_UNPOOLED`). Enable Neon's preview branching so Preview deployments don't migrate the production database.
- Project env vars: `APP_URL` (production URL), `CRON_SECRET`, and for Drive backup `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TOKEN_ENCRYPTION_KEY`. Add `<APP_URL>/api/google/callback` as an authorised redirect URI in Google Cloud.
- After deploying, check `/sw.js` returns the service worker (it's generated after `next build`).

## Android app (Play Store)

- The Android app is a **Trusted Web Activity** wrapping the live PWA (no separate codebase). Build it with PWABuilder (pwabuilder.com → Android) or `npx @bubblewrap/cli init --manifest <APP_URL>/manifest.webmanifest`. One app for all messes; tiffin customers use their link, not the app.
- `GET /.well-known/assetlinks.json` (`src/app/.well-known/assetlinks.json/route.ts`, logic in `src/lib/assetlinks.ts`) proves the app owns the site, so it opens without a URL bar. Set `ANDROID_PACKAGE_NAME` and `ANDROID_CERT_SHA256` (comma-separated: the upload key **and** the Play App Signing key from Play Console → App integrity), then redeploy — the route is prerendered at build time.
- Get the final domain **before** publishing; the app is tied to it.
- Manifest `screenshots` (`public/screenshots/*.webp`) feed Chrome's install sheet and PWABuilder: 5 narrow (412×915 @2x of `/today?d=tomorrow`, `/delivery`, `/payments`, `/wastage/report?range=30`, a customer link) + 1 wide (homepage 1280×800), Hindi, demo seed data. Retake them after visible UI changes (headless Chrome via DevTools protocol with a demo session cookie; never against production data).

## Legal & public pages

- Public, static (no cookies) pages in `src/app/(public)/`: `/` (homepage), `/pricing`, `/privacy`, `/terms`, `/refund`, `/shipping`, `/contact`. They're what Google OAuth review and Razorpay KYC check. Footer links: `SiteFooter`.
- **All business details and plan prices live in `src/lib/business.ts`** — never hard-code them in pages. `[BRACKETED]` values are placeholders; pages show a "Draft" warning while any remain, and `npm run check:legal` fails until they're filled. Have a lawyer review before launch.
- Signup requires consent; `User.termsAcceptedAt` + `termsVersion` record it. When Terms/Privacy change materially, bump `TERMS_VERSION` (re-consent flow not built yet).
- Privacy Policy already includes Google's "Limited Use" statement and the `drive.file` description for the planned Drive backup — keep it accurate if that design changes.
- Customer link shows a data notice; owners can request deletion from More (mailto to the grievance email — manual process for now).

## Commits & changelog

- **Conventional Commits**, enforced by commitlint in a husky `commit-msg` hook (`commitlint.config.mjs`): `type(scope): subject`, e.g. `feat(wastage): learn eaten-per-tiffin`, `fix(offline): keep ops on 401`. Types: feat, fix, perf, refactor, docs, test, chore, ci, build, style, revert. `!` after the scope (or a `BREAKING CHANGE:` footer) = breaking. Scopes are suggested (warning only): auth, customers, delivery, payments, portal, today, wastage, settings, export, legal, offline, pwa, i18n, ui, db, api, docker, deps, changeset, release.
- **Changesets** write `CHANGELOG.md`. With every user-visible change (`feat`, `fix`, `perf`), add one: `npm run changeset` → pick minor (feature) / patch (fix) / major (needs manual migration steps or removes something) → one-line summary written for mess owners, not developers. `chore/docs/test/ci/refactor` need none. `npm run changeset:status` shows what's pending vs `main`.
- **Release**: `npm run release:version` consumes `.changeset/*.md`, bumps `package.json` (+ lockfile) and prepends to `CHANGELOG.md`; commit that as `chore(release): vX.Y.Z`. The app isn't published to npm (`private: true`); `npx changeset git-tag` creates the `mess-app@X.Y.Z` tag.
- Hooks install via the `prepare` script on `npm install`. Bypass only in emergencies (`git commit --no-verify`).

## Wastage module

From `docs/init-3.md`. Owner/manager log "kitna bana / kitna bacha" per meal in ~30s; the app reports waste and suggests how much to cook.

- **Data**: `Dish` (unit kg/litre/count, `perTiffin` default, optional `costPerUnit`, `variety` = changes daily → entry asks "which one?"), `WastageEntry` (one per org+date+meal, snapshots `tiffins`), `WastageItem` (cooked, leftover, snapshots `costPerUnit`). Dishes are archived, never deleted (history keeps working). New orgs get Dal/Chawal/Sabzi/Roti (`DEFAULT_DISHES`); older orgs get them lazily in `listDishes`.
- **Logic** (pure, tested): `src/lib/wastage.ts` — `wastageReport` (₹-weighted waste %, loss, kg, worst dishes/varieties, reasons, per-day) and `suggestCooking` (median eaten-per-tiffin over the last 28 days for that meal × tiffins × (1 + buffer); buffer = variability, 3–15%; falls back to `perTiffin` + 10% until 3 entries exist → "learning").
- **Screens**: `/wastage` (entry, today + 2 previous days), `/wastage/report` (7/30 days), suggestions + status card on `/today`, dishes & target % in More.
- **Offline**: saving goes through the outbox as a `wastage` op; the server replaces that meal's record (last write wins), rejects future dates.
- **Next steps from docs**: festival calendar & alerts, weekday/pattern forecasting, surplus flash-sale, area benchmarking (anonymised).

## Google Drive backup

Each mess backs up to its **owner's own** Google Drive (never ours). Our Google Cloud project only identifies the app.

- **Flow**: More → "Google Drive जोड़ें" → `GET /api/google/connect` (owner only; state + PKCE verifier in an httpOnly cookie scoped to `/api/google`) → Google consent (`openid email drive.file`, `access_type=offline`, `prompt=consent`) → `GET /api/google/callback` (checks state/org, exchanges code, requires the drive.file scope to be granted, saves the refresh token **encrypted** with `TOKEN_ENCRYPTION_KEY` via `src/server/secretbox.ts`, creates the "Mess Manager Backups" folder, runs a first backup).
- **Backups** (`src/server/drive-backup.ts`): the same ZIP as "Download my data", one file per day (same-day re-runs replace it), newest 30 kept, folder recreated if the owner deleted it. `invalid_grant`/401 → status `needs_reconnect` (UI asks to reconnect). Disconnect revokes the token at Google and deletes the row.
- **Nightly job**: `GET|POST /api/cron/drive-backup` with `Authorization: Bearer $CRON_SECRET` backs up every active connection not backed up in 20h. Schedule it daily (Vercel Cron sends the header automatically; VPS/Docker: `0 2 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://DOMAIN/api/cron/drive-backup`). "Backup now" in More is rate-limited to once a minute.
- **Google client** is fetch-only (`src/server/google.ts`). `GOOGLE_TEST_BASE` (honoured only for localhost URLs) points it at a fake Google for testing.
- `DriveConnection` is deliberately **not** in the data export (it holds credentials, not business data). Never log or return `refreshTokenEnc`.
- **Google Cloud setup (once, by the app owner)**: create project → enable Google Drive API → OAuth consent screen (External; app name, support email, logo; homepage `/`, privacy `/privacy`, terms `/terms` on your verified domain; scopes `openid`, `email`, `drive.file`) → Credentials → OAuth client (Web application) with redirect `<APP_URL>/api/google/callback` → put ID/secret in `.env`. **Publish to Production** before real use (in Testing mode refresh tokens expire after 7 days and only test users can connect). Submit for verification (brand verification; drive.file is non-sensitive — confirm in the console).

## Backups & data export

- **Real backups are the database's job**: use a Postgres host with automatic daily backups / point-in-time recovery (Neon, RDS, etc.), or a nightly `pg_dump` to object storage if self-hosting. Device storage (IndexedDB/localStorage) is never a backup — it only holds unsynced ops.
- **Owner export** ("Download my data", More screen → `GET /api/export`, owner only): ZIP of Excel-ready CSVs + `data.json` (`src/server/export.ts`, CSV rules in `src/lib/csv.ts` — BOM for Hindi, formula-injection guard). The service worker never caches `/api/*`. When you add a tenant table, add it to the export too.
- Google Drive auto-backup: see "Google Drive backup" above.

## Roadmap hooks (from docs/)

Next phases: wastage entry + forecast (add a Dexie table + outbox op so entry works offline), reseller system, Razorpay billing, WhatsApp API, festival calendar. Org switcher is not built — a user uses their first membership. Staff invites have no UI yet (insert `Member` rows directly).
