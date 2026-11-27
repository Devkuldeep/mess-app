# 14. Growth, scale aur team: product, tech aur career ka badhna

## 📖 Kahani: 6 mahine baad
Rasoi Labs ke paas ab 200 messes hain, 12 resellers hain, aur team 6 se badh kar 14 log ki ho gayi hai. Nayi problems aayin:
- Tara (data analyst) ne dikhaya ki **40% naye messes pehle hafte mein hi chhod dete hain**. Wajah: customers jodna bahut lamba kaam hai. Iske baad **CSV import** aur onboarding flow top priority bane.
- Payments page 300 customers wale mess par 4 second le raha tha, kyunki woh poori history dobara ginta tha. Isse **"mahina band karo" statements** ka kaam aaya ([../plan/core-domain-v2.md](../plan/core-domain-v2.md)).
- Naye developers ek-dusre ke code se takra rahe the. Isse **CODEOWNERS**, **RFC process**, aur har module ka owner tay hua.
- Tum ab 1 saal ke ho gaye. Pehla mentee mila, aur pehli baar ek RFC tum ne likhi.

## 🏢 Part A: Product growth

### 1. Funnel (AARRR) aur activation
```
Acquisition (signup) → Activation (pehla asli value) → Retention (baar-baar use)
→ Revenue (paid) → Referral (dusre owners ko laana)
```
- **Activation ki definition tay karo**, warna sab andaaza hai. Misaal: "pehla customer + pehli delivery + 7 din mein 5 din use".
- **Cohort retention:** kis mahine aaye log kitne mahine ruke? Average chhupa deta hai, cohort sach dikhata hai.
- **North Star metric:** ek number jo user ki value dikhaye. Misaal: "app se plan hue tiffin per hafta".

### 2. Experiments
- **Hypothesis:** "Agar onboarding mein demo data ho, to activation 20% badhega."
- **A/B test** ya feature flag se rollout, ek metric, aur pehle se tay samay.
- Chhote samples (jaise 200 messes) mein A/B ke nateeje kamzor hote hain. Tab qualitative feedback + before/after + cohorts zyada kaam ke hain.

### 3. Pricing aur billing ops
- Trial → paid conversion, payment fail hone par **dunning** (reminders, grace period, read-only).
- Upgrade ka reason product ke andar dikhao (entitlements: locked feature + "Growth plan mein").

## 🏢 Part B: Tech scale ("pehle napo, phir badhao")
| Problem | Pehla ilaaj | Agla ilaaj |
|---|---|---|
| Query slow | Index, query sudhaar (EXPLAIN), N+1 hatao | Rollups/summaries (`DailyOrgStat`), band mahine ke statements |
| DB load | Connection pooling, caching | Read replica (reports ke liye), partitioning (bade tables) |
| Bhaari kaam request mein | Background jobs/queues | Alag workers, dedicated queue |
| Static load | CDN, cache headers | n/a |
| Ek region door | DB aur functions ek region mein | Multi-region (bahut baad mein) |
| Bots ya bura traffic | Rate limits | WAF/firewall rules |

- **Vertical scaling** (bada server) sasta aur aasaan hai, aur ye pehle karo. **Horizontal** (zyada servers) ke liye app stateless hona chahiye, jo hamara hai.
- **Strangler fig pattern:** purane hisse ko dheere-dheere naye se badlo, ek-ek route karke, sab ek saath nahi.

### Tech debt
| Type | Misaal | Kya karein |
|---|---|---|
| Jaan-boojh kar (deliberate) | "Pilot ke liye billing derived rakho" | Likh do (ADR/TODO + ticket), aur chukane ka samay tay karo |
| Anjaane mein | Duplicate logic (`recordPayment` + `applyPayment`) | Refactor (command layer) |
| Purana (bit rot) | Dependencies purani | Regular updates |

**Niyam:**
- har sprint ka ~15–20% sudhaar ke liye
- refactor tests ke saath
- bada refactor = RFC + expand/contract

