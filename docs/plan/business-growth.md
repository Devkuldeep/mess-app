# Business growth reporting plan (mess owner + SaaS)

> Ye plan in do plans ke upar banta hai:
> - `docs/plan/roles-permissions.md`: permissions
> - `docs/plan/observability.md`: Level C ka `DailyOrgStat` + `/reports` hub + SVG charts, aur Level D ka `PlatformDailyStat` + `/admin`
> - `docs/plan/platform-foundations.md`: is plan ka har write ek command hai, naye money columns `…Paise Int` hain, import §13 se hota hai, aur settings registry mein

## Context
App abhi ye bata deta hai ki kitne tiffin banane hain, kisne pay kiya aur kitna waste hua. Par owner ke sabse bade business sawalon ka jawab nahi deta:
- "Main kitna **kama** raha hoon, profit kitna hai?"
- "Customer **kahan se** aa rahe hain, aur **kyun** chhod rahe hain?"
- "Raashan kitna laga, aur **stock** kab khatam hoga?"

Inka jawab isliye nahi milta kyunki ye data app mein hai hi nahi: kharche, customer source, leads, stop reason, material stock aur price history.

Hamare SaaS ke liye bhi MRR, churn aur activation dekhne ka koi tareeka nahi hai.

**Goal:** do cheezein.
1. Pehle **sahi data capture** ho. Har entry 30 second se kam ki, aur Hindi-first.
2. Phir us data par **growth reports aur "aage kya karein" insights** banein, do levels par:
   - **Owner level**: finance, growth, kitchen.
   - **SaaS level**: hamari growth.

**User ke chune hue scope:** dono levels, aur in sab ka data: expenses, customer source, leads, price history, stop reason, wastage reporting, daily consumption (material), finance aur inventory.

## Sidhant
1. **Billing ka hisaab ek hi jagah se.** Daam ki history, subscriptions aur band mahine ke statements [core-domain-v2.md](core-domain-v2.md) mein hain. Ye plan unhi ko padhta hai, apna billing logic nahi banata.
2. **Ek entry, kai reports.** Ek material purchase se teen cheezein hongi: ek expense, ek stock entry, aur cost per unit update. Owner ko do baar data nahi bharna padega.
3. **Pure logic `src/lib/` mein, aur tested.** P&L, cohort, churn, stock forecast aur insights, sab ke liye `node --test`.
4. **Roz ke numbers `DailyOrgStat` rollup mein.** Ye observability plan wali table hai, aur iska version badhakar nayi columns jodenge. Report pages isi ko padhenge.
5. **Kitchen aur kharche ki entry offline bhi ho.** Ye entries outbox ops hongi, device par bane UUID ke saath idempotent, jaise wastage ki hoti hai.
6. **Har report ke saath ek "action".** Sirf number dikhana kaafi nahi. Report ke saath batana hai ki ab kya karein, jaise "in 6 logon ko yaad dilao" ya "is area mein poster lagao".

---

## Part 1: Naya data capture (foundation)

### 1a. Price aur plan history → ab [core-domain-v2.md](core-domain-v2.md) mein
Pehle yahan `PlanPrice` aur `CustomerPlanPeriod` the. Ab ye kaam core domain v2 karta hai: `PlanVersion` (daam `effectiveFrom` ke saath), `Subscription` + `SubscriptionPause`, ek hi billing engine, aur band mahine ke statements. Is plan ke saare reports usi engine aur statements se "kamai" padhenge. Do jagah alag models nahi banenge.

### 1b. Customer: source, referral, stop reason
`Customer` model mein ye fields judenge:
- `source CustomerSource?`: `referral | whatsapp | poster | walk_in | online | reseller | other`
- `referredById String? @db.Uuid`: referral dene wala customer, isi org ka
- `endReason EndReason?`: `moved | price | taste | quality | delivery | home_food | temporary | other`. Har subscription ka apna reason `Subscription.endReason` mein hota hai (core-domain-v2). Customer ka reason uske aakhri subscription ka reason hai.
- `endNote String?`

UI mein ye sab ek tap mein:
- Customer form mein source ke liye `FormRadioGroup` chips.
- "Band karo" par `Drawer` khulega jisme reason poochha jaayega.
- Portal se customer khud plan rokta hai to bhi reason poochha jaayega (optional).

