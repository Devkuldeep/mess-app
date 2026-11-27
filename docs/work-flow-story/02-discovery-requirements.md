# 02. Discovery aur requirements: "kya banana hai, kitna, kis order mein?"

## 📖 Kahani
Meera (PM) aur Kabir (BA) ne ek poora din **Sunita didi ke mess** mein bitaya, aur Tum bhi saath gaye. Unhone dekha:
- **Subah 10 baje:** didi WhatsApp padh kar ginti kar rahi thin ki aaj kaun-kaun chhutti par hai. 3 messages raat 11 baje aaye the, jab khana ki planning ho chuki thi.
- **12:30 baje:** delivery boy Raju bike par tha, ek haath mein phone. Basement wali building mein network nahi.
- **Shaam:** register ke panne palat kar "is mahine kiska kitna baaki hai". Ek customer ne kaha "maine to diya tha!", par proof nahi tha.

Wapas aakar Kabir ne whiteboard par likha:
> "Hum 'mess app' nahi bana rahe. Hum ye bana rahe hain:
> (1) raat 9 baje **pakka count**,
> (2) **bina net** ke delivery tick,
> (3) **sabut ke saath** khata."

Tum ne poocha: "Agar customer ne raat 9:01 par skip kiya to?" Kabir muskuraya: "Yahi to edge case hai. Ise likho." Isse ek requirement bani: **cutoff server ke time se check hoga** (phone ka time galat ho sakta hai), aur ye aaj bhi `isSkipLocked` (`src/lib/dates.ts`) mein hai.

## 🏢 Industry mein kaise hota hai

### 1. Discovery ke tools
| Tool | Kya hai | Is app ka misaal |
|---|---|---|
| **Field visit / shadowing** | User ke saath unka kaam dekhna | Lunch time par delivery boy ke saath ghoomna |
| **Personas** | Typical user ka profile: goal, dard, device, tech comfort | Neeche dekho |
| **User journey map** | User ka poora din, aur har step par dard | Owner: raat ki planning → subah cooking → delivery → hisaab |
| **JTBD (Jobs To Be Done)** | "Jab ___, main ___ chahta hoon, taaki ___" | "Jab raat ho, main pakka count chahti hoon, taaki khana bekaar na jaaye" |
| **Problem statement** | Ek line, data ke saath | "Owners roz ~45 min ginti aur hisaab mein lagate hain, aur 5–10% khana bekaar jaata hai" |

### 2. Personas (is app ke)
| Persona | Goal | Dard | Device / comfort |
|---|---|---|---|
| **Owner (Sunita didi)** | Sahi count, poora paisa, kam waste | Raat ki ginti, udhaar, chhutti ke late messages | Mid-range Android, Hindi, WhatsApp expert |
| **Manager** | Roz ka kaam bina owner ke | Owner se baar-baar poochna | Android |
| **Delivery staff (Raju)** | Jaldi delivery, galti nahi | Network nahi, ek haath, dhoop mein screen | Sasta Android, 2G/3G |
| **Customer (student/office)** | Chhutti batana, bill dekhna | Owner ko message karna, bill par shak | Koi bhi phone. **Login nahi chahiye** |

### 3. Requirements: functional vs non-functional
**Functional** (system **kya** kare): kal ka count dikhana, customer jodna, delivery tick, payment record, skip with cutoff.

**Non-functional (NFR)** (system **kaisa** ho). Architecture inhi se banta hai:

| NFR | Is app mein | Architecture par asar |
|---|---|---|
| Offline | Delivery aur payment bina net ke | Service worker + IndexedDB outbox (CLAUDE.md "Offline architecture") |
| Performance | 2G aur sasta phone | Kam JS, server rendering, performance budget |
| Localization | Hindi-first | Har string en + hi (CLAUDE.md rule 5) |
| Security / privacy | Ek mess ka data dusre ko kabhi na dikhe | `orgId` isolation (rule 1), DPDP |
| Cost | ₹299 ke plan mein bhi munafa | Postgres-first, vendor kam (D7) |
| Availability | Lunch/dinner ke time down na ho | Monitoring, rollback |
| Usability | 30 second mein entry | Bade buttons, ek screen par ek kaam (mobile-ui skill) |

