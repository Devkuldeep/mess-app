# Core domain v2 plan (M-DOMAIN-V2): subscriptions, billing ledger, catalog + menu

> Roadmap: **Stage 2**, M-MENU aur M-PILOT se pehle. P4 Stage 5 mein jaata hai ([../roadmap.md](../roadmap.md)).
> Ye plan [platform-foundations.md](platform-foundations.md) ke upar banta hai: commands, paise, clock, settings registry, import aur data lifecycle registry. [business-growth.md](business-growth.md) ka "price/plan history" (1a) ab **isi plan mein** hai.

## Context
Menu, khata, add-ons, prepaid, GST bill aur discount, ye sab features teen cheezon par khade honge: customer kis plan par hai, paisa kaise ginte hain, aur dish kya hai. Teeno abhi bahut patle hain:

| Kami | Abhi ki haalat (code) | Aage kya rukega |
|---|---|---|
| Ek customer = ek plan | `Customer.planId`, `startDate`, `endDate` | Lunch aur dinner alag plan par nahi ho sakte; pause range, trial, mahine ke beech plan badalna, roommate/company accounts |
| Ek hi daam | `Plan.pricePerMeal`. History nahi, lunch/dinner ka alag daam nahi, monthly flat nahi | Daam badla to purane bill bhi badal jaate hain (CLAUDE.md rule 3 ki "known limitation") |
| Har baar poori history | `getBilling` sabse purane customer ki `startDate` se sab dobara ginta hai. `getCustomerBalance` **ek** customer ke liye **poore org** ki `getBilling` chalata hai | Do saal ke data par payments aur customer page slow hoga |
| Bheja hua bill badal jaata hai | Bill har baar derived hai | WhatsApp par gaya "Nov: ₹2,720" baad mein ₹2,660 ho sakta hai, aur bharosa toot jaata hai |
| Balance ke do formule | `getPortal` apna alag hisaab karta hai aur saare payments ghata deta hai. `billing()` sirf `paidOn ≤ month end` wale ghatata hai | Customer portal aur payments page par alag balance dikh sakta hai |
| Paise ke liye koi aur jagah nahi | Sirf meals × daam − payments | Discount, complaint ka credit, late fee, refund, "₹50 maaf", purana baaki (onboarding), prepaid pack, GST invoice number |
| Dish sirf wastage ke liye | `Dish` (`perTiffin`, `variety`) | Weekly menu, add-ons, recipe aur festival thali, sab ki apni "dish" ban jaayegi |
| Extras nahi | n/a | "Headcount mein extras" (`modules/core-operations.md` ❌), add-on store |
| Holiday poore din ka | `Holiday` (sirf date) | "Aaj sirf dinner band" nahi ho sakta |

## Sidhant
1. **Derived + frozen + ledger.**
   - Khule mahine ka bill derived rahega, taaki skip aur holiday apne aap lagein.
   - **Band mahine ka bill freeze** ho jaata hai (statement).
   - Meals ke alawa paisa ki har cheez (discount, credit, fee, refund, opening) ek **ledger entry** hai.
2. **Ek billing engine.** Pure `src/lib/billing/`. Headcount, delivery list, bill, portal, statement, reports, notifications aur export, **sab isi ko** bulayenge. Paisa kahin aur nahi gina jaayega. Isse "jo pakega wahi bill hoga".
3. **Time-versioned, overwrite nahi.**
   - Daam `effectiveFrom` ke saath, aur subscription/pause `[from, to]` ke saath.
   - History kabhi nahi mitegi. Galti sudharne ke liye reverse entry hogi, delete nahi.
4. **Purane numbers day 1 par same rahenge.** Har phase additive hai (expand/contract), aur switch tabhi hoga jab **parity test** dikhaye ki purana total = naya total, paise tak.
5. **Pricing catalogue-driven.** Pricing model zod JSON se tay hota hai. Naya model jodna = engine ka ek function + ek schema, migration nahi.
6. **Saara paisa integer paise mein** ([platform-foundations.md](platform-foundations.md) §3).

