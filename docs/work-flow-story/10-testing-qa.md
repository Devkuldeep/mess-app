# 10. Testing aur QA: kya, kab aur kaise test karna

## 📖 Kahani
Isha (QA) Sprint 2 mein aayi. Pehle hafte mein usne teen bug pakde jo developers ne "test kar liya" bola tha:
1. **Raat theek 9:00:00 par** skip ho gaya, jabki cutoff 9 baje ka tha. Boundary ki galti nikli: `>` likha tha, `>=` chahiye tha.
2. **Offline mein do baar "Save"** dabane par do payments ban gayi. Button disable nahi tha, aur dono ki id alag bani.
3. **Chhote phone par** Hindi text "बकाया राशि" button se bahar nikal raha tha.

Isha: "Developer sochta hai 'kaise chalega'. Tester sochta hai **'kaise tootega'**. Dono chahiye." Tum ne us din se har feature mein "kaise tootega" ki list banana shuru kiya.

## 🏢 Industry mein kaise hota hai

### 1. Testing ke prakaar
| Type | Kya | Kaun / kab | Is app ka misaal |
|---|---|---|---|
| **Unit** | Ek function, bina DB/network | Developer, har PR | `isSkipLocked`, `billing()`, `parseOp` |
| **Integration** | Kai hisse saath mein (code + DB) | Developer, CI | `applyPayment` asli Postgres par, tenant isolation |
| **E2E** | Poora user flow, asli browser | QA/dev, CI | Login → customer → offline delivery → sync |
| Contract | Do systems ke beech API ka agreement | Jab alag teams/services hon | Webhook payload |
| **Smoke** | Deploy ke baad "zinda hai?" | CI/CD | `/api/health`, `/login`, `/sw.js` |
| Sanity | Chhote fix ke baad us hisse ki jaldi jaanch | QA | Fix ke baad cutoff screen |
| **Regression** | Purane features abhi bhi chal rahe hain | Har release | Poori e2e suite |
| Performance / load / stress | Speed, load aur toot-ne ki seema | Release se pehle | 100 customers ka sync |
| Security | Kamzoriyan | Security review, pentest | IDOR, rate limit |
| Accessibility | Sabke liye usable | axe + manual | Labels, contrast |
| Usability | Asli user samajh paata hai? | Designer + users | Owner task test |
| Compatibility | Devices/browsers | QA | Sasta Android, TWA, iOS Safari |
| **UAT** | User Acceptance Testing: client/user ka "haan" | Pilot owners | Sunita didi ka 1 hafta |
| Exploratory | Bina script ke "todne" ki koshish | QA | "Agar network beech mein gaya to?" |

### 2. Test pyramid
```
        /\     E2E (kam, dheeme, mehnge): critical flows
       /  \    Integration (beech mein): DB, API, tenancy
      /____\   Unit (bahut, tez, saste): pure logic
```
**Is repo ki taakat:** pure logic `src/lib/` mein hai (rule 13), isliye bahut saare tez unit tests (`node --test`) aaraam se likh sakte ho.

### 3. Test design techniques: kaunse cases chunein
- **Boundary Value Analysis:** cutoff 21:00 → 20:59:59 ✅, 21:00:00 ❌, 21:00:01 ❌. Amount → 0 ❌, 0.01 ✅, 1e7 ❌.
- **Equivalence partitioning:** phone numbers ko groups mein baanto: valid 10-digit, +91 wala, 0 wala, chhota, letters. Har group ka ek case.
- **Decision table:** holiday × skip × plan:

| Holiday? | Skip? | Plan mein meal? | Charge? | Count mein? |
|---|---|---|---|---|
| Haan | n/a | n/a | Nahi | Nahi |
| Nahi | Haan | Haan | Nahi | Nahi |
| Nahi | Nahi | Haan | Haan | Haan |
| Nahi | Nahi | Nahi | Nahi | Nahi |

- **State transition:** subscription: upcoming → active → paused → active → ended. Har teer (transition) ka test, aur galat teer bhi (ended → paused ❌).
- **Property-based:** random inputs par niyam sahi rahein, jaise "jitne meals bane, utni hi meal lines bill mein" (core-domain-v2).

### 4. Test data
- **Fixtures/factories:** `makeOrg()`, `makeCustomer()`. Har test apna data banaye, taaki tests ek dusre par depend na karein.
- **Seed** demo ke liye hai (`npm run db:seed`). **Production data kabhi test mein nahi.**
- Time par depend tests ke liye **clock inject** karo (foundations §2), warna tests raat 9 baje fail honge (flaky).

### 5. Flaky tests (kabhi pass, kabhi fail)
| Wajah | Ilaaj |
|---|---|
| Time/date | Injected clock |
| Network | Fake provider (jaise `GOOGLE_TEST_BASE`) |
| Test ka order | Har test apna data, cleanup |
| Animation/timing (E2E) | "Element dikhne tak ruko" assertions, fixed sleep nahi |
| Shared state | Isolation (alag org per test) |