> **Developer tip:** NFRs ko hamesha **likhwao**. "Fast hona chahiye" requirement nahi hai. "Delivery list 3G par 2.5 second mein khule" requirement hai.

### 4. Prioritization
- **MoSCoW:** Must / Should / Could / Won't (abhi nahi).
- **RICE score** = (Reach × Impact × Confidence) ÷ Effort.
  - Misaal, "WhatsApp reminder": Reach 80 owners × Impact 2 × Confidence 0.8 ÷ Effort 3 = **42.7**
  - Misaal, "Live delivery tracking": 30 × 1 × 0.5 ÷ 8 = **1.9**
  - Isliye reminder pehle aata hai.
- **MVP:** sabse chhota product jo asli problem solve kare aur seekhne de. Hamara MVP 4 screens + customer link tha ([../modules/core-operations.md](../modules/core-operations.md)).

### 5. Documents: PRD, user stories, acceptance criteria
- **PRD (Product Requirements Document):**
  - Problem, goals/non-goals
  - Users
  - Requirements (functional + NFR)
  - Success metrics
  - Edge cases
  - Open questions
  - Out of scope

  Product company mein PM likhta hai.
- **User story:** "Ek **[role]** ke roop mein, main **[kaam]** chahta hoon, taaki **[fayda]**."
- **Acceptance criteria (AC):** kab kaam "ho gaya" maana jaayega. Aksar **Given / When / Then** (Gherkin) format mein.
- **Story mapping:**
  - Upar user ki activities ka "backbone".
  - Neeche har activity ki stories.
  - Pehli line = "walking skeleton" (MVP).
- **Definition of Ready (DoR):** story tabhi sprint mein jaayegi jab AC, design aur dependencies tay hon.

### 6. Estimation (andaaza)
- **Story points** (Fibonacci 1, 2, 3, 5, 8, 13): **complexity + risk + effort**, ghante nahi. **Planning poker** mein team ek saath card dikhati hai, aur farak ho to charcha hoti hai.
- **T-shirt sizes** (S/M/L/XL): roadmap level ke rough andaaze.
- **Spike:** jab pata hi nahi ki kitna lagega, tab pehle time-boxed research.
- Andaaza ek **range** hai, promise nahi. "3–5 din, agar Google OAuth verification mein atka to 2 hafte."

### 7. Service company mein
- **BRD** (Business Requirements Document) → **FRD/SRS** (Functional/Software Requirements Specification) → client ka **sign-off**.
- **Requirement freeze:** sign-off ke baad har badlav ek **Change Request (CR)** hai, jiska impact (time aur paisa) ka andaaza lagta hai aur client approve karta hai. Isse scope creep rukta hai.
- **Traceability matrix:** requirement → design → test case → status. Audit aur UAT ke liye.

## 👨‍💻 Developer deep dive: requirements stage par developer ka kaam
1. **Edge cases dhoondho.** Ye developer ki superpower hai. Misaal skip feature ke liye:
   - Cutoff 21:00 ho to 20:59:59 par chalega, 21:00:00 par nahi.
   - Holiday aur skip ek hi din? Holiday jeetega, aur charge nahi hoga.
   - Customer mahine ke beech join kare? Bill uski start date se.
   - Owner ne cutoff 21 se 20 kar diya, aur 20:30 par kisi ne skip kiya? Naya rule turant lagega.
   - Phone ka time galat ho? Server ka time maana jaayega.
   - Customer ka plan sirf lunch ka ho aur woh dinner skip kare? Error "plan".
2. **Ambiguous AC par wapas sawal karo.** "Bill sahi hona chahiye" testable nahi hai. "18 meals × ₹60 − ₹500 = ₹580 dikhe" testable hai.
3. **NFR ko design mein badlo.** "Offline" ka matlab: kaunse kaam offline chalenge (delivery, payment) aur kaunse nahi (skip, kyunki cutoff server par check hota hai). Ye CLAUDE.md mein "Online-only on purpose" likha hai.
4. **Estimate mein unknowns batao.** "OAuth verification Google karega, uska time hamare haath mein nahi."
5. **Data ka sawal poochho.** Kya store hoga, kitne din, kaun dekh sakta hai? (Privacy, chapter 11.)