---

## 1. Subscriptions
```prisma
model Subscription {
  id          String   @id @default(uuid(7)) @db.Uuid
  orgId       String   @db.Uuid
  customerId  String   @db.Uuid
  planId      String   @db.Uuid
  startDate   DateTime @db.Date
  endDate     DateTime? @db.Date
  pricingOverride Json?          // is customer ka tay daam (jaise "aapke liye ₹55"), plan ke model ke schema se validate
  endReason   String?            // business-growth ka stop reason (catalogue)
  createdBy   String?  @db.Uuid
  createdAt   DateTime @default(now())
  version     Int      @default(0)   // optimistic concurrency (foundations §16)
  @@index([orgId, customerId])
  @@index([orgId, startDate])
}
model SubscriptionPause {
  id             String   @id @default(uuid(7)) @db.Uuid
  orgId          String   @db.Uuid
  subscriptionId String   @db.Uuid
  from           DateTime @db.Date
  to             DateTime? @db.Date      // null = "jab tak wapas na aaun"
  reason         String?
  source         String                  // owner | portal
  createdBy      String?  @db.Uuid
  createdAt      DateTime @default(now())
  @@index([orgId, subscriptionId])
}
```
- **Ek customer ke kai subscriptions** ho sakte hain, jaise lunch Plan A par aur dinner Plan B par. **Rule:** ek customer ke liye, ek meal par, ek din mein sirf ek subscription active ho sakta hai. Ye pure `overlaps()` se check hota hai, command ke andar.
- **Status derived hai**, alag se save nahi hota. Kisi bhi din ka status `[start, end]` aur pauses se nikalta hai: `upcoming`, `active`, `paused` ya `ended`.
- **Mahine ke beech plan badalna:** command `subscription.change` purane subscription ko D−1 par khatam karta hai aur naya D se shuru karta hai, isliye bill din ke hisaab se sahi bantega.
- **Trial:** ye ek plan hai jiska `kind: trial` hai, jaise ₹49 ka 1 din ka trial. Trial ke baad customer naye subscription par convert hota hai. Alag field nahi chahiye.
- **Pause:** pause ke din na banenge, na bill mein judenge. Pehle din par customer portal se pause bhi skip wala cutoff maanega. Monthly-flat plan mein pause ka credit plan ka rule tay karega (§2).
- **Customer band karna:** `customer.stop` us customer ke saare subscriptions `endDate` se khatam kar deta hai. `Customer.startDate` ab sirf "kab juda" batayega, aur active hai ya nahi, ye subscriptions se nikalega.
- **Payer aur khane wala alag ho to** (company account, roommate split, parent link: Stage 6): baad mein `BillingAccount` table additive judegi. Engine ke functions abhi se "customers ka group" input lete hain, isliye unka logic dobara nahi likhna padega.

## 2. Plans, plan versions aur pricing models
```prisma
model Plan {               // pehchaan: naam aur meals (pehle se hai, columns judenge)
  id, orgId, name, meals MealPlan,
  kind      String  @default("regular")   // regular | trial | pack
  archived  Boolean @default(false)       // plan delete nahi hota, archive hota hai
  sortOrder Int     @default(0)
  version   Int     @default(0)
}
model PlanVersion {        // daam kab se kya
  id            String   @id @default(uuid(7)) @db.Uuid
  orgId         String   @db.Uuid
  planId        String   @db.Uuid
  effectiveFrom DateTime @db.Date
  pricing       Json                     // src/lib/billing/pricing.ts ke zod schema se
  createdBy     String?  @db.Uuid
  createdAt     DateTime @default(now())
  @@unique([planId, effectiveFrom])
}
```
**Pricing models** (`src/lib/billing/pricing.ts`, discriminated union):

