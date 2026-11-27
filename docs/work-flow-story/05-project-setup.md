# 05. Project setup: repo, tools, conventions, onboarding

## 📖 Kahani
Tumhara pehla din. Arjun (DevOps) ne laptop diya aur kaha: "Aaj sham tak app tumhare laptop par chal jaana chahiye, aur kal tumhara pehla PR." Tum ghabraaye, par README aur `CLAUDE.md` mein sab likha tha:
```bash
docker compose up -d db     # Postgres (port 5433)
cp .env.example .env
npm install                 # prisma generate bhi chala deta hai
npm run db:deploy && npm run db:seed
npm run dev                 # http://localhost:3000  (owner 9876543210 / password123)
```
2 ghante mein app chal gaya. Vikram ne kaha: "Achhi team ki pehchaan ye hai ki naya banda **ek din** mein productive ho jaaye. Agar ek hafta lage, to galti docs ki hai, bande ki nahi."

Phir pehla commit kiya: `fixed bug`. Husky hook ne mana kar diya:
```
✖ subject may not be empty / type must be one of [feat, fix, …]
```
Sahi tareeka tha `fix(delivery): keep tick when offline`. Tum ne seekha ki **conventions machine se enforce hoti hain**, yaad se nahi.

## 🏢 Industry mein kaise hota hai

### 1. Repo strategy
| | Monorepo | Polyrepo |
|---|---|---|
| Kya | Saare apps/packages ek repo mein | Har service ka alag repo |
| Fayde | Ek PR mein poora change, shared code aasaan | Alag permissions, alag release |
| Tools | npm workspaces, Turborepo, Nx | Har repo ka apna CI |

Hamara: ek app, ek repo.

### 2. Branching strategy
| | Trunk-based (hamara) | GitFlow |
|---|---|---|
| Branches | `main` + chhoti feature branches (1–3 din) | `main`, `develop`, `release/*`, `hotfix/*` |
| Release | `main` hamesha deployable; adhoore features **feature flags** ke peeche | Release branch banti hai, testing, phir merge |
| Kab | SaaS, web apps, roz deploy | Versioned software, app stores, purane versions ka support |

**Branch naming:** `feat/delivery-offline-tick`, `fix/skip-cutoff-boundary`, `chore/deps-bump`.

### 3. Commits aur versioning
- **Conventional Commits:** `type(scope): subject`
  - types: `feat` (naya feature), `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `ci`, `build`, `style`, `revert`
  - `!` = breaking change
  - Fayda: history padhne layak hoti hai, changelog apne aap ban sakta hai, aur version tay karna aasaan.
- **SemVer:** `MAJOR.MINOR.PATCH`. Breaking ho to major, naya feature minor, fix patch.
- **Changesets:** har user-visible change ke saath ek chhoti file, jaise "Owners ab offline payment record kar sakte hain". Release par ye files `CHANGELOG.md` aur version mein badal jaati hain.

### 4. Code quality ka setup
- **TypeScript strict**: type errors build se pehle pakde jaate hain.
- **ESLint**: galat patterns ke liye (hooks rules, unused vars, aur aage custom rules jaise "server mein `new Date()` nahi").
- **Formatter** (Prettier): style par bahas khatam. Ye tool ka kaam hai, review ka nahi.
- **Git hooks** (husky): commit-msg par commitlint chalta hai. Pre-commit par lint-staged (sirf badli files) bhi laga sakte ho.
- **CI** (chapter 12): wahi checks server par bhi, taaki koi `--no-verify` se bach na sake.

### 5. Config aur secrets: 12-Factor App ke principles
| Principle | Matlab | Is repo mein |
|---|---|---|
| Config env mein | Code mein secrets/URLs hard-code nahi | `.env`, `.env.example` (sirf naam aur misaal) |
| Backing services attachable | DB/SMS sirf ek URL ya credential hain, badal sakte ho | `DATABASE_URL`, `DATABASE_URL_UNPOOLED` |
| Dev/prod parity | Local bhi Postgres 17, SQLite nahi | `docker-compose.yml` |
| Logs = stream | stdout par likho, platform jama karta hai | Observability plan |
| Disposability | Process kabhi bhi band/shuru ho sake | Stateless server, state DB mein |
| Build, release, run alag | Build artifact ek baar bane, env alag | Dockerfile multi-stage, `vercel-build` |

**Secrets ke rules:**
- Git mein kabhi nahi. `.env` git-ignored hai.
- Leak ho jaaye to **rotate** karo. Sirf delete karna kaafi nahi, kyunki git history mein rehta hai.
- Har environment ke alag secrets.
- Logs mein kabhi nahi.

### 6. Local development
- **Docker compose** se DB, taaki "mere laptop par chalta hai" wali problem na ho.
- **Seed data** realistic aur **fake** ho (demo owner, customers). Production ka data kabhi local par nahi.
- **Scripts** `package.json` mein: `dev`, `test`, `typecheck`, `lint`, `db:*`, `build`.

### 7. Dependencies ki policy
- Lockfile commit karo. CI mein `npm ci` (exact versions).
- Nayi dependency = faisla. Kya zaroorat hai? Size? Maintenance? License? Security? Isi liye CLAUDE.md mein "approved deps" hain, aur plans mein approval maangi jaati hai.
- Dependabot/Renovate se updates. `npm audit` se vulnerabilities.

### 8. Documentation
- **README:** project kya hai aur kaise chalayein.
- **CONTRIBUTING:** PR kaise bhejein, conventions.
- **Architecture docs aur ADRs:** "kyun".
- **CLAUDE.md / AGENTS.md:** AI coding tools ke liye project ke rules. Ye naye insaan ke liye bhi sabse achha onboarding hai.
- **Code ke comments:** "kya" nahi, **"kyun"**. Misaal: `// Same response time whether or not the phone exists.` (`src/app/actions/auth.ts`).