### 1c. Leads (enquiry)
```prisma
model Lead {
  id String @id @default(uuid(7)) @db.Uuid  orgId String @db.Uuid
  name String  phone String?  area String?  source CustomerSource?
  status LeadStatus @default(new)   // new | contacted | trial | won | lost
  lostReason EndReason?  followUpOn DateTime? @db.Date  note String?
  customerId String? @db.Uuid       // won → kaun sa customer bana
  createdBy String? @db.Uuid  createdAt DateTime @default(now())  updatedAt DateTime @updatedAt
  @@index([orgId, status])  @@index([orgId, followUpOn])
}
```
- **Screen:** `/customers/leads`, ek tab jo customers ke saath hi rahega, kyunki bottom nav mein jagah nahi hai.
- **List:** `SwipeItem` se seedha WhatsApp ya call, aur "aaj follow-up" pehle dikhega.
- **Convert:** "Customer banao" dabane par customer form pehle se bhara hua khulega, aur lead `won` ho jaayegi.
- **Today page:** "Aaj 3 follow-up" card.

### 1d. Kharche (expenses)
```prisma
model Expense {
  id String @id @db.Uuid            // device UUID → offline idempotent
  orgId String @db.Uuid
  category ExpenseCategory          // grocery | vegetables | gas | salary | rent | electricity | packaging | transport | repair | other
  amount Decimal @db.Decimal(10,2)  paidOn DateTime @db.Date
  method PayMethod @default(cash)   vendor String?  note String?
  stockTxnId String? @db.Uuid       // material purchase se bana ho to
  recurring Boolean @default(false) // kiraya/salary: har mahine yaad dilao
  createdBy String? @db.Uuid  createdAt DateTime @default(now())
  @@index([orgId, paidOn])
}
```
- **Screen:** `/expenses`. Entry `FormAmountInput` ke saath bade category icons se hogi, aur yahin aaj aur is mahine ka total dikhega.
- **Offline:** outbox op `expense`. `src/lib/sync.ts` ke `parseOp` mein naya op, `src/server/mutations.ts` mein `createMany skipDuplicates`.
- **Recurring kharche:** recurring wale kharche mahine ki 1 tareekh ko "Kiraya ₹8000 daalein?" jaisa reminder dikhayenge. Ye kharcha apne aap kabhi nahi judega.

### 1e. Inventory + daily consumption
```prisma
model Material {             // atta, chawal, dal, tel, gas cylinder, dabba...
  id String @id @default(uuid()) @db.Uuid  orgId String @db.Uuid
  name String  unit MaterialUnit   // kg | litre | count | packet | cylinder
  reorderLevel Decimal? @db.Decimal(10,3)
  lastCostPerUnit Decimal? @db.Decimal(10,2)   // latest purchase se
  archived Boolean @default(false)
  @@unique([orgId, name])  @@index([orgId])
}
model StockTxn {
  id String @id @db.Uuid     // device UUID
  orgId String @db.Uuid  materialId String @db.Uuid
  kind StockKind             // purchase | use | waste | adjust (ginti ke baad)
  qty Decimal @db.Decimal(10,3)      // + ya −
  costPerUnit Decimal? @db.Decimal(10,2)
  date DateTime @db.Date  meal Meal?
  note String?  createdBy String? @db.Uuid  createdAt DateTime @default(now())
  @@index([orgId, materialId, date])
}
model DishMaterial {         // optional recipe: 1 unit dish = kitna material
  orgId String @db.Uuid  dishId String @db.Uuid  materialId String @db.Uuid
  qtyPerUnit Decimal @db.Decimal(10,4)
  @@id([dishId, materialId])
}
```
- **Stock:** stock = `Σ qty`, jo hamesha derived hoga aur kabhi alag se save nahi hoga.
- **Purchase:** purchase karne par ek `Expense` bhi apne aap banega, usi transaction mein.
- **Consumption ke do tareeke** (owner chune, More → Kitchen settings):
  - **Simple:** shaam ko ek baar "aaj kitna nikla" entry. Ye `/kitchen/stock` screen par hogi, jisme `FormNumberStepper` per material hoga.
  - **Auto:** wastage entry mein jitna `cooked` likha gaya, us par `DishMaterial` recipe lagakar `use` txns apne aap ban jaayengi. Owner ise baad mein theek kar sakta hai (`adjust`).