| Model | Fields | Kab |
|---|---|---|
| `perMeal` | `lunchPaise`, `dinnerPaise` (default dono same) | **P1**: aaj jaisa, plus lunch aur dinner ka alag daam |
| `monthlyFlat` | `monthlyPaise`, `freeSkips` ("4 chhutti free"), `skipCreditPaise` (uske baad har skip par itna kam), `holidayCredit: full \| none`, `pauseCredit: full \| asSkip`, `prorate: byDays \| none` (mahine ke beech join karne par) | **P1b**, agar pilot owners isi tarah charge karte hain (khula sawal) |
| `pack` | `meals` (jaise 26), `pricePaise`, `validityDays` | **P4**: prepaid packs |

- **Daam badalna:** `plan.save` mein daam badalne par poocha jaayega "Kab se?" (default kal), aur ek **naya PlanVersion** banega. Purana version overwrite nahi hota. Jo version kisi band mahine ke statement mein use ho chuka hai, use edit nahi kar sakte.
- **Customer ka daam:** customer ka `pricingOverride` usi plan ke model ka hissa badalta hai (`perMeal` mein `lunchPaise`).
- `versionOn(versions, date)` pure hai, aur tested.

## 3. Calendar
- **`Holiday` mein `meal Meal?` judega.** `null` = poora din band (aaj jaisa), `lunch` ya `dinner` = sirf woh meal band.
- **Skip** waisa hi rahega (`customerId + date + meal`, `byCustomer`). Cutoff ka rule bhi wahi rahega: `isSkipLocked` + org ka cutoff (settings registry `skip.cutoffHour`).
- **Pure helper:** `isClosed(date, meal, holidays)`.

## 4. Billing engine (pure, `src/lib/billing/`)
```ts
mealsDue(input, from, to): ScheduledMeal[]
// subscriptions + pauses + holidays(meal-wise) + skips → kaun sa meal kis customer ka banega
// headcount (getDayCount) aur delivery list ab yahi bulayenge, abhi ka scheduledMeals() isi mein jaayega

computeCharges(input, period): { lines: ChargeLine[]; byCustomer: Map<customerId, CustomerCharges> }
type ChargeLine = { customerId; subscriptionId?; date?; meal?; planVersionId?; qty: number; amountPaise: Paise;
  kind: "meal" | "monthly" | "proration" | "skipCredit" | "holidayCredit" | "pauseCredit" | "addon" | "packUse" };
```
- **Input:** subscriptions, versions by plan, pauses, holidays, skips, add-on orders (§9), deliveries (sirf jab `billing.chargeBasis = delivered`), aur settings.
- **`billing.chargeBasis`** (settings registry):
  - `scheduled` (default, aaj jaisa): jo meal bana uska paisa.
  - `delivered`: sirf delivered meals ka paisa.
- **Lines ki wajah se bill samjhaya ja sakta hai.** Portal aur owner dono "bill ka hisaab" dekh sakte hain: "18 lunch × ₹60, 2 skip, 1 holiday, +4 roti × ₹8".
- **Tests:**
  - Property tests: random subscriptions, pauses, holidays aur skips par `mealsDue` aur `computeCharges` ek dusre se match karein.
  - Har pricing model ke edge cases: mahine ke beech join, pause mahine ke paar, aur free skips ka quota.

## 5. Ledger (meals ke alawa paisa)
```prisma
model LedgerEntry {
  id          String   @id @db.Uuid       // command/device uuid → idempotent
  orgId       String   @db.Uuid
  customerId  String   @db.Uuid
  kind        String                       // catalogue (neeche)
  amountPaise Int                          // + = customer ka dena badha (debit) · − = customer ke haq mein (credit)
  effectiveOn DateTime @db.Date            // kis din ka maamla
  period      String                       // "YYYY-MM": kis statement mein jaayega (hamesha khula period)
  reason      String?
  refType     String?  refId String?       // jaise complaint, band statement, ya void ki gayi entry
  createdBy   String?  @db.Uuid
  createdAt   DateTime @default(now())
  @@index([orgId, customerId, period])
}
```
**Kind catalogue** (`src/lib/billing/ledger.ts`). Har kind ka sign aur permission tay hai:

| Kind | Sign | Kab | Permission |
|---|---|---|---|
| `opening` | ± | Onboarding mein "purana baaki/advance" (register se) | `ledger.adjust` |
| `adjustment` | ± | Haath se sudhaar, ya band mahine ki galti ka sudhaar | `ledger.adjust` |
| `discount` | − | "Is mahine ₹200 kam" | `ledger.adjust` |
| `credit` | − | Complaint ka auto-credit (M-ENGAGE) | system/owner |
| `late_fee` | + | Udhaar ki der par (M-PAYMENTS+) | system/owner |
| `refund` | + | Mess ne customer ka advance wapas kiya | `ledger.adjust` |
| `write_off` | − | "₹50 maaf" | `ledger.adjust` |
| `pack_purchase` | + | Prepaid pack becha (P4) | `payments.record` |
| `void` | ulta | Kisi galat entry ko radd karna (delete nahi) | `ledger.adjust` |

**Payments ka `Payment` table** waisa hi rahega (offline, device uuid). Usme **`period String`** judega, yaani payment kis mahine ke hisaab mein jaayega. Ye insert par nikalta hai: `max(khula period, paidOn ka period)`.
- **Der se sync hua offline payment:** misaal, 30 Nov ka payment 4 Dec ko sync hua aur Nov pehle hi band ho chuka tha. Ye **Dec mein judega**, aur `paidOn` asli tareekh hi rahegi. Paisa aana ek sach hai, isliye ise kabhi reject nahi karte.
- **Payment delete** tabhi ho sakta hai jab uska period khula ho. Band period ka payment ho to ek `adjustment`/reverse entry banegi.

## 6. Billing periods, statements aur "mahina band karo"
```prisma
model BillingPeriod {
  orgId     String   @db.Uuid
  period    String                 // "YYYY-MM"
  status    String                 // open | closed
  closedAt  DateTime?  closedBy String? @db.Uuid
  @@id([orgId, period])
}
model Statement {                   // ek customer ka ek mahine ka band bill (freeze)
  id            String  @id @default(uuid(7)) @db.Uuid
  orgId         String  @db.Uuid
  customerId    String  @db.Uuid
  period        String
  openingPaise  Int
  mealCount     Int     mealPaise Int    addonPaise Int    creditsPaise Int     // engine se
  ledgerPaise   Int                                                            // Σ ledger entries (signed)
  paymentsPaise Int
  closingPaise  Int     // = opening + meal + addon − credits + ledger − payments
  lines         Json    // summary: plan version × meals × daam, kind-wise totals (portal ke "hisaab" ke liye)
  invoiceNo     String? // GST on ho to (M-PAYMENTS+), OrgCounter se gapless
  createdAt     DateTime @default(now())
  @@unique([orgId, customerId, period])
}
```
**Close karna** (`period.close`, permission `billing.close`):
- **Shartein:**
  - Chalu mahina band nahi ho sakta.
  - Mahine order mein band honge: pehle pichhla, phir agla.
- **Kya hota hai:**
  1. Engine us mahine ka hisaab abhi ke data se nikalta hai.
  2. Har customer ka `Statement` banta hai (jiska koi bhi hisaab ho, ya opening 0 na ho).
  3. Period `closed` ho jaata hai.
  4. Event `period.closed` jaata hai. M-NOTIFY har statement se `bill.monthly` bhejega, isliye **WhatsApp par gaya text hamesha app ke bill se match karega**.
- **Ek transaction mein** hota hai. Bade org ke liye job ke batches mein (M-EVENTS ke baad).
- **Preview:** close se pehle "Nov ke bills" screen dikhegi, jahan owner adjustments kar sakta hai aur phir "Band karo" dabata hai.
- **Auto-close:** setting `billing.autoCloseDay` (default 3; 0 = sirf haath se) ke hisaab se cron `/api/cron/period-close` roz chalta hai (drive-backup wala auth pattern). Baad mein ye M-EVENTS ka schedule ban jaayega. Close hone par owner ko notice: "Nov ke bills ban gaye".

