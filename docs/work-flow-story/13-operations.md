# 13. Production operations: monitoring, incidents aur support

## 📖 Kahani: Diwali ki raat
Pilot ke teesre mahine, Diwali se ek din pehle, raat 8:40 par Pooja (support) ke paas 20 WhatsApp aaye: "Delivery tick sync nahi ho raha", "app ghoom raha hai".

**8:45:** watchdog ka alert aaya: `/api/sync` p95 time 9 second, aur error rate 12%. Arjun (on-call) ne Slack par **incident** khola, aur khud **Incident Commander** bana.

**8:52:** logs mein dikha ki ek naya "payments report" query har sync ke saath chal raha tha, aur Diwali ke din payments 3 guna the. DB CPU 95% par tha.

**9:05:** **mitigation pehle, root cause baad mein.** Feature flag se report band kiya. 2 minute mein sync normal ho gaya. Pooja ne owners ko Hindi mein message bheja: "Thodi der dikkat thi, ab theek hai. Aapke saare ticks phone par safe the, ab sync ho gaye."

**Agle din postmortem:** kisi ko blame nahi kiya gaya. Sawal ye tha ki system ne galti hone kyun di. Teen action nikle: report ko background job mein le jao, query par index lagao, aur sync ke liye ek alag SLO alert banao. Offline outbox ki wajah se **ek bhi tick kho nahi**. Architecture ne bacha liya.

## 🏢 Industry mein kaise hota hai

### 1. Observability ke teen pillar
| Pillar | Kya | Misaal |
|---|---|---|
| **Logs** | Har ghatna ka record (structured JSON, request ID) | `{"level":"error","route":"/api/sync","requestId":"…","orgId":"…","ms":9120}` |
| **Metrics** | Numbers waqt ke saath | Requests/sec, p95 latency, error %, queue depth |
| **Traces** | Ek request ka poora safar, step by step | Sync → parseOp → applyPayment → DB (kahan time gaya) |

**Kya napein:**
- **Golden signals** (Google SRE): Latency, Traffic, Errors, Saturation (DB CPU, connections).
- **RED** (services ke liye): Rate, Errors, Duration.
- **USE** (resources ke liye): Utilization, Saturation, Errors.

### 2. SLI, SLO, SLA aur error budget
| Shabd | Matlab | Is app ka misaal |
|---|---|---|
| **SLI** (indicator) | Jo napte hain | Successful sync requests ka % |
| **SLO** (objective) | Hamara lakshya | 30 din mein 99.5% sync success; delivery page p95 < 2.5s (4G) |
| **SLA** (agreement) | Customer se vaada, aur toota to penalty | Enterprise plans mein. Shuru mein nahi |
| **Error budget** | SLO se bachi galti ki jagah | 0.5% = mahine mein ~3.6 ghante. Budget khatam to naye features rok kar stability par kaam |

### 3. Alerting ke niyam
- **Symptoms par alert karo, causes par nahi.** "Users ka sync fail ho raha hai", na ki "CPU 70%".
- Har alert **actionable** ho, aur uske saath runbook ka link ho.
- Bahut alerts = **alert fatigue**, aur phir koi nahi dekhta.
- **Severity ke hisaab se:** raat ko sirf SEV1/SEV2 par phone. Baaki subah.

### 4. On-call
- Rotation: chhoti team mein Tech Lead + ek senior, ek-ek hafta.
- **Escalation:** pehla responder → secondary → Tech Lead/CTO.
- Handover notes, aur incident ke baad aaram. Thaka hua on-call galti karta hai.

### 5. Incident management
| Severity | Matlab | Misaal | Response |
|---|---|---|---|
| **SEV1** | Poora app band, ya data/paisa galat | Login nahi, bill galat, data leak | Turant, sab haath |
| **SEV2** | Bada feature toota | Sync fail, delivery list nahi khulti | Turant |
| SEV3 | Chhota feature, workaround hai | Report slow | Working hours |
| SEV4 | Cosmetic | Typo | Backlog |

**Roles:**
- **Incident Commander:** faisle aur coordination. Khud debug nahi karta.
- **Ops/fixer:** debug karta hai.
- **Comms:** users aur stakeholders ko updates (Pooja).

**Flow:**
1. Detect
2. Declare: Slack channel, severity
3. Mitigate: flag, rollback, scale
4. Communicate: status page, WhatsApp (Hindi)
5. Resolve
6. **Postmortem**, 48 ghante ke andar