- **Hafte ki ginti:** "stock count" entry ek `adjust` txn banati hai. App ki ginti aur asli stock ka jo farak aaye, woh "leakage" report mein jaata hai.
- **Offline:** outbox op `stock`.
- **Existing wastage ka link:** `WastageItem.costPerUnit` ab manual nahi bharna padega. Woh `Material.lastCostPerUnit` aur recipe se apne aap aayega, aur owner chahe to usse override kar sakta hai.

---

## Part 2: Owner reports (`/reports` hub)

Ye observability plan ke hub mein hi judenge. Har report `src/lib/reports/catalogue.ts` mein ek entry hogi, aur `/reports/[key]` par khulegi:
- range: 7 / 30 / 90 din, mahina, ya custom
- `StatCard` + chart + `DataTable` + CSV/print
- har report ke neeche ek **"Kya karein"** box

### Finance
| Report | Kya dikhata hai | Kya karein |
|---|---|---|
| **P&L (munafa)** | Kamai (billed) − kharche category-wise = profit, margin % ka mahina-dar-mahina trend | "Gas ka kharcha 18% badha" |
| **Cost per tiffin** | (kharche ya raashan) ÷ tiffins delivered, aur plan-wise margin (price − cost) | "Lunch plan ka margin sirf ₹6 hai, daam badhao" |
| **Cash flow** | Aaya (collected) vs gaya (expenses), din-dar-din, aur mahine ka closing | n/a |
| **Dues ageing** | 0–7 / 8–30 / 31–60 / 60+ din, top 10 bakaya | "WhatsApp reminder bhejo" (link `src/lib/links.ts`) |
| **Break-even** | Fixed kharche ÷ (price − variable cost per tiffin) = kitne tiffin chahiye | n/a |
| **Collection efficiency** | collected ÷ billed %, aur payment method mix (UPI/cash) | n/a |

### Growth
| Report | Kya dikhata hai | Kya karein |
|---|---|---|
| **Customer growth** | Mahine mein naye − chhode = net growth, active customers ka trend | n/a |
| **Source / marketing** | Source-wise naye customers, unka retention aur revenue (LTV) | "Referral wale 3× zyada tikte hain, referral offer do" |
| **Lead funnel** | new → contacted → trial → won %, lost reasons, avg din to convert | "5 leads ka follow-up overdue" |
| **Retention cohorts** | Join-mahina × mahine baad kitne % active (heatmap table) | n/a |
| **Churn & reasons** | churn rate, endReason breakdown, churn-risk list (skip trend + dues + ending soon) | "In 4 logon se baat karo" |
| **Area-wise** | `Customer.area` ke hisaab se customers, revenue, leads aur churn | "Sector 5 mein leads hain par customer kam" |
| **Plan mix & ARPU** | plan-wise customers, avg kamai per customer, lunch/dinner/both | n/a |
| **Referral leaderboard** | Kis customer ne kitne laaye | Thank-you ya discount do |

### Kitchen
| Report | Kya dikhata hai |
|---|---|
| **Wastage** (existing ko badhana) | ₹ waste as % of revenue, reason-wise trend, weekday pattern, dish-wise, inventory cost se |
| **Daily consumption** | Material-wise roz ka use, use per tiffin ka trend, recipe ke expected se farak (anomaly) |
| **Stock & reorder** | Abhi ka stock, kitne din chalega (avg use × kal ke tiffin from `suggestCooking`), reorder list |
| **Purchase / price trend** | Material ka rate trend, vendor-wise kharcha |
| **Leakage** | Ginti vs app stock ka farak ₹ mein |

### Insights engine + monthly report
- `src/lib/insights.ts` (pure, tested). Ye **rule-based** cards hain, ML nahi: har rule `{ id, check(stats) → Insight | null, severity, actionHref }` hoga.
- Shuru ke rules:
  - margin girna
  - dues 30 din se upar
  - churn-risk badhna
  - stock 3 din se kam
  - waste target se upar (`org.wastageTargetPct`)
  - follow-up overdue
  - kisi weekday ke skips zyada hona
  - kharcha pichhle mahine se 15% zyada
- **Kahan dikhenge:** top 3 insights `/today` par ek card mein, aur saare `/reports` hub ke top par.
- **Monthly report:** mahine ki 1 tareekh ko `/reports/monthly?m=YYYY-MM` par pichhle mahine ka report card banega: P&L, growth, top dues, waste aur 3 action. Ise print/PDF kar sakte hain, aur "WhatsApp pe share" se summary text jaata hai. Ye report rollups se banta hai, alag se kuch save nahi hota.