**Band mahine ki suraksha:** jo commands kisi tareekh ka data badalte hain, woh pure helper `assertOpen(date)` chalayenge:
- `skip.set`, `holiday.add`/`holiday.remove`
- subscription aur pause badlav, add-on orders
- `delivery.set`, jab chargeBasis = delivered ho

Band mahine ki tareekh par error `invalid` milega (key `periodClosed`), saath mein hint: "Adjustment se sudhaaro". Owner ek tap mein us statement ke liye khule mahine mein `adjustment` bana sakta hai.

**Reopen** (`period.reopen`):
- Sirf **sabse aakhri** band mahina, sirf `billing.close` wala.
- Agar uske kisi statement ka `invoiceNo` hai to nahi khulega. GST invoice nahi badalte, unke liye credit note (M-PAYMENTS+).
- Reopen par statements delete ho jaate hain aur audit hota hai. Dobara close karne par naye bante hain.

## 7. Balance aur reads (tez raasta)
```
balanceOf(customer) = aakhri Statement.closingPaise (ya 0)
                    + computeCharges(khule periods: pehle khule mahine se aaj tak)
                    + Σ ledger (khule periods) − Σ payments (khule periods)
```
- **Sirf khula mahina gina jaata hai.** Customer page, portal aur reminders ka balance ab ek mahine ke data se aata hai, poori history se nahi.
- **`getBilling(month)`:** band mahina ho to statements padho, khula ho to engine.
- **Portal** (`getPortal`) ab apna formula nahi chalata. Wo `balanceOf` + is mahine ki lines + purane bills ki list dikhata hai. Isse portal aur payments page ka balance hamesha same rahega.
- **Ek hi engine sab jagah:** `getDayCount` aur `getDeliveryList` ke liye `mealsDue` + add-ons ka summary, aur observability ke `DailyOrgStat` aur business-growth ke P&L ke liye bhi engine/statements.

## 8. Catalog (ek Dish) + weekly menu
**Catalog:** `Dish` hi poori catalog hai. Table rename nahi kar rahe, isse churn bachta hai. Ye columns judenge:
- `kind`: `dish` (aaj jaisa) ya `addon` (alag bikne wali cheez: roti, sweet, chaas)
- `pricePaise Int?`: add-ons ka daam
- `diet`: `veg | nonveg | jain`
- `tags String[]`: catalogue `vrat | jain | no_onion | spicy …`
- `photoFileId?`: foundations §12 storage se

Wastage ke fields (`unit`, `perTiffin`, `variety`, `costPerUnit`) waise hi rahenge. Recipe (`DishMaterial`, business-growth) bhi isi `Dish` se judegi.

**Menu:**
```prisma
model MenuTemplateItem {   // hafte ka pattern: weekday × meal → dishes
  orgId String @db.Uuid  weekday Int /* 0–6 */  meal Meal  dishId String @db.Uuid
  diet  String @default("all")    // all | veg | nonveg (veg ko paneer, non-veg ko chicken)
  sortOrder Int @default(0)
  @@id([orgId, weekday, meal, dishId, diet])
}
model MenuDay {            // kisi ek din ka badlaav (row hai = override hai)
  orgId String @db.Uuid  date DateTime @db.Date  meal Meal  note String?  special Boolean @default(false)
  @@id([orgId, date, meal])
}
model MenuDayItem {
  orgId String @db.Uuid  date DateTime @db.Date  meal Meal  dishId String @db.Uuid
  label String?            // variety dish ka aaj ka naam: "Sabzi" → "Bhindi"
  diet  String @default("all")  sortOrder Int @default(0)
  @@id([orgId, date, meal, dishId, diet])
}
```
- **Kaunsa menu kab:** pure `menuFor(date, meal, diet)` pehle us din ka override dekhta hai, aur override na ho to hafte ka pattern.
- **Wastage se judav:** wastage entry mein variety dish ka naam menu se pehle se bhara aayega. Abhi owner use "kaunsi?" ke jawab mein typing karta hai.
- **Customer portal:** is hafte ka menu (setting `menu.showOnPortal`).
- **Aage:** `menu.tomorrow` notification, aur festival thali (`MenuDay.special` + pre-booking, M-FESTIVAL).
- **M-MENU** ab is data par **UI** hai (owner ki menu screen aur portal view). Iska plan alag likhna hai, par chhota hoga.

