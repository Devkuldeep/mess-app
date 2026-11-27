# 15. Glossary + learning path: shabd-kosh, kya padhein, kaise practice karein

## 📚 Glossary (A–Z)
| Shabd | Matlab (ek line) |
|---|---|
| **A/B test** | Do versions ko alag users par chala kar dekhna ki kaunsa behtar hai |
| **AC (Acceptance Criteria)** | Story kab "done" hai: testable shartein, aksar Given/When/Then |
| **ACID** | Transaction ke gun: Atomic, Consistent, Isolated, Durable |
| **ADR** | Architecture Decision Record: ek faisla, uska context aur nateeje |
| **Agile** | Chhote steps, jaldi feedback aur lagatar sudhaar se kaam karna |
| **API** | Do software ke beech baat karne ka tay tareeka |
| **ARPU / ARPA** | Ek user/account se average kamai |
| **Audit log** | Kisne, kab, kya badla: append-only record |
| **Backoff** | Retry ke beech badhta intezaar (30s, 2m, 10m…) |
| **BA** | Business Analyst: requirements ko detail mein likhne wala |
| **Blue-green deploy** | Do environments, traffic switch karke release |
| **Boundary value** | Seema ke paas wale test cases (20:59, 21:00) |
| **BRD / FRD / SRS** | Service companies ke requirement documents |
| **Bundle** | Browser ko bheja gaya JS ka package |
| **CAC** | Ek customer laane ka kharcha |
| **Cache invalidation** | Purana cached data hataana jab asli data badle |
| **Canary release** | Naya version pehle thode users par |
| **CDN** | Duniya bhar mein static files ka tez delivery network |
| **Changeset** | User-visible badlav ka note, jisse changelog aur version banta hai |
| **Churn** | Kitne customers chhod gaye (%/mahina) |
| **CI / CD** | Har change par apne aap test (CI); deploy ke liye taiyaar/apne aap deploy (CD) |
| **CLS / LCP / INP** | Core Web Vitals: layout ka khisakna, bada content kab dikha, tap ka response |
| **CODEOWNERS** | Kaunsa folder kaun review karega |
| **Cohort** | Ek hi samay par aaye users ka group (retention ke liye) |
| **Composite FK** | Do columns wala foreign key, jaise `(orgId, customerId)` |
| **Conventional Commits** | `type(scope): subject` format |
| **CR (Change Request)** | Sign-off ke baad scope ka badlav (service company) |
| **CRDT** | Data structure jo bina conflict ke merge hota hai (collaborative apps) |
| **CSP** | Content-Security-Policy: browser ko batana ki kahan se script chal sakti hai |
| **CSRF** | Doosri site se user ki taraf se request bhejna |
| **Cutoff** | Waqt jiske baad badlav band (raat 9 baje skip) |
| **Dead letter** | Baar-baar fail hone wale jobs ki alag jagah |
| **Defense in depth** | Kai parton mein suraksha |
| **DLT** | TRAI ka registration system, jiske bina business SMS block hote hain |
| **DoD / DoR** | Definition of Done (kab poora) / Ready (kab shuru karne layak) |
| **DORA metrics** | Deploy frequency, lead time, change failure rate, time to restore |
| **DPDP Act** | Bharat ka personal data protection kanoon |
| **Dunning** | Payment fail hone par reminders aur grace period ka process |
| **E2E test** | Poora user flow asli browser mein |
| **Entitlement** | Plan ke hisaab se kya feature/limit milti hai |
| **Epic** | Badi feature jo kai stories mein tooti ho |
| **Error budget** | SLO ke andar bachi galti ki jagah |
| **Expand / contract** | Safe migration: pehle jodo, shift karo, phir hatao |
| **Feature flag** | Code deploy ho, par feature on/off config se |
| **Fixed bid / T&M** | Service contract: fixed daam vs ghante ke hisaab se |
| **Flaky test** | Kabhi pass, kabhi fail, bina code badle |
| **Golden signals** | Latency, traffic, errors, saturation |
| **Hydration** | Server ke HTML par React ka client mein "jaan" daalna |
| **i18n / l10n** | Kai bhashaon ka system / ek bhasha ke liye anuvaad |
| **IaC** | Infrastructure as Code (Terraform jaisa) |
| **Idempotent** | Do baar karne par bhi nateeja ek hi baar jaisa |
| **IDOR** | URL/ID badal kar dusre ka data dekh lena |
| **Incident Commander** | Incident mein faisle aur coordination karne wala |
| **IndexedDB / Dexie** | Browser ka database / uski library |
| **JTBD** | Jobs To Be Done: user kaunsa "kaam" karwana chahta hai |
| **KPI / OKR** | Lagatar dekhe jaane wale numbers / Objective + Key Results |
| **Lead time** | Idea/commit se production tak ka samay |
| **Least privilege** | Sirf utni access jitni zaroori |
| **Ledger** | Paisa ki har entry ka record (debit/credit) |
| **LTV** | Ek customer se poori zindagi ki kamai |
| **Migration** | DB schema ka versioned badlav |
| **Modular monolith** | Ek deploy, par andar saaf boundaries |
| **MoSCoW / RICE** | Prioritization ke tareeke |
| **MRR / ARR** | Mahine / saal ki recurring kamai |
| **MVP** | Sabse chhota product jo asli problem solve kare |
| **N+1 query** | Loop mein har item ke liye alag query (slow) |
| **NFR** | Non-functional requirement: speed, offline, security, cost… |
| **OAuth / PKCE** | Doosri service se permission lene ka standard / uska surakshit tareeka |
| **Observability** | Logs + metrics + traces se system ko andar se dekhna |
| **On-call** | Production ki zimmedari ki baari |
| **Optimistic UI** | Server ke jawab se pehle hi UI update |
| **Optimistic locking** | `version` se check ki beech mein kisi aur ne to nahi badla |
| **Outbox pattern** | Pehle local/DB mein likho, phir bhejo. Kuch kho nahi sakta |
| **OWASP Top 10** | Web apps ke sabse aam security risks |
| **Pagination (cursor)** | Bade lists ko pages mein, aakhri id se aage |
| **PE / TM** | DLT mein Principal Entity (business) / Telemarketer (SMS provider) |
| **Persona** | Typical user ka profile |
| **PII** | Personally identifiable information: naam, phone, address |
| **PITR** | Point-in-time recovery: DB ko kisi bhi pichhle waqt par wapas laana |
| **Postmortem (blameless)** | Incident ke baad seekh, bina dosh diye |
| **PR (Pull Request)** | Code badlav ko review ke liye bhejna |
| **PRD** | Product Requirements Document |
| **PWA / TWA** | Web app jo app jaisa chale / Play Store mein PWA ka wrapper |
| **Race condition** | Do kaam ek saath, aur nateeja order par depend ho |
| **Rate limit** | Ek waqt mein kitni requests allowed |
| **RBAC** | Role-based access control |
| **Refactor** | Behaviour badle bina code sudhaarna |
| **Regression** | Purana chalta feature naye badlav se toot jaana |
| **RFC / Design doc** | Bade badlav ka likha hua prastaav, review ke liye |
| **RLS** | Row Level Security: Postgres khud rows filter kare |
| **Rollback / roll-forward** | Pichhla version wapas / jaldi fix aage bhejna |
| **RPO / RTO** | Kitna data kho sakte ho / kitni der mein wapas aana hai |
| **RSC** | React Server Components |
| **Runbook** | Kisi problem ko theek karne ke likhe hue steps |
| **SemVer** | MAJOR.MINOR.PATCH versioning |
| **Server Action** | Next.js ka server function jo form/button seedha bula sake |
| **Service worker** | Browser ka background script: cache, offline, push |
| **SKIP LOCKED** | Postgres: lock wali rows chhod kar baaki uthao (job queues) |
| **SLI / SLO / SLA** | Kya napte hain / lakshya / customer se vaada |
| **Smoke test** | Deploy ke baad "zinda hai?" ki jaanch |
| **SOW / MSA** | Service contract ke documents |
| **Spike** | Time-boxed research ticket |
| **Sprint** | 1–2 hafte ki fixed kaam ki cycle |
| **SSR / CSR / SSG** | Server / client / build-time rendering |
| **Story points** | Kaam ki complexity ka relative andaaza |
| **STRIDE** | Threat modeling ke 6 khatre |
| **Strangler fig** | Purane system ko dheere-dheere naye se badalna |
| **Tech debt** | Aaj ki shortcut jiska "byaaj" kal chukana padta hai |
| **Tenant / multi-tenancy** | Ek customer (mess) / ek system mein kai customers ka alag data |
| **Threat model** | "Attacker kya karega?" ki likhit soch |
| **UAT** | User Acceptance Testing: user/client ka "haan" |
| **Unit economics** | Ek customer ke level par kamai vs kharcha |
| **UUID (v4/v7)** | Unique ID (random / time-ordered) |
| **Velocity** | Ek sprint mein poore hue points (sirf planning ke liye) |
| **Version skew** | Purana client naye server se baat kare aur toote |
| **WCAG** | Accessibility ke international guidelines |
| **Webhook** | Doosri service ka hamein event bhejna (HTTP call) |
| **WIP limit** | Ek waqt mein kitna kaam "in progress" ho sakta hai |
| **zod** | TypeScript ki validation library |