### 6. Blameless postmortem
Sawal "kisne galti ki" nahi hota. Sawal hota hai "system ne galti hone kaise di, aur ise kaise rokein". Is culture mein log sach bolte hain, aur sach bolne se hi system sudharta hai.

### 7. Runbooks
Har alert/incident type ke liye ek page:
- pehchaan kaise karein
- turant kya karein
- theek kaise karein
- users ko kya batayein

Misaal: "DB slow", "kharab deploy", "Drive backup fail", "service worker phas gaya" (production-readiness Phase 5).

### 8. Backups aur DR (disaster recovery)
- **RPO** (kitna data kho sakte ho) aur **RTO** (kitni der mein wapas aana hai). Ye pehle se tay karo.
- **Restore drill** har 3 mahine. Jo backup kabhi restore nahi hua, woh backup nahi, umeed hai.

### 9. Support aur customer success
| Tier | Kaun | Kya |
|---|---|---|
| **L1** | Support (Pooja) | FAQ, "kaise karein", account ki chhoti baatein |
| **L2** | On-rotation developer | Bug ki jaanch, data ka sudhaar (audited) |
| **L3** | Engineering team | Code fix, design ka badlav |

- **Request ID** se support aur dev ek hi log line tak pahunchte hain (observability plan).
- **Support → backlog loop:** har hafte top 5 shikayatein → PM → priority. Pilot ka exit gate yahi maangta hai.
- **Customer success:** onboarding call, health score (activity, sync errors, payment status), aur churn se pehle madad.

### 10. Capacity aur kharcha
- Trend dekho: DB size, connections, p95 aur queue. **Tyohaar, mahine ki pehli tareekh aur exam season** jaise peaks pehle se socho.
- Kharcha per org bata kamai (observability Level D).

## 👨‍💻 Developer deep dive: on-call developer ki toolkit
1. **Pehla sawal:** "Kya badla?" Haal ka deploy? Feature flag? Traffic?
2. **Dashboards:** error rate, p95 aur saturation. Kab se shuru hua?
3. **Logs:** request ID ya org se filter karo. Pehla error kya tha?
4. **Mitigate:** flag band, rollback, ya rate limit. Data ko haath lagane se pehle backup/PITR point.
5. **Fix ke baad:** regression test, alert/runbook update, aur postmortem.
6. **Production data ke saath:** sirf read-only access, har sudhaar audited, aur do log dekhein (four-eyes).

## 📄 Namuna: postmortem
```
# Postmortem: Diwali raat sync slow (SEV2)  — 2026-10-30
Impact: 20:40–21:07 (27 min), ~140 messes, sync p95 9s, 12% errors. Koi data loss nahi (outbox).
Timeline: 20:40 report deploy ka asar; 20:45 alert; 20:52 cause mila; 21:05 flag off; 21:07 normal.
Root cause: payments report ki bina-index query har sync ke saath; tyohaar par 3× payments.
Kya achha hua: outbox ne ticks bachaye; flag se 2 min mein mitigation; Hindi update jaldi.
Kya bura: report sync path mein thi; load test tyohaar jaisa nahi tha; alert 5 min der se.
Actions: (1) report → background job [Neha, 3 Nov] (2) index (orgId, paidOn) [Neha, 1 Nov]
         (3) sync SLO burn-rate alert [Arjun, 4 Nov] (4) load test mein "tyohaar" profile [Isha, 10 Nov]
```

## ⚠️ Aam galtiyan
- Incident ke beech root cause dhoondhna jab user pareshan hain. **Pehle mitigation.**
- Users ko kuch na batana. Chuppi bharosa todti hai.
- Blame wala postmortem, jiske baad log galtiyan chhupate hain.
- Har cheez par alert, jisse koi alert nahi dekhta.
- Backup hai, par restore kabhi try nahi kiya.

## ✅ Seekh
- **Detect → mitigate → communicate → fix → seekho.**
- SLO = kitni reliability kaafi hai. Isse features aur stability ka balance banta hai.
- Support ki baatein product ka sabse sachcha feedback hain.

## 🔗 Is repo mein
- [../plan/observability.md](../plan/observability.md) (logs, request ID, health, watchdog, audit)
- [../plan/production-readiness.md](../plan/production-readiness.md) Phase 5 (DR, runbook, uptime)
- [../plan/notifications.md](../plan/notifications.md) (kill-switch, guardrails)

## 🏋️ Practice task
"Service worker phas gaya, users ko purana app dikh raha hai" ke liye ek runbook likho:
- pehchaan
- turant kya karein (kill-switch `sw.js`)
- owners ko kya message jaaye (Hindi)
- dobara na ho, uske liye kya karein
