# 12. DevOps, CI/CD aur release: code se live app tak (aur Play Store)

## 📖 Kahani
Pehla production deploy shukravaar shaam 7 baje hua, aur 7:20 par Sunita didi ka phone aaya: "App khul hi nahi raha!" Ek migration ne column rename kiya tha, jabki purana code abhi bhi purana naam padh raha tha. Arjun (DevOps) ne **rollback** kiya, par migration ulti nahi hui. 2 ghante lage.

Retro mein teen niyam bane:
1. **Migration hamesha "expand → migrate → contract"** mein (rename = add + copy, aur drop agli release mein).
2. **Har PR par CI**, aur **preview deployment** jahan QA pehle dekh le.
3. **Deploy chhote aur aksar.** Bade deploy ka risk bada hota hai.

Do mahine baad ek aur ajeeb bug aaya. Kuch owners ko form bhejne par "Failed to find Server Action" mila. Wajah: purana page service worker ne cache kiya tha, aur naye deploy mein action IDs badal gaye the. Ilaaj: **skew protection / `deploymentId`**, aur error par form data bacha kar "App update hua, dobara bhejo" (production-readiness, "Version skew").

## 🏢 Industry mein kaise hota hai

### 1. CI (Continuous Integration): har PR par apne aap
```
install (npm ci, cache) → typecheck → lint → unit tests → build
→ integration tests (Postgres service) → e2e (Playwright) → migration check → audit
```
- **Required checks + branch protection:** red CI = merge nahi.
- **Tez CI** = developers khush. Isliye cache, parallel jobs, aur sirf zaroori tests.
- **Migration check:** khaali DB par saari migrations chalao, phir check karo ki schema aur migrations match karte hain. Isse "schema badla par migration banana bhool gaye" pakda jaata hai.

### 2. CD (Continuous Delivery/Deployment) aur environments
| Env | Kaam | Data |
|---|---|---|
| Local | Developer | Seed (fake) |
| CI/test | Automated tests | Factories |
| **Preview** (har PR) | QA, design QA, demo | Demo seed, alag DB branch (Neon branching) |
| Staging (badi teams mein) | Production jaisa, release se pehle | Anonymized ya fake data |
| **Production** | Asli users | Asli data |

**Continuous Delivery** = har merge deploy ho sakta hai (button se). **Continuous Deployment** = har merge apne aap deploy ho jaata hai.

### 3. Infrastructure ke vikalp
| | Vercel (managed) | Docker + VPS | Kubernetes |
|---|---|---|---|
| Setup | Sabse aasaan | Medium | Bhaari |
| Control | Kam | Zyada | Bahut zyada |
| Kab | Shuru mein (hamara) | Kharcha/control ke liye | Bade scale, kai services, platform team |

- **Containers:** image = app + dependencies, har jagah ek jaisa. **Multi-stage Dockerfile** se final image chhota banta hai. Is repo mein `deps → builder → migrator → runner` stages hain, aur runner non-root `app` user se chalta hai.
- **IaC** (Infrastructure as Code: Terraform/Pulumi): infra bhi code mein, review ke saath. Jab environments badhein tab.

### 4. Database aur deploy
- **Order:** pehle migration (backward compatible), phir naya code. Vercel par `vercel-build` = `prisma migrate deploy && npm run build`.
- **Expand/contract** taaki purana aur naya code dono naye schema par chal sakein, aur rollback safe rahe.
- Risky migration se pehle **backup/PITR point** pakka karo.

### 5. Deployment strategies
| Strategy | Kaise | Fayda |
|---|---|---|
| Recreate | Purana band, naya chalu | Simple, par downtime |
| Rolling | Instances ek-ek karke badalte hain | Bina downtime |
| Blue-green | Do environments, traffic switch | Turant rollback |
| Canary | Pehle 5% users par, phir sab | Risk kam |
| **Feature flags** | Code deploy ho, par feature band; pehle pilot orgs ke liye on | Deploy aur release alag (production-readiness: flags) |

**Rollback vs roll-forward:** bada nuksaan ho to rollback. Chhota bug ho to jaldi fix karke aage deploy (roll-forward).

### 6. Version skew (PWA ke liye khaas)
- Naye deploy ke baad browser mein purana JS reh jaata hai, aur purane action IDs bhi. Service worker ka cache ise lamba kar deta hai.
- **Ilaaj:**
  - Vercel Skew Protection, ya `deploymentId`
  - sab instances par same `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`
  - zaroori offline writes versioned JSON API (`/api/sync`) se
  - error par data bachana
  - SW update ka toast (production-readiness "Version skew")