## 🏢 Part C: Team ka badhna

### 1. Hiring
- **JD** saaf ho: kaam, zaroori skills, aur kya zaroori nahi.
- **Loop:** screening → technical (code + debugging) → system design (senior ke liye) → collaboration/culture → founder.
- Achha interview **asli kaam jaisa** hota hai, rata hua puzzle nahi.

### 2. Onboarding (30/60/90 din)
- **30 din:** setup, codebase, chhote PRs, ek on-call shadow.
- **60 din:** ek poora feature, review karna shuru.
- **90 din:** ek module ka owner, aur kisi naye ko onboard karne mein madad.

### 3. Ownership aur documentation
- **CODEOWNERS:** har folder ka reviewer tay. `src/server/*` ke liye backend lead.
- **RFC process:** bade badlav pehle likh kar, review ke saath.
- **Docs culture:** faisle (ADR), runbooks, onboarding. Agar likha nahi, to hua hi nahi.
- **Platform team** (bade hone par): CI, design system aur foundations sambhalne wali team.

### 4. Engineering metrics: DORA ke 4 keys
| Metric | Matlab | Achha trend |
|---|---|---|
| Deployment frequency | Kitni baar deploy | Zyada (roz) |
| Lead time for changes | Commit se production tak | Kam (ghante/din) |
| Change failure rate | Kitne deploy kuch todte hain | Kam |
| Time to restore | Toota to kitni der mein theek | Kam (minute/ghante) |

⚠️ Lines of code, commits ki ginti aur story points se **insaan ko mat napo**. Log in numbers ko game karne lagte hain.

## 🏢 Part D: Developer career
| Level | Scope | Tum se umeed |
|---|---|---|
| **Junior** | Chhote, saaf tasks | Seekhna, sawal poochna, achhe PR, tests |
| **Mid** | Poora feature, bina zyada madad | Edge cases, design ke sawal, review karna |
| **Senior** | Module/system, ambiguity ke saath | Trade-offs, RFC, dusron ko sikhana, production ki zimmedari |
| **Staff / Principal** | Kai teams, lambe faisle | Architecture, standards, org-level impact |
| **Engineering Manager** (alag raasta) | Log aur team | Hiring, growth, delivery, sehat |

**Har level par kaam aane wali skills:**
- **Likhna:** PR, docs, RFC. Saaf likhne wala saaf sochta hai.
- **Estimation aur communication:** risk jaldi batana.
- **Ownership:** "mera kaam production tak, aur uske baad bhi".
- **Product sense:** feature ka "kyun", aur user ki nazar se sochna.
- **Mentoring** aur feedback dena/lena.
- **"Nahi" kehna**, kaaran aur vikalp ke saath.

## ⚠️ Aam galtiyan
- Bina measure kiye "scale" ke liye microservices ya Kubernetes.
- Activation tay kiye bina growth ki baatein.
- Tech debt ko kabhi na chukana, ya sab kuch ek saath dobara likhna (big rewrite).
- Team badhne par bhi "sab sab kuch dekhega", bina ownership ke.
- Insaan ko lines of code se napna.

## ✅ Seekh
- Growth = activation + retention, sirf signup nahi.
- Scale tabhi karo jab napne se dikhe. Simple ilaaj pehle.
- Team scale = ownership + likhit faisle + achha onboarding.
- Career = scope aur impact badhna, sirf saal nahi.

## 🔗 Is repo mein
- [../plan/business-growth.md](../plan/business-growth.md) (growth reports, cohorts, SaaS metrics)
- [../plan/observability.md](../plan/observability.md) Level D (product analytics, `/admin`)
- [../roadmap.md](../roadmap.md) Stages 4–7

## 🏋️ Practice task
Is app ke liye **activation** ki ek definition likho, aur use napne ke liye kaunse events chahiye ([../plan/observability.md](../plan/observability.md) Level D se). Phir socho ki pehle hafte mein chhodne wale messes ko roka kaise jaaye: 3 product ideas aur 1 metric.