## 9. Add-ons / extras
```prisma
model AddonOrder {
  id         String   @id @db.Uuid      // device uuid → offline idempotent
  orgId      String   @db.Uuid
  customerId String   @db.Uuid
  date       DateTime @db.Date   meal Meal
  dishId     String   @db.Uuid            // kind = addon
  qty        Int
  unitPricePaise Int                      // order ke waqt ka daam (snapshot)
  source     String                       // owner | delivery | portal
  createdBy  String?  @db.Uuid  createdAt DateTime @default(now())
  @@index([orgId, date])
}
```
- **Kahan dikhega:**
  - **Headcount** (`/today`): "Extra: roti 12, sweet 4".
  - **Delivery list:** "+2 roti".
  - **Bill:** `addon` line.
- **Kaun order kar sakta hai:**
  - Owner, manager aur (grant milne par) delivery boy kabhi bhi. Ye **offline** outbox op `addon` hai (`src/lib/sync.ts` mein naya kind, `src/server/mutations.ts` ke sync adapter se).
  - Customer portal se cutoff se pehle (P4, setting `addons.portalOrdering`).
- **Roz ke extras** ("roz 2 extra roti") subscription ka `extras` rule banenge, jinhe engine har din ke liye phaila dega (P4).

## 10. Customer profile v2 (chhota)
- **`prefs String[]`:** catalogue `jain | no_onion_garlic | less_spicy | less_oil | vrat`. Kitchen ke liye `/today` par ginti dikhegi ("Jain: 4, kam teekha: 6"). `notes` free text waisa hi rahega.
- **`searchKey`:** Hindi aur English naam se search (foundations §15).

## 11. Foundations ke saath judav
- **Commands** (foundations §5):
  - subscriptions: `subscription.start`/`change`/`end`, `pause.add`/`pause.end`
  - plans: `plan.save` (daam badla to naya version)
  - ledger: `ledger.add`, `ledger.void`
  - periods: `period.close`, `period.reopen`
  - menu: `menu.setTemplate`, `menu.setDay`
  - add-ons: `addon.order`, `addon.cancel`
  - `customer.prefs.set`
- **Permissions** ([roles-permissions.md](roles-permissions.md) mein jodna):

  | Permission | Owner | Manager default | Notes |
  |---|---|---|---|
  | `subscriptions.edit` | ✓ | ✓ | needs `customers.edit` |
  | `menu.edit` | ✓ | ✓ | |
  | `addons.order` | ✓ | ✓ | delivery ko grantable |
  | `ledger.adjust` | ✓ | ✗ | grantable |
  | `billing.close` | ✓ | ✗ | grantable |

- **Settings** (registry): `billing.chargeBasis`, `billing.autoCloseDay`, `billing.showLinesOnPortal`, `menu.showOnPortal`, `addons.portalOrdering`.
- **Entitlements:** `billing.packs` aur `billing.gstInvoice` ke keys ke skeleton. Pricing tay hone par inhe plans par lagayenge.
- **Events aur audit** (ek hi vocabulary):
  - `subscription.started`, `subscription.ended`, `subscription.paused`
  - `period.closed`, `statement.created`
  - `ledger.entry_added`, `addon.ordered`, `menu.published`
- **Offline:**
  - **Offline chalne wale:** payments (pehle se) aur `addon` op (naya).
  - **Online-only:** subscriptions, pauses, plans, menu, ledger aur period close.
- **Data lifecycle registry + export:** `subscriptions.csv`, `subscription_pauses.csv`, `plan_versions.csv`, `ledger.csv`, `statements.csv`, `menu_template.csv`, `menu_days.csv`, `addon_orders.csv`. `BillingPeriod` `data.json` mein jaayega.
- **Import (foundations §13):** customers ka import ab subscription bhi banata hai. Purana baaki `opening` entry ban kar aata hai (M-ONBOARD).

