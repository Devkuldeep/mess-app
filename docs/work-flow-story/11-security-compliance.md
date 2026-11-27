# 11. Security, privacy aur compliance (SMS/DLT ke saath)

## 📖 Kahani
Launch se 3 hafte pehle Farhan (security consultant) aaya, aur pehle hi din usne do sawal pooche:
1. "Customer ka link (`/c/<token>`) koi doosra mil jaaye to kya hoga?" Jawab: woh us customer ki chhuttiyan badal sakta hai. **Ilaaj:** token lamba aur random ho, `Referrer-Policy: no-referrer` ho taaki link bahar leak na ho, aur owner ke paas **"link badlo"** ka button ho.
2. "Signup par koi bhi kisi ka phone number daal de to?" Asli owner atak jaayega. **Ilaaj:** phone OTP. Tab tak signup invite-only.

Phir OTP ki baari aayi. Pooja ne ek SMS provider ka account banaya aur test SMS bheja. **SMS gaya hi nahi.** Provider ne bataya: "Aapka **DLT registration** nahi hai. Bharat mein bina registration ke operator SMS block kar dete hain." Team ko 10 din lag gaye: documents, sender ID, aur templates ki approval. Aarav: "Agar ye pehle pata hota to kaam ke saath-saath shuru kar dete." Isi liye roadmap ke Decision register mein Q2 ko **"abhi shuru karo"** likha hai.

## 🏢 Part A: Security

### 1. Bunyadi sidhant
- **CIA:** Confidentiality (sirf sahi log dekhein), Integrity (data sahi rahe), Availability (zaroorat par chale).
- **Least privilege:** har insaan aur har system ko sirf utni hi access jitni zaroori hai (delivery boy ko payments nahi).
- **Defense in depth:** ek diwaar nahi, kai. UI chhupana + server check + DB constraint + logs.
- **Secure by default:** naya feature default mein band/safe ho.
- **Server par hi bharosa:** client par kuch bhi badla ja sakta hai.

### 2. OWASP Top 10 (2021 list) is app mein
| # | Risk | Is app mein kahan | Bachav |
|---|---|---|---|
| A01 | Broken Access Control | Dusre mess ka data, URL mein id badalna (IDOR), delivery boy payment kare | `orgId` har query mein, role/permission server par, composite FKs, scoped DB (planned) |
| A02 | Cryptographic Failures | Passwords, Google refresh token | scrypt hashing, `secretbox` encryption, HTTPS, cookie `secure` |
| A03 | Injection | SQL, CSV export mein Excel formula | Prisma parameterized queries; CSV mein formula-injection guard (`src/lib/csv.ts`) |
| A04 | Insecure Design | Token link, phone squatting | Threat modeling (neeche), OTP, link rotation |
| A05 | Security Misconfiguration | Headers, debug pages | Security headers + CSP (planned), `/dev/*` production mein 404 |
| A06 | Vulnerable Components | npm packages | `npm audit`, Dependabot, kam dependencies |
| A07 | Auth Failures | Brute force login | Rate limit, lockout, same error message, timing-safe |
| A08 | Integrity Failures | Service worker, supply chain | Lockfile, `npm ci`, SW update control |
| A09 | Logging/Monitoring Failures | Attack pata hi na chale | Audit log + alerts (observability plan) |
| A10 | SSRF | Server kisi user-diye URL ko call kare | Server sirf jaane-pehchaane hosts (Google) ko call karta hai |

### 3. Threat modeling (STRIDE): "customer link" ka misaal
| Khatra | Matlab | Is link par | Bachav |
|---|---|---|---|
| **S**poofing | Koi aur ban kar aana | Link forward ho gaya | Lamba random token, rotate ka option |
| **T**ampering | Data badalna | Cutoff ke baad skip | Server time se cutoff check |
| **R**epudiation | "Maine nahi kiya" | "Maine skip kiya tha!" | `Skip.byCustomer`, audit log (planned) |
| **I**nfo disclosure | Data leak | Referer header se token leak | `no-referrer`, kam data dikhao |
| **D**enial of service | Band kar dena | Token guess karne ki baarish | Rate limit (galat token par sakht) |
| **E**levation of privilege | Zyada power | Customer owner ka kaam kare | Portal sirf `"customer"` actor wale commands (foundations §5) |

**Kab karein:** har naye feature ke design par, 30 minute, ek table. "Attacker kya karega?"