### 7. Release management
- **SemVer + Changesets:** `npm run changeset` (har user-visible change ke saath) → `npm run release:version` → `CHANGELOG.md` + version → commit `chore(release): vX.Y.Z` → tag.
- **Release notes owners ke liye, Hindi mein:** "Ab payment bina internet ke bhi record hoti hai". "Refactored outbox" jaisa nahi.
- **Release checklist** (neeche namuna).

### 8. Android app (TWA) ki release
- **Signing keys:**
  - **Upload key:** tum app sign karke Play Console par bhejte ho.
  - **Play App Signing key:** Google final app sign karta hai.
  - **Dono ke SHA-256 fingerprints** `assetlinks.json` mein chahiye (`ANDROID_CERT_SHA256`), warna app mein URL bar dikhega.
- **Play Console ke tracks:** internal → closed (testers) → open → production, aur **staged rollout** (pehle 10%).
- Store listing (screenshots, privacy policy URL), content rating, aur data safety form. Review mein din lag sakte hain.
- TWA mein app ka zyada tar update **website deploy** se hota hai. Store par naya version tab chahiye jab wrapper (icon, naam, permissions) badle.

### 9. Secrets aur access (CI/CD mein)
- CI ke secrets platform ke secret store mein, aur sirf zaroori jobs ko.
- Deploy tokens ka **least privilege**. Production DB ka access kam se kam logon ke paas.
- Fork PRs ko secrets nahi milte.

### 10. Kharcha (FinOps basics)
- Har service ka bill dekho: hosting, DB, storage, SMS/WhatsApp.
- Budget alerts lagao, aur per-org kharcha napo (observability plan).
- Preview environments aur purane branches ko saaf rakho.

## 📄 Namuna 1: CI workflow (GitHub Actions, sketch)
```yaml
name: ci
on: [pull_request, push]
jobs:
  checks:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17-alpine
        env: { POSTGRES_USER: mess, POSTGRES_PASSWORD: mess, POSTGRES_DB: mess }
        ports: ["5432:5432"]
    env:
      DATABASE_URL: postgresql://mess:mess@localhost:5432/mess
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: npx prisma migrate deploy
      - run: npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema --exit-code
      - run: npm run build
```
> Ye sketch hai. Asli workflow banate waqt versions aur flags `prisma migrate diff` ke docs se check karo (production-readiness Phase 1).

## 📄 Namuna 2: release checklist
- [ ] CI green, aur QA ne preview par verify kiya
- [ ] Migration backward compatible, aur backup/PITR point pakka
- [ ] Feature flag: pehle pilot orgs
- [ ] Changeset → version → `CHANGELOG.md` → tag
- [ ] Deploy ke baad smoke: `/api/health`, `/login`, `/sw.js`, assetlinks
- [ ] 30 minute errors/logs par nazar
- [ ] Owners ke liye "Naya kya hai" (Hindi)
- [ ] Rollback ka tareeka pata hai (kaunsa deployment/tag)

## ⚠️ Aam galtiyan
- Ek hi release mein column rename/drop.
- Bina CI ke "jaldi fix" seedha production par.
- Bade, kabhi-kabhi wale deploys.
- Rollback ka plan sirf dimaag mein hona.
- Signing key kho dena. Ise surakshit backup mein rakho.
- PWA cache aur version skew ko bhool jaana.

## ✅ Seekh
- **Chhote, aksar, reversible deploys.**
- Deploy ≠ release (feature flags).
- Migration aur code ka order, aur rollback hamesha pehle socho.

## 🔗 Is repo mein
- `Dockerfile`, `docker-compose.yml`, `vercel.json`, `package.json` (scripts: `build`, `vercel-build`, `release:version`), `scripts/build-sw.ts`
- CLAUDE.md → "Deploying to Vercel", "Android app (Play Store)", "Commits & changelog"
- [../plan/production-readiness.md](../plan/production-readiness.md) (CI, environments, flags, migration rules, release, version skew, DR)

## 🏋️ Practice task
Upar ke CI sketch ko production-readiness Phase 1 ki list se milao. Jo steps missing hain (`check:legal` warning, `changeset status`, `npm audit`), unhe jodo. Ek note bhi likho ki kaunse steps parallel jobs mein ja sakte hain.