## 12. Migration (har phase additive, parity ke saath)
**P1: subscriptions + plan versions**
1. Naye tables banao (expand).
2. **Backfill:**
   - Har plan ka ek `PlanVersion` banega, `effectiveFrom` = org ke sabse purane customer ki `startDate` (ya plan ki `createdAt`, jo pehle ho). Pricing `perMeal`, jisme lunch aur dinner dono = aaj ka `pricePerMeal`.
   - Jis customer ka `planId` hai, uska ek `Subscription` banega (`startDate`/`endDate` se).
3. **Dual-write:** purana customer form `planId` bhejta hai to command subscription bhi likhega.
4. **Parity:** har org × har mahine (pehle customer se aaj tak) mein purana `billing()` == naya engine, paise tak.
   - Ye integration tests mein fixtures par chalta hai.
   - Ek baar production ke Neon branch snapshot par bhi: `scripts/parity-billing.ts`, jo **zero diff** maangta hai.
5. **Switch:** flag `domainV2` se. Pehle pilot orgs, phir sab.
6. **Contract** (agli release mein): `Customer.planId` aur `Plan.pricePerMeal` hatao.

**P2: ledger + periods + statements**
1. Naye tables banao. `Payment` mein `period` judega, aur purane payments mein `period(paidOn)` bhara jaayega.
2. **Backfill:** har pichhle mahine ka (chalu mahine se pehle) engine se `Statement` bana kar use band karo.
3. **Parity:** har customer ke liye naya `balanceOf` == purana `getCustomerBalance`.
4. Phir reads switch karo: payments page, customer page, portal aur export.
5. "Naya kya hai" (M-SUPPORT) mein owners ko batao ki ab har mahine ka bill freeze hoga.

**P3: catalog + menu + basic add-ons + prefs**
- Sab additive hai. `Dish.kind` ka default `dish`. Backfill ki zaroorat nahi.

**P4: packs, portal add-ons, roz ke extras, monthlyFlat** (agar P1b mein nahi bana)
- Sab additive hai.

## 13. Phases aur roadmap
| Phase | Kya | Stage | Depends on |
|---|---|---|---|
| **P1** | Subscriptions, pauses, PlanVersion (`perMeal` + lunch/dinner alag), meal-wise holiday, engine `mealsDue`/`computeCharges` | 2 (pilot se pehle) | M-FOUNDATION P1 (commands, paise, clock), M-ROLES |
| **P1b** | `monthlyFlat` pricing | 2, agar pilot owners maangein | P1 |
| **P2** | Ledger, payment period, BillingPeriod, Statement, close/reopen/auto-close, `balanceOf`, portal | 2 (pilot ke bills isi se) | P1, settings registry (foundations §9) |
| **P3** | Dish catalog columns, weekly menu, wastage prefill, basic add-ons (owner/delivery, offline), customer prefs | 2 (M-MENU iske upar) | P1, storage (photo ke liye, optional) |
| **P4** | Prepaid packs, portal add-ons, roz ke extras, GST invoice number (`OrgCounter`) | 5 (M-PAYMENTS+ ke saath) | P2, M-BILL/M-COLLECT |

## 14. Dusre plans par asar
| Plan / module | Kya badla |
|---|---|
| [business-growth.md](business-growth.md) | 1a (PlanPrice, CustomerPlanPeriod) ki jagah §1–2. Stop reason ab `Subscription.endReason` mein, aur customer ka reason uske aakhri subscription se. P&L ki "kamai" statements aur engine se. Cost per tiffin ke liye `mealCount` |
| [observability.md](observability.md) | `DailyOrgStat` ke `billed`, `scheduled*` aur `skipped` engine se. Rollup aur bill kabhi alag nahi honge |
| [notifications.md](notifications.md) | `bill.monthly` ab `statement.created` se. `dues.reminder` `balanceOf` se. `menu.tomorrow` `menuFor` se |
| [platform-foundations.md](platform-foundations.md) | Engine paise mein. Naye commands, settings keys aur registry entries. Import se opening balance aur subscriptions |
| [roles-permissions.md](roles-permissions.md) | §11 ki 5 nayi permissions |
| [../modules/core-operations.md](../modules/core-operations.md) | Pause from–to, extras aur weekly menu ab isi plan ke data par |
| M-COLLECT / M-PAYMENTS+ | Payment matching statements aur `balanceOf` se. Udhaar limit `balanceOf` par. Late fee aur prepaid pack ledger kinds hain. GST bill = statement + `invoiceNo` |