### Rollup badlaav
`DailyOrgStat` mein ye columns judenge:
- `expenses`, `groceryCost` (paise)
- `newLeads`, `wonLeads`, `endedBy: Json` (reason counts)
- `stockValue`

`version` badhega, aur nightly job (`/api/cron/rollups`) pichhle 35 din dobara compute karega. Cohort aur LTV live queries se aayenge, kyunki 100 customers par ye sasta hai. Ye functions `src/lib/reports/cohort.ts` aur `ltv.ts` mein honge.

---

## Part 3: SaaS growth (hamara business, `/admin`)

### Data jo chahiye (Razorpay billing phase ke saath)
```prisma
model Subscription {
  id String @id @default(uuid()) @db.Uuid  orgId String @unique @db.Uuid
  plan String            // business.ts PLANS ka key (starter/growth/pro)
  status SubStatus       // trialing | active | past_due | cancelled
  amountMonthly Int      // paise, MRR ke liye
  trialEndsAt DateTime?  startedAt DateTime?  cancelledAt DateTime?
  cancelReason String?   provider String?  providerRef String?
  updatedAt DateTime @updatedAt
}
model SubscriptionEvent {  // MRR movements ka history (append-only)
  id String @id @default(uuid(7)) @db.Uuid  orgId String @db.Uuid
  kind String            // trial_started | activated | upgraded | downgraded | cancelled | reactivated | payment_failed
  mrrDelta Int  at DateTime @default(now())
  @@index([at])
}
```
`Org` mein ye fields judenge: `signupSource` (utm/referral), `resellerId?`, `city?`, `activatedAt?`.

**Activation ki definition:** pehla customer + pehli delivery + 7 din mein kam se kam 5 din use.

### Metrics
Ye `PlatformDailyStat` (long format) mein jaayenge, aur nightly rollup inhe bharega.
- **Revenue:**
  - MRR, ARR
  - new, expansion, contraction aur churned MRR, net new MRR
  - ARPA
- **Customers:**
  - total/active orgs, trial → paid conversion %, logo churn %
  - cohort retention (signup mahina)
- **Activation funnel:** signup → mess setup → pehla customer → pehli delivery → activated → paid.
- **Engagement:** weekly active orgs, kaun se feature use ho rahe hain (wastage, expenses, inventory, leads, Drive), aur feature use vs retention ka comparison.
- **Org health score:** ye `src/lib/saas-health.ts` mein hoga (pure). Score in cheezon se banega:
  - activity
  - customers ka trend
  - payment status
  - sync/backup errors

  Phir "risk" orgs ki list banegi, jisse hum unse baat karke unhe rokne ki koshish kar sakein.
- **Reseller (baad mein):** reseller-wise orgs, MRR, commission aur leaderboard.
- **Market:** city-wise orgs, aur avg mess size (customers) jise pricing tier ke saath match karke dekhenge.

### Privacy
- `/admin` sirf aggregates aur org metadata dikhata hai. Kisi customer ka naam ya phone kabhi nahi.
- Benchmarks owners ko tabhi dikhenge jab ek group mein kam se kam 5 orgs hon. Jaise: "Aapke shehar ka avg margin", "avg waste %".

---

## Permissions (Phase 0 plan mein jodna)

| Permission | Owner | Manager default | Notes |
|---|---|---|---|
| `finance.view` (P&L, cash flow, margin) | ✓ | ✗ | grantable |
| `expenses.record` | ✓ | ✓ | |
| `inventory.manage` (materials, stock, recipe) | ✓ | ✓ | |
| `stock.entry` (roz ka use, ginti) | ✓ | ✓ | cook/helper role ke liye bhi |
| `leads.manage` | ✓ | ✓ | needs `customers.view` |
| `reports.view` / `reports.export` | ✓ | ✗ | observability plan se |
| `platform.analytics` / `platform.revenue` | n/a | n/a | sirf `User.platformRole` |

## Export, i18n, docs
- `src/server/export.ts` mein ye CSVs judenge: `expenses.csv`, `materials.csv`, `stock.csv`, `leads.csv`, `plan_prices.csv` aur `customer_plans.csv`. CLAUDE.md rule hai ki naya tenant table export mein bhi jaaye.
- Har naya string `en` + `hi` dono mein jaayega. Isme categories, reasons aur insight sentences sab aate hain.
- CLAUDE.md mein naya "Finance & inventory" section, aur rule #3 ko update karna hai: ab price history hai.
- Har phase ke saath ek changeset (minor), owner ke liye likha hua.