**Rule:** flaky test ko turant theek karo ya quarantine karo. "Phir se chala do" ki aadat CI ko bekaar bana deti hai.

### 6. QA ka process
- **Test plan:** scope, kya test hoga aur kya nahi, environments, devices, risks, aur entry/exit criteria.
- **Test cases:** steps, expected result, data (neeche namuna).
- **Bug lifecycle:** New → Triaged → In progress → Fixed → **Verified** (QA) → Closed, ya Reopened.
- **Severity vs priority:**
  - severity = kitna nuksaan
  - priority = kitni jaldi theek karna hai
  - Misaal: "Bill galat" = severity critical + priority P0. "About page ka typo" = minor + P3.
- **Release testing:**
  - regression suite
  - device matrix (sasta Android, TWA, iOS Safari, desktop)
  - deploy ke baad smoke

### 7. Coverage ka sach
- Coverage % batata hai ki **kitna code chala**. Ye nahi batata ki **sahi check hua**.
- 100% coverage ke bina bhi achhe tests ho sakte hain, aur 100% ke saath bekaar bhi.
- **Mutation testing** (code mein jaan-boojh kar bug daal kar dekhna ki test pakadta hai ya nahi) asli taakat napta hai.
- Zaroori logic par dhyan do: paisa, permissions, offline, cutoff.

### 8. Shift-left: quality sabki zimmedari
- QA "aakhri safety net" nahi hai. Testing requirements ke waqt se shuru hoti hai: testable AC (chapter 02).
- Developer apne tests khud likhta hai. QA exploratory testing, regression, devices aur UAT par dhyan deta hai.

## 👨‍💻 Developer deep dive: is repo mein test likhna
```ts
// src/lib/*.test.ts: node --test, relative import .ts extension ke saath (rule 13)
import { test } from "node:test";
import assert from "node:assert/strict";
import { isSkipLocked } from "./dates.ts";

test("cutoff 21:00 IST: 20:59 par khula, 21:00 par band", () => {
  const tz = "Asia/Kolkata";
  assert.equal(isSkipLocked("2026-12-02", 21, tz, new Date("2026-12-01T20:59:00+05:30")), false);
  assert.equal(isSkipLocked("2026-12-02", 21, tz, new Date("2026-12-01T21:00:00+05:30")), true);
});
```
```bash
npm test                              # saare unit tests
node --test src/lib/dates.test.ts     # ek file (agar bani ho)
```
**Achhe test ki pehchaan:**
- naam batata hai ki kya umeed hai
- ek test, ek baat
- Arrange / Act / Assert
- fail hone par message saaf ho
- tez chale

## 📄 Namuna 1: test cases
| ID | Scenario | Steps | Expected |
|---|---|---|---|
| TC-31 | Skip cutoff se pehle | 20:30 par kal ka lunch skip karo | Skipped dikhe, owner count −1 |
| TC-32 | Skip cutoff par | 21:00:00 par try karo | Button band, "cutoff nikal gaya" |
| TC-33 | Offline double save | Offline → payment → 2 baar Save | Ek hi pending entry, sync par ek row |
| TC-34 | Dusre mess ka customer | URL mein dusre org ka customerId | "Nahi mila", data na dikhe |

## 📄 Namuna 2: bug report
```
Title: Offline mein Save 2 baar dabane par 2 payments ban rahi hain
Env: Production build, Android 12 (Redmi 9), Chrome 131, TWA v1.0.3
Steps: 1) Net band 2) Customer → Payment ₹500 3) "Save" jaldi-jaldi 2 baar 4) Net on
Expected: 1 payment (₹500)
Actual: 2 payments (₹500 + ₹500)
Severity: Critical (paisa)   Priority: P0
Evidence: screen recording, request id: 7f3c…
Notes: dono ops ki paymentId alag — button submit ke baad disable nahi hota
```

## ⚠️ Aam galtiyan
- Sirf happy path test karna.
- Time aur network par depend tests (flaky).
- Tests jo implementation ke detail check karte hain, behaviour nahi. Har refactor par toot jaate hain.
- Coverage ko lakshya bana dena.
- Bug fix bina regression test ke.

## ✅ Seekh
- "Kaise tootega?" ki list har feature ke saath.
- Pure logic ke liye bahut unit tests, critical flows ke liye thode E2E.
- Har bug = ek naya test.

## 🔗 Is repo mein
- `src/lib/*.test.ts` (schedule, sync, validation, wastage, table, csv, text, invite, assetlinks), `src/server/secretbox.test.ts`
- [../plan/production-readiness.md](../plan/production-readiness.md) Phase 3 (integration + e2e plan)

## 🏋️ Practice task
`src/lib/schedule.ts` ke `scheduledMeals` ke liye upar wali decision table ke chaaron cases ka test likho. Ek case aur jodo: customer ki `endDate` beech mahine mein ho.