## Khule sawal (pilot interviews mein poochna)
> Ye roadmap ke Decision register mein **Q5–Q7** hain. Jawab wahin record karo.

1. Kitne owners **monthly fixed** charge karte hain, aur "kitni chhutti free" dete hain? Iska jawab P1b ka faisla karega.
2. Mahina kis din band ho? Default 3 tareekh rakha hai.
3. Bill **bane hue** meals ka ho ya **delivered** ka? Default "bane hue" (aaj jaisa).
4. Trial ka daam kaise lete hain? ₹49 ka 1 din, ya pehla hafta sasta?
5. Kitne owners GST registered hain? Isse P4 ka invoice number ka faisla hoga.

## Exit gate (P1–P3, Stage 2 ke liye)
- [ ] Parity: engine == purana billing (fixtures + production snapshot par zero diff)
- [ ] Daam "kal se" badalne par purana mahina waisa hi rahe, aur is mahine ka bill din ke hisaab se do hisson mein bane
- [ ] Pilot orgs ke bills band statements se banein, aur portal aur payments page ka balance ek hi function se aaye
- [ ] Customer page ka balance sirf khule mahine ka data padhe (query count test)
- [ ] Weekly menu + kisi din ka override live, wastage mein variety pehle se bhari
- [ ] Extras headcount, delivery list aur bill teeno mein dikhein, offline bhi

## Verification
- **Unit (`src/lib/billing/*.test.ts`):**
  - Har pricing model: mahine ke beech join, pause mahine ke paar, free skips khatam hone ke baad credit, aur holiday credit.
  - `versionOn`, `overlaps`, `assertOpen`, aur statement ka closing formula.
  - Ledger ke sign rules (galat sign → `invalid`).
  - `menuFor` (override > pattern, diet), aur add-on lines.
  - Property test: `mealsDue` ka count = `computeCharges` ki meal lines.
- **Integration:**
  - **Price change:** plan ka daam 15 Dec se badlo → Nov ka statement same rahe, aur Dec mein 14 din purana daam, baaki naya.
  - **Plan change:** 10 tareekh ko lunch plan badlo → do subscriptions, aur bill sahi.
  - **Pause:** 5–12 tareekh → na headcount mein aaye, na bill mein. Portal se pause cutoff ke baad pehla din na le.
  - **Close:** Nov band karo → statements bane, `period.closed` event aaye, aur Nov ka holiday jodne par `periodClosed` mile (Hindi mein). Adjustment Dec mein dikhe.
  - **Late sync:** 30 Nov ka offline payment 4 Dec ko sync ho, aur Nov pehle hi band ho → payment Dec mein jaaye aur Nov ka statement na badle.
  - **Reopen:** sirf aakhri mahina khule. `invoiceNo` ho to mana ho.
  - **Delete:** band period ka payment delete karne par mana ho, aur reverse entry ka raasta mile.
  - **Portal parity:** portal ka balance = payments page ka balance. Future-dated payment wala purana farak ab nahi aana chahiye.
  - **Performance:** 2 saal ke data wale fixture par customer page ka balance sirf 1 mahine ki queries kare.
- **E2E:** production-readiness ke flows. Usme payment aur balance wale flows naye statements ke saath, aur ek naya flow "menu banao → portal par dikhe".
- **Har phase:** `npm test && npm run typecheck && npm run lint`, aur `npm run changeset` (owner ke liye, jaise "Har mahine ka bill ab band hota hai, aur daam badalne se purane bill nahi badlenge").
