# 06. Agile process: team roz aur har sprint kaise kaam karti hai

## 📖 Kahani
**Sprint 1, Somvar, sprint planning.** Meera (PM) ne top ki stories dikhayin: "Kal ka count", "Delivery tick offline", "Customer jodo". Team ne **planning poker** khela. "Offline tick" par Rohan ne 3 bataya aur Neha ne 8. Charcha hui. Neha ne bataya: "Replay par duplicate na bane, sync fail ho to retry, logout par data saaf ho… ye 3 nahi hai." Story ko do mein toda gaya.

**Roz 10 baje standup (15 min):** Tum ne kaha, "Kal customer form banaya, aaj validation. Blocker: zod ka error Hindi mein kaise aaye?" Standup ke baad Vikram 5 min ke liye Tum ke paas baitha. Standup mein problem solve nahi karte, bas batate hain.

**Budhvaar:** Sunita didi ne phone kiya ki login nahi ho raha (phone number mein space tha). Meera ne bug ticket banaya, priority tay ki, aur sprint mein jagah banayi. Ek kam zaroori story agle sprint mein gayi.

**Shukrvaar, sprint review:** team ne Aarav aur Sunita didi (video call par) ko **demo** diya. Didi ka feedback: "Count mein veg/non-veg alag dikhao." Ye backlog mein gaya.

**Retro:** "Kya achha gaya, kya nahi, kya badlenge?" Nateeja: **"PR 400 line se zyada nahi"**, aur Vikram is action ka owner bana.

## 🏢 Industry mein kaise hota hai

### 1. Methodologies
| | Waterfall | Scrum | Kanban |
|---|---|---|---|
| Kaise | Requirements → design → build → test → release, ek baar | 1–2 hafte ke **sprints**, har sprint ke end mein chalta hua software | Lagatar flow, **WIP limit** (ek column mein max kaam) |
| Kab | Fixed scope, regulated projects | Product development, badalti requirements | Support, ops, chhoti team |
| Badlav | Mehnga | Har sprint mein | Kabhi bhi |

**Scrumban** (Scrum + Kanban) aur **Shape Up** (6 hafte ki cycles, "appetite") bhi chalte hain. Naam se zyada zaroori hai: **chhote steps, jaldi feedback, aur sudhaar**.

### 2. Scrum ke roles, events aur artifacts
- **Roles:**
  - Product Owner / PM: kya aur kyun, priority
  - Scrum Master: process aur blockers hataana. Chhoti team mein aksar Tech Lead ya PM hi ye karta hai
  - Developers (dev + QA + design): kaise
- **Events:**
  - **Sprint planning:** capacity dekho (chhuttiyan, support duty) aur sprint goal + stories chuno.
  - **Backlog refinement (grooming):** aane wali stories ko saaf karo (AC, design, estimate). Ye DoR ke liye hai.
  - **Daily standup:** 15 min. Kal kya kiya, aaj kya karunga, blocker kya hai. Ya phir "walk the board" (board ke right se left).
  - **Sprint review:** stakeholders ko **chalta hua software** dikhana. Slides nahi.
  - **Retrospective:** process sudhaarna, aur har action ka ek owner.
- **Artifacts:** product backlog, sprint backlog, increment (deployable software).

### 3. Kaam ki hierarchy (Jira/Linear jaise tools mein)
```
Initiative / Theme (jaise "Pilot launch")
 └── Epic (jaise "Offline delivery")
      └── Story (user ko value, AC ke saath)
           └── Task / Sub-task (technical step)
Bug     → kuch toota hai
Spike   → research, time-boxed
Tech debt → code sudhaar, value baad mein
```