### 9. Service company mein extra
- **Client ka repo**, ya hamara repo jo baad mein **handover** hota hai. IP (intellectual property) contract mein tay hota hai.
- Client ka VPN/SSO, unke coding standards, unka CI.
- **Handover docs:** setup, architecture, runbooks, credentials ka transfer, aur knowledge transfer (KT) sessions.

## 👨‍💻 Developer deep dive: naye codebase ko kaise padhein
1. **Entry points dhoondho:** routes (`src/app/`), schema (`prisma/schema/`), proxy/middleware (`src/proxy.ts`).
2. **Data model padho:** `prisma/schema/*.prisma`. Tables samajh aa gaye to aadha app samajh aa gaya.
3. **Ek flow trace karo:** UI → action/API → server function → DB. Misaal: delivery tick ka flow:
   - UI: `src/components/delivery-list.tsx`
   - `enqueue` (`src/components/outbox.ts`)
   - `/api/sync`
   - `applyDelivery` (`src/server/mutations.ts`)
   - Prisma
4. **Tests padho:** `src/lib/*.test.ts` batate hain ki function se kya umeed hai.
5. **Rules padho:** CLAUDE.md "Rules that matter". Ye woh galtiyan hain jo pehle ho chuki hain.
6. **`git log` padho:** `git log --oneline` se pata chalta hai ki project kaise bana.

### Pehle hafte ki onboarding checklist
- [ ] App local par chal gaya, aur seed login ho gaya
- [ ] `npm test && npm run typecheck && npm run lint` pass
- [ ] CLAUDE.md, `src/server/CLAUDE.md` aur `docs/roadmap.md` padh liye
- [ ] Ek flow end-to-end trace kiya (upar wala)
- [ ] Ek chhota "good first issue" PR: typo, ek string, ya ek test
- [ ] Team ke saath 1:1, aur pata hai ki kisse kya poochna hai
- [ ] Production ka access **nahi** hai (least privilege). Zaroorat ho to request karo

## 📄 Namuna: PR template (`.github/pull_request_template.md`, planned)
```markdown
## Kya badla aur kyun
(1–3 line; ticket link)

## Kaise test kiya
- [ ] Unit tests  - [ ] Manually (screenshots/GIF)  - [ ] Offline ho to offline bhi

## Checklist (Definition of Done)
- [ ] Permission/tenant isolation (`orgId`) check
- [ ] Har string en + hi
- [ ] Naya model registry/export mein
- [ ] Changeset (user-visible ho to)
- [ ] Docs/CLAUDE.md update (agar rule badla)
```

## ⚠️ Aam galtiyan
- `.env` commit kar dena, ya Slack par secret paste karna.
- Seed data na hona. Har naya dev haath se data banata hai.
- Lambi branches (2 hafte), phir merge conflicts ka toofan.
- "Mere laptop par chalta hai": alag DB version, alag Node version.
- Bina soche dependency jodna.

## ✅ Seekh
- Setup aisa ho ki naya banda **ek din** mein PR bhej sake.
- Conventions tools se enforce karo: hooks, lint, CI.
- Secrets env mein, aur leak ho to rotate.

## 🔗 Is repo mein
- `CLAUDE.md` (Commands, Layout), `docker-compose.yml`, `.env.example`, `Dockerfile`
- `commitlint.config.mjs`, `.husky/commit-msg`, `.changeset/`
- [../plan/production-readiness.md](../plan/production-readiness.md) → Phase 1 (CI, env validation)

## 🏋️ Practice task
Ek naye developer ki nazar se README aur CLAUDE.md follow karke app chalao. Jahan bhi atke (koi step missing, koi error), use likho aur docs theek karne ka ek PR banao: `docs(readme): …`.