## Phases (build order)
1. **Data foundation.** Customer source/referral/stop reason aur Leads. Price/plan history aur billing timeline ab core-domain-v2 ke P1–P2 mein hain, jo isse pehle bante hain.
2. **Finance.** Expenses (offline), P&L, cost per tiffin, cash flow, dues ageing, break-even.
3. **Inventory.** Materials, purchase → expense, roz ka use/ginti (offline), optional recipe, stock/reorder, consumption, leakage. Wastage ki cost bhi yahin se.
4. **Growth reports + insights.** Source, funnel, cohorts, churn, area, plan mix, referral, insights engine, `/today` card, monthly report + WhatsApp share.
5. **SaaS growth.** Subscription + events (Razorpay ke saath), activation, MRR rollups, health score, `/admin` dashboards, benchmarks.

Observability ke Phase 1 aur 3 (logging, rollups, charts, hub) is plan ke Phase 2 se pehle chahiye.

## Critical files
- **Nayi files:**
  - schema: `prisma/schema/{finance,inventory,growth,saas}.prisma`
  - `src/lib/`: `finance.ts`, `inventory.ts`, `insights.ts`, `saas-health.ts`, `reports/{pnl,cohort,ltv,churn,funnel,consumption}.ts`, sabke saath `*.test.ts`
  - `src/server/`: `finance.ts`, `inventory.ts`, `leads.ts`
  - `src/app/(app)/`: `expenses/*`, `kitchen/stock/*`, `customers/leads/*`, `reports/*`, `more/{materials,kitchen}`
  - `src/app/actions/`: `finance.ts`, `inventory.ts`, `leads.ts`
- **Badlenge:**
  - Billing engine aur `getBilling` ab core-domain-v2 ke andar badlenge, is plan mein nahi.
  - `src/lib/sync.ts` + `src/server/mutations.ts`: naye ops `expense` aur `stock`.
  - `src/lib/wastage.ts`: material cost.
  - `src/app/actions/{customers,settings,portal}.ts`
  - `src/server/export.ts`, `src/lib/i18n.ts`, `src/lib/validation.ts`, `src/app/(app)/today/page.tsx`
- **Reuse:**
  - `scheduledMeals` / `billing` (`src/lib/schedule.ts`)
  - `wastageReport` / `suggestCooking` (`src/lib/wastage.ts`)
  - `toCsv` (`src/lib/csv.ts`), WhatsApp links (`src/lib/links.ts`)
  - outbox pattern (`src/components/outbox.ts`, `usePendingOps`)
  - `DataTable` / `StatCard` / `SwipeItem` / `Drawer` / `QuickForm` (`@/components/ui`)

## Verification
- **Unit tests:**
  - Price timeline ke tests ab core-domain-v2 mein hain. Yahan P&L aur reports ke totals statements aur engine se match hone chahiye.
  - P&L, cost per tiffin, break-even.
  - Stock = Σ txns, days-left forecast.
  - Recipe se consumption.
  - Cohort matrix, LTV, churn score, funnel %.
  - Har insight rule ka positive aur negative case.
  - MRR movements aur health score.
  - Har naye enum ke en + hi labels.
- **Manual** (`npm run db:seed` me demo expenses, leads aur materials bhi jodenge):
  1. Plan ka daam kal se badlo (core-domain-v2 ke saath). P&L mein is mahine ki kamai din ke hisaab se do hisson mein bane, aur pichhla mahina na badle.
  2. Ek purchase daalo. Phir check karo:
     - expense bana
     - stock badha
     - wastage ki cost update hui
  3. Offline mode mein expense aur stock entry karo. Reconnect par ek hi baar save hona chahiye (`npm run build && npm start`).
  4. Ek lead ko customer mein convert karo. Funnel aur source report update honi chahiye.
  5. Kisi customer ko reason ke saath band karo. Churn report mein reason dikhna chahiye.
  6. P&L ke totals ko `/payments` billing aur expenses list se match karo.
  7. Monthly report ka print preview dekho, aur WhatsApp share ka text check karo.
  8. `/admin` mein ek test subscription par MRR aur funnel ke numbers check karo. Normal owner ke liye `/admin` band hona chahiye.
- **Har phase:** `npm test && npm run typecheck && npm run lint`, phir `npm run changeset:status`.