### 4. Secrets
- Env vars mein rakho, git mein kabhi nahi. Har environment ke alag secrets. Logs mein nahi.
- **Rotation:** leak ho to turant badlo. Key versioning se bina downtime ke (production-readiness §2e).
- DB mein third-party tokens **encrypted** rakho (`TOKEN_ENCRYPTION_KEY`, `secretbox`), aur export mein kabhi nahi (`DriveConnection`).

### 5. Secure SDLC (development ke har step mein security)
- **Design:** threat model.
- **Code:** PR checklist (chapter 08).
- **CI:** audit, lint rules.
- **Launch se pehle:** security review/pentest.
- **Baad mein:** bug bounty, logs aur alerts.
- **Admin access:** 2FA, alag sessions, aur har action audited.

## 🏢 Part B: Privacy (DPDP Act, India)
> Ye kanooni salah nahi hai. Har cheez **lawyer se confirm** karo (Decision register L2, L3).

| Concept | Matlab | Is app mein |
|---|---|---|
| **Data Principal** | Jiska data hai | Customer, owner, staff |
| **Data Fiduciary** | Jo tay karta hai data kyun aur kaise use hoga | **Mess owner**, apne customers ke data ke liye |
| **Data Processor** | Jo fiduciary ki taraf se data process karta hai | **Hum** (platform). Terms mein ye saaf likhna |
| Notice + consent | Kya data, kyun, kitne din: saaf bhasha mein, aur consent ka record | Signup consent (`termsAcceptedAt`, `termsVersion`), customer link par data notice |
| Purpose limitation | Sirf bataye maqsad ke liye use | Analytics mein customer ka naam/phone nahi (PII-free events) |
| Retention | Zaroorat khatam to data hatao | Data lifecycle registry (foundations §7) |
| Rights | Dekhna, sudhaarna, hataana, shikayat | Export, delete request, grievance contact |
| Breach | Leak ho to authority aur logon ko batana | Breach runbook (M-TRUST) |
| **Bachche** | 18 se kam umr: verified parental consent | School/student tiffin, parent link (L3) |

## 🏢 Part C: Paisa aur compliance
- **Card ka data kabhi khud mat chhuo.** Hosted checkout (Razorpay) use karo, taaki PCI DSS ka scope tumhare upar na aaye.
- **Kisi aur ka paisa apne paas mat rakho.** Messes ke customers ka paisa platform ke account mein aaye, to woh "payment aggregator" jaisa kaam ban sakta hai, jiske RBI ke niyam hain. Har mess ka apna account/sub-merchant rakho (decision D21, L4, CA/lawyer se confirm).
- **Tax:** hamari SaaS invoice par GST, aur reseller commission par TDS (L5, CA se).

## 🏢 Part D: SMS aur DLT (detail mein)

### DLT kya hai aur kyun hai?
Spam SMS rokne ke liye TRAI ne **TCCCPR 2018** (commercial communication ke niyam) banaye. Iske tahat har business jo SMS bhejta hai, OTP ho ya reminder, telecom operators ke **DLT (Distributed Ledger Technology) platform** par registered hona chahiye. Operator har SMS ko check karta hai: kya sender registered hai, aur kya text kisi approved template se match karta hai? Match nahi hua to **SMS block**.

### Kaun-kaun shaamil hai
| Entity | Kaun | Kaam |
|---|---|---|
| **Principal Entity (PE)** | **Hum** (business jo message bhejta hai) | DLT par registration, header aur templates |
| **Telemarketer (TM) / SMS provider** | Jaise MSG91, Gupshup jaise aggregators | Message operators tak pahunchate hain. PE unhe DLT par **authorize/link** karta hai |
| **Operators ke DLT portals** | Jio, Airtel, Vi, BSNL ke portals | Approval aur scrubbing. Ek portal par registration sab operators tak jaata hai |

### Steps
1. **PE registration** ek operator ke DLT portal par. Documents: business proof (GST/registration), PAN, authorized person ki ID, authorization letter. Ek baar ki fee lagti hai, jo operator ke hisaab se kuch hazaar rupaye tak ho sakti hai. **Current fee portal par dekho.**
2. **Header / Sender ID:** service messages ke liye aksar 6 akshar ka naam, jaise `MESSMG`. Brand se juda hona chahiye, warna reject.
3. **Content templates:** har message ka text, aur jo hissa badalta hai uske liye variable (`{#var#}`).
   - Category bhi chunni padti hai: transactional/service (OTP aur alerts) ya promotional. Kaunsi category, ye provider aur portal ke niyam se confirm karo.
   - Promotional ya "explicit consent" wale messages ke liye **consent template** bhi.