## 🧭 Learning path: kya, kis order mein, aur is repo mein practice

### Level 1: Foundations (pehle 2–3 mahine)
| Seekho | Kyun | Is repo mein practice |
|---|---|---|
| Git (branch, rebase, PR, conflict) | Har din ka kaam | Ek `docs:` PR: README ke setup steps sudhaaro |
| JavaScript/TypeScript (types, async/await, modules) | Sab kuch isi mein | `src/lib/dates.ts` padho, aur `addDays`/`diffDays` ke tests likho |
| HTTP (methods, status codes, headers, cookies) | Web kaise chalta hai | DevTools mein `/api/sync` ki request/response dekho |
| SQL basics (select, join, index) | Data samajhna | `npm run db:studio` se tables dekho, aur ek join khud likho |
| Testing basics | Bharosa | `src/lib/schedule.test.ts` padho, aur ek naya case jodo |

### Level 2: Product engineering (3–9 mahine)
| Seekho | Is repo mein practice |
|---|---|
| React + Next.js App Router (RSC, Suspense, Server Actions) | Ek naya chhota setting screen `QuickForm` se (rule 6), en + hi strings ke saath |
| Forms + validation (zod) | `src/lib/validation.ts` mein naya schema, aur `parseForm` se action |
| Postgres + Prisma (schema, migration, transactions) | Ek additive migration local par: nullable column + backfill script |
| Offline/PWA | Chapter 09 ka practice task (outbox ka safar) |
| Accessibility + i18n | Ek screen ko keyboard-only chalao, aur jo atka use theek karo |
| Security basics (OWASP, tenant isolation) | Chapter 11 ka STRIDE task |