## 📄 Namuna 1: PRD ka ek hissa
```
# Feature: Customer ki chhutti (skip) cutoff ke saath
Problem: Customers raat 11 baje WhatsApp par chhutti batate hain; tab tak khana plan ho chuka hota hai.
Goal: Owner ko raat 9 baje pakka count mile. Non-goal: payment/refund logic badalna.
Users: Customer (link se, bina login), Owner (count dekhta hai)
Requirements:
  R1 Customer apne link par agle 7 din dekh kar lunch/dinner skip kar sake.
  R2 Kisi din D ka meal (D−1) ko cutoff hour (default 21:00, org timezone) tak hi badla ja sake.
  R3 Holiday wale din skip ka option nahi.
  R4 Skip karne par owner ke count se turant ghat jaaye.
NFR: link 3G par 2.5s mein khule; cutoff server time se; customer ko login nahi.
Success metric: 60% skips app se aayein (WhatsApp se nahi), 4 hafte mein.
Edge cases: (upar ki list)
Out of scope: pause (from–to), customer ka plan badalna.
Open questions: cutoff har mess alag rakh sake? → Haan (setting).
```

## 📄 Namuna 2: User stories + acceptance criteria
```
Story US-12: Ek customer ke roop mein, main apne link se kal ka lunch skip karna chahta hoon,
             taaki mujhe uska paisa na dena pade aur khana bekaar na jaaye.

AC1 Given cutoff 21:00 hai aur abhi 20:30 hai
    When main kal ka lunch skip karta hoon
    Then lunch "skipped" dikhe, aur owner ke kal ke lunch count se 1 kam ho

AC2 Given abhi 21:05 hai
    When main kal ka lunch skip karne ki koshish karta hoon
    Then button band ho, aur message "Cutoff nikal gaya (raat 9 baje)" Hindi mein dikhe

AC3 Given kal holiday hai
    Then kal ke din skip ka button na dikhe, aur "Chhutti" likha ho
```
```
Story US-20: Ek delivery staff ke roop mein, main bina net ke "delivered" tick karna chahta hoon,
             taaki basement mein bhi kaam na ruke.
AC1 Given phone offline hai, When tick karta hoon, Then turant tick dikhe aur "sync baaki" ka nishaan aaye
AC2 When net wapas aaye, Then tick server par 1 hi baar save ho (dobara bheja to bhi duplicate nahi)
```

## 📄 Namuna 3: Definition of Ready (checklist)
- [ ] User story + AC (testable)
- [ ] Design / screen spec link (chapter 03)
- [ ] Edge cases likhe hue
- [ ] Dependencies saaf (kaunsa API/permission chahiye)
- [ ] Estimate diya gaya, aur bahut bada ho (13+) to tod diya gaya
- [ ] Offline ka faisla (online-only ya outbox)

## ⚠️ Aam galtiyan
- Solution ko requirement bana dena ("dropdown chahiye") jab asli zaroorat kuch aur ho ("jaldi chunna").
- NFR bhool jaana. Baad mein offline ya Hindi jodna 10 guna mehnga padta hai.
- AC nahi likhna. Phir "done" par jhagda hota hai.
- Gold plating: woh features jodna jo kisi ne nahi maange.
- Bade stories jo ek sprint mein khatam hi nahi hoti.

## ✅ Seekh
- Requirement ka source **user ka asli kaam** hai, meeting room nahi.
- Har story testable ho. Edge cases developer ki zimmedari bhi hain.
- Andaaze range mein do, aur unknowns ka naam lo.

## 🔗 Is repo mein
- [../modules/core-operations.md](../modules/core-operations.md): features aur status, jo PRD jaisa hai
- [../product/feature-backlog.md](../product/feature-backlog.md): backlog (module + stage)
- `src/lib/dates.ts` → `isSkipLocked`: AC2 ka code
- [../roadmap.md](../roadmap.md) → "Definition of Done"

## 🏋️ Practice task
"Pause from–to" ([../plan/core-domain-v2.md](../plan/core-domain-v2.md) §1) ke liye 1 user story, 4 acceptance criteria (Given/When/Then) aur 6 edge cases likho. Usme mahine ke paar wala pause, cutoff, holiday aur open-ended pause zaroor hon.