### 4. Velocity, burndown aur unke khatre
- **Velocity:** ek sprint mein kitne points poore hue. Ye sirf **planning** ke liye hai, comparison ke liye nahi.
- **Burndown chart:** sprint mein kitna kaam baaki hai.
- ⚠️ Velocity ko target bana diya to log points badha dete hain (Goodhart's law: jab measure target ban jaaye, to woh achha measure nahi rehta).

### 5. Definition of Ready / Definition of Done
- **DoR:** story sprint mein lene layak hai (chapter 02).
- **DoD:** kaam "ho gaya" tab hai jab code + tests + review + docs + changeset + deploy ho jaaye. Is repo ki DoD [../roadmap.md](../roadmap.md) mein hai (10 points).

### 6. Communication
- **Async pehle:** Slack threads, written updates, docs. Meeting tabhi jab baat se jaldi suljhe.
- **Status update ka format:**
  1. kya hua
  2. agla kya
  3. risk/blocker
  4. kis se kya chahiye
- **Escalation:** 1–2 ghante atke ho to bolo. "15 minute rule": khud koshish karo, phir poochho, aur poochte waqt batao ki kya-kya try kiya.
- **RACI** (kaun **R**esponsible karega, kaun **A**ccountable hai, kisse **C**onsult karna hai, kise **I**nform karna hai). Misaal, "Pilot launch":

| Kaam | R | A | C | I |
|---|---|---|---|---|
| Release build + deploy | Arjun | Vikram | Neha | Team |
| Pilot owners ko onboard | Pooja | Meera | Sana | Aarav |
| Legal pages | Meera | Aarav | Adv. Rao | Team |

### 7. Goals: OKRs aur KPIs
- **OKR:** Objective (kya chahte hain) + Key Results (kaise napenge).
  - Misaal. **O:** "Pilot owners ka roz ka kaam aasaan ho". **KR1:** 3 owners 14 din lagataar app use karein. **KR2:** raat ki planning ka time 45 se ghat kar 10 min ho. **KR3:** 90% deliveries app se tick hon.
- **KPI:** lagataar nazar rakhne wale numbers: weekly active messes, sync success %, churn.
- Har sprint goal kisi KR se juda ho. Tabhi pata chalta hai ki kaam ka matlab kya hai.

### 8. Service company mein Agile
- Client ka **PO**. Sprint demo par client ka **sign-off**.
- **Timesheets**, billable hours, aur utilization (kitna time client ke kaam mein gaya).
- **Change Requests:** naya scope = naya estimate + approval.
- **Status reports** (RAG: Red/Amber/Green) har hafte, aur **SLA** (support ka jawab kitni der mein).
- Kai baar "Agile" naam ka hota hai, par contract fixed-scope hota hai. Isme expectations saaf rakhna sabse zaroori skill hai.

## 👨‍💻 Developer deep dive: process mein developer ki zimmedari
1. **Kaam chhota todo.** Har PR ek cheez kare, aur 1–2 din mein merge ho jaaye.
2. **Ticket update rakho.** Status, PR link, aur koi faisla hua to comment. Ticket = "kya hua" ka record.
3. **Blocker jaldi batao.** Sprint ke aakhri din "atak gaya tha" kehna sabse bura hota hai.
4. **Estimate imaandari se do.** Pressure mein chhota number mat bolo. Unknowns ka naam lo.
5. **"Nahi" ya "abhi nahi" kehna seekho, kaaran ke saath.** "Ye is sprint mein aaya to offline wala kaam rukega. Kaunsa zyada zaroori hai?"
6. **Demo ki taiyaari:** apna feature khud dikhao, real data ke saath. Owner ki nazar se socho.

## 📄 Namuna 1: ticket
```
[MESS-142] Delivery tick offline save ho, net aane par sync ho
Type: Story   Epic: Offline delivery   Points: 5   Priority: High   Sprint: 3
Story: Delivery staff ke roop mein, main bina net ke tick karna chahta hoon…
AC: (chapter 02 wale US-20 ke AC1, AC2)
Design: Figma → "Delivery list / offline state"
Tech notes: outbox op `delivery` (src/lib/sync.ts), server idempotent upsert (applyDelivery)
Test notes: Chrome DevTools → Offline; 2 phone se same customer
Definition of Done: roadmap DoD + offline manual test ka GIF PR mein
```

## 📄 Namuna 2: standup update (likha hua, async team ke liye)
```
Kal: customer form ka UI + zod schema (PR #58, review mein)
Aaj: Hindi error messages, phone normalize ke tests
Blocker: phone input mein +91 paste karne par validation fail — Neha se 10 min chahiye
```

## 📄 Namuna 3: retro board
| Achha gaya 👍 | Behtar ho sakta tha 👎 | Action (owner) |
|---|---|---|
| Demo mein owner khush | PR bahut bade the | 400 line limit (Vikram) |
| Offline test GIF se review aasaan | Staging DB ka data purana | Weekly seed refresh (Arjun) |

## ⚠️ Aam galtiyan
- Standup ko manager ke liye status report bana dena. Ye team ka sync hai.
- Sprint ke beech naye kaam thoonsna bina kuch nikale (scope creep).
- Retro ke actions ka koi owner nahi, isliye kuch nahi badalta.
- Stories itni badi ki sprint mein khatam hi na hon.
- "Agile" ke naam par documentation zero. Faisle phir kho jaate hain.

## ✅ Seekh
- Process ka maqsad hai **jaldi feedback aur kam surprise**. Ceremonies apne aap mein maqsad nahi.
- Chhota kaam, saaf ticket, jaldi blocker.
- Har sprint goal kisi business goal (OKR) se juda ho.

## 🔗 Is repo mein
- [../roadmap.md](../roadmap.md): stages, exit gates, Definition of Done, workflow, aur "Har stage shuru karne se pehle"
- [../progress.md](../progress.md): status tracker (burn-up jaisa)

## 🏋️ Practice task
Roadmap ke Stage 1 ke modules ([../roadmap.md](../roadmap.md)) ko 2-2 hafte ke 4 sprints mein baanto. Har sprint ka ek **goal** likho, 4–6 stories, aur ek risk. Dependencies ka dhyan rakho: CI pehle, phir test harness, phir foundations.