### Level 3: Systems (9–24 mahine)
| Seekho | Is repo mein practice |
|---|---|
| System design (caching, queues, idempotency, scaling) | [../plan/notifications.md](../plan/notifications.md) ka job queue padho, aur `drain()` ka pseudo-code likho |
| DevOps (CI, Docker, deploy, monitoring) | Chapter 12 ka CI sketch poora karo |
| Data modeling (ledger, time-versioning) | [../plan/core-domain-v2.md](../plan/core-domain-v2.md) ka parity test design karo |
| Observability + incidents | Chapter 13 ka runbook task |

### Level 4: Senior soch (lagatar)
- Trade-offs likhna (ADR/RFC), code review mein sikhana, ambiguity mein raasta banana.
- Product sense: user interviews mein baithna, aur metrics padhna.
- Communication: saaf status updates, risk jaldi batana, "nahi" kehna vikalp ke saath.

## 📖 Padhne layak (jaani-maani kitaabein aur docs)
| Topic | Resource |
|---|---|
| Product/discovery | *The Mom Test* (Rob Fitzpatrick), *Inspired* (Marty Cagan) |
| UX | *Don't Make Me Think* (Steve Krug), web.dev ke accessibility guides, WCAG |
| Engineering craft | *The Pragmatic Programmer* (Hunt & Thomas), *A Philosophy of Software Design* (John Ousterhout) |
| Data/systems | *Designing Data-Intensive Applications* (Martin Kleppmann) |
| DevOps/delivery | *Accelerate* (Forsgren, Humble, Kim), *The Phoenix Project* |
| Reliability | *Site Reliability Engineering* (Google, online free) |
| Security | OWASP Top 10, OWASP Cheat Sheet Series |
| Career | *The Staff Engineer's Path* (Tanya Reilly), *Staff Engineer* (Will Larson) |
| Web platform | MDN Web Docs, web.dev; is repo ke liye `node_modules/next/dist/docs/` (Next ke version-matched docs) |

## ✅ Master checklist: ek feature ka A se Z
1. **Business:** kis problem ko solve karta hai? Kis metric ko badlega? (01)
2. **Requirements:** user story, AC (Given/When/Then), edge cases, NFR, offline ka faisla (02)
3. **Design:** flow, saari states, Hindi copy, a11y, screen spec (03)
4. **Tech design:** data model, API, permissions, migration, risks. Bada ho to RFC/ADR (04)
5. **Ticket:** DoR poora, estimate, sprint mein (06)
6. **Code:** branch, tests, implementation, en + hi, self-review (07, 08, 09)
7. **Security:** auth, `orgId`, validation, secrets/PII, STRIDE (11)
8. **Test:** unit, integration, e2e jahan zaroori, manual (offline + sasta phone) (10)
9. **PR:** chhota, saaf description, CI green, review (07)
10. **Release:** flag, migration ka order, changeset, smoke, Hindi release notes (12)
11. **Operate:** logs/alerts, runbook, support ko jaankari (13)
12. **Seekho:** metric dekho, feedback lo, agla sudhaar backlog mein (14)

> Ye checklist tumhe ek **feature banane wale** se ek **product banane wala** developer banati hai. Har feature par ise ek baar chala ke dekho.