4. **URLs aur callback numbers:** message mein link ho (jaise customer portal), to woh **whitelist** hona chahiye, warna block.
5. **PE → TM linking:** apne SMS provider ko DLT par authorize karo, taaki message ki chain traceable rahe.
6. **Provider ke dashboard** mein template ID ke saath template jodo, test karo, phir live.

**Kitna time:** PE approval aur templates ki approval mein kuch din se 2 hafte. Rejection par aur. **Isliye kaam ke saath-saath shuru karo.**

### Template ka namuna (OTP)
```
Header: MESSMG     Category: (provider ke saath confirm)
Template: {#var#} aapka Mess Manager login OTP hai. Ye 5 minute mein expire hoga. Kisi ko na batayein.
App ka message: "482913 aapka Mess Manager login OTP hai. Ye 5 minute mein expire hoga. Kisi ko na batayein."
```
⚠️ App ka text template se **akshar-akshar** match hona chahiye (spaces, punctuation). Thoda bhi farak = block.

### Hindi SMS ka kharcha
| Encoding | Ek SMS mein | Lambe SMS ka har hissa |
|---|---|---|
| GSM-7 (English) | 160 characters | 153 |
| Unicode / UCS-2 (Hindi) | **70 characters** | **67** |

Hindi ka 140 akshar ka message = 3 SMS ka bill. Isliye OTP aur reminders **chhote** rakho, ya Hinglish (Roman) mein rakho. Ye cost ka faisla hai.

### Aam rejections
- Template mein variable ki jagah galat
- Header brand se match nahi karta
- Promotional text ko service category mein daalna
- Whitelist ke bina URL
- App ka text template se thoda bhi alag

### WhatsApp ka raasta (DLT nahi, par apne niyam)
- **Meta Business verification**, display name ki approval, aur **message templates** ki approval (categories: authentication, utility, marketing).
- Customer ka **opt-in** zaroori hai.
- Pricing Meta tay karta hai aur badalti rehti hai, isliye current pricing dekho. Kharcha plan ke daam mein jodo.
- Quality rating: spam par number restrict ho sakta hai. Shared number par ek mess ki galti se sab ruk jaate hain (notifications plan ke guardrails).

## 📄 Namuna: har PR ka security checklist (chhota)
- [ ] Naya entry point? Auth + permission + `orgId`
- [ ] Input validated aur seema ke andar
- [ ] Koi secret, token ya PII log/response mein nahi
- [ ] Bahar ka URL ya file? Allowlist aur size/type check
- [ ] Naya personal data? Registry mein `pii` aur retention, privacy page update

## ⚠️ Aam galtiyan
- "Hum chhote hain, koi attack nahi karega." Bots sabko scan karte hain.
- Security sirf launch se pehle sochna.
- Customer data analytics/logs mein daal dena.
- DLT/WhatsApp ki approval aakhri hafte mein shuru karna.
- Kanooni sawaalon par khud andaaza lagana.

## ✅ Seekh
- Har feature par: "attacker kya karega?" (STRIDE, 30 min).
- Least privilege + defense in depth.
- Privacy aur compliance product ka hissa hain, baad ka kaam nahi. Lambe approval wale kaam pehle shuru karo.

## 🔗 Is repo mein
- [../plan/production-readiness.md](../plan/production-readiness.md) Phase 2 (rate limit, reset, headers, secrets, OTP, 2FA)
- [../plan/notifications.md](../plan/notifications.md) (consent, opt-in, guardrails, `auth.otp`)
- [../roadmap.md](../roadmap.md) → Decision register Q2 (SMS/DLT), L1–L6
- CLAUDE.md → "Legal & public pages", `src/server/secretbox.ts`, `src/lib/csv.ts`

## 🏋️ Practice task
`/api/sync` ke liye STRIDE table banao, upar ke customer link wale misaal ki tarah. Har khatre ke saamne likho ki aaj ka code (`src/app/api/sync/route.ts`, `src/server/mutations.ts`) use kaise rokta hai, ya kahan kami hai.
