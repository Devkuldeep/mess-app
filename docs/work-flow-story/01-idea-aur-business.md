# 01. Idea aur business: "kyun banana hai?"

## 📖 Kahani
Aarav ki mausi Indore mein ek tiffin service chalati hain: 60 customers, ek register, aur teen WhatsApp groups. Har raat 9 baje woh baith kar ginti karti hain ki kal kitne tiffin banenge. Kabhi 5 zyada ban jaate hain, kabhi 3 kam. Mahine ke end mein "kisne paisa diya, kisne nahi" par jhagda hota hai.

Aarav ko laga: "Iska app bana dete hain!" Usne dost Vikram (developer) ko phone kiya:
> **Aarav:** Bhai, ek app banana hai. 2 hafte mein ho jaayega?
> **Vikram:** Pehle ye batao ki problem kitne logon ki hai? Kya woh iske liye paisa denge? Aur kya ye cheez pehle se market mein hai? Code sabse aakhri step hai.

Phir Meera (PM) aayi, aur team ne **2 hafte ek bhi line code nahi likhi**. Unhone ye kiya:
1. **10 mess owners se baat** ki: problem ke baare mein poocha, app ke baare mein nahi.
2. **Competitors** ko dekha: TiffinHub, MealPe, aur sabse bada competitor, register + WhatsApp.
3. **Business model** socha: kaun paisa dega, kitna, aur kaise.
4. Ek **sasta experiment** kiya: Google Sheet + WhatsApp se 2 owners ka kaam do hafte chalaya.

**Nateeja:** 10 mein se 8 owners ka dard ek hi tha, "kal kitna banana hai" aur "kiska paisa baaki hai". 6 ne kaha "₹300–500/mahina de denge agar sach mein time bache". Sabse kaam ki baat ye nikli ki **owners English dashboards se darte hain** aur **net kamzor hota hai**. Isi se Hindi-first aur offline-first ke faisle hue.

## 🏢 Industry mein kaise hota hai

### 1. Problem pehle, solution baad mein
| Step | Kya karte hain | Output |
|---|---|---|
| Problem interviews | 10–20 target users se unke **pichhle behaviour** ke baare mein baat | Dard ki list, kitna bada hai, abhi kaise sambhalte hain |
| Market sizing | TAM (poora market) → SAM (jahan pahunch sakte ho) → SOM (pehle 1–2 saal mein kitna le sakte ho) | Kitna bada business ho sakta hai |
| Competitor analysis | Features, daam, kamzoriyan, kis segment ko target karte hain | Positioning: hum kahan alag hain |
| Business model | Kaun pay karega, kitna, kaise; aur product kaise bechenge | Pricing ka andaaza, channel |
| Validation | Landing page, concierge MVP (haath se service), pilot | Sabut ki log sach mein use/pay karenge |

**"The Mom Test" ke rules** (Rob Fitzpatrick ki kitaab):
- Poochho "Pichhli baar ye kaise kiya tha?", **"Kya aap aisa app use karoge?" nahi**. Kal ke vaade jhoothe hote hain, beete kal ka behaviour sach hota hai.
- Apna idea pitch mat karo, unki zindagi ke baare mein suno.
- Taarif se khush mat ho. Commitment dhoondho: time, paisa, ya kisi aur se milwana.

### 2. Business model ke zaroori shabd
| Shabd | Matlab | Is app mein |
|---|---|---|
| **B2B SaaS** | Business ko software, subscription par | Mess owner monthly plan leta hai |
| **ARPU / ARPA** | Ek account se mahine ki average kamai | Jaise ₹449 |
| **MRR / ARR** | Har mahine ki recurring kamai / saal ki | 100 messes × ₹449 = ₹44,900 MRR |
| **Churn** | Kitne % customers har mahine chhod dete hain | 5%/mahina = bahut zyada; 2% achha |
| **LTV** | Ek customer se poori zindagi ki kamai | ARPU × gross margin ÷ churn |
| **CAC** | Ek customer laane ka kharcha | Reseller commission, ads, demo ka time |
| **Payback period** | CAC kitne mahine mein wapas aata hai | CAC ÷ (ARPU × margin) |
| **Gross margin** | Kamai mein se infra/SMS/WhatsApp ka kharcha nikal kar | WhatsApp ka kharcha margin kha sakta hai |

**Ek misaal** (numbers kaalpanik hain, sirf formula samajhne ke liye):
```
ARPU = ₹449/mahina, gross margin = 80%  → har mahine ₹359 bachta hai
Churn = 3%/mahina → customer average 1/0.03 ≈ 33 mahine rukta hai
LTV ≈ 359 × 33 ≈ ₹11,800
CAC (reseller ko pehle 3 mahine 40%) ≈ ₹540 + demo ka kharcha ₹300 = ₹840
LTV : CAC ≈ 14 : 1 (3:1 se upar achha maana jaata hai), payback ≈ 2.3 mahine
```
**Developer ke liye matlab:** agar ek mess se ₹449 aate hain, to uska infra kharcha ₹20–40 se zyada nahi hona chahiye. Isi wajah se hamare plans mein "Postgres-first, shuru mein koi vendor nahi" (decision D7) aur "har org ka kharcha dikhe" (observability plan) hai. **Tech decisions business se nikalte hain.**

### 3. Go-to-market (product logon tak kaise pahunchega)
- **Channels:** direct sales, resellers/partners (hamara student reseller model), content/SEO, referrals, ads.
- **Ek segment se shuru karo:** PG/hostel/office tiffin, ek hi shehar. "Sabke liye" ka matlab "kisi ke liye nahi".
- **Positioning:** "Hindi mein, WhatsApp jaisa aasaan, sabse sasta" ([../product/vision.md](../product/vision.md)).

### 4. Startup vs badi company vs service company
| | Product startup (Rasoi Labs) | Badi product company | IT service company (client ke liye banati hai) |
|---|---|---|---|
| Idea kahan se | Founder/market | Strategy team, data | **Client** laata hai |
| Validation | Interviews, pilot | Research team, A/B | Client ki zimmedari; hum sirf feasibility batate hain |
| Pehla document | Lean canvas, pitch deck | Business case, OKRs | **RFP** (client) → **Proposal + estimate** (hum) → **SOW** (contract) |
| Paisa | Investors/apni jeb | Budget cycle | Client: **fixed bid**, **T&M** (time & material) ya retainer |
| Risk | Product na chale | Opportunity cost | Scope creep, deadline, payment |

**Service company ka pre-sales flow:** lead → NDA → discovery call → **RFP/RFQ** padhna → solution + estimate (team, timeline, cost) → proposal → negotiation → **SOW/MSA** sign → kickoff. Developer ya Tech Lead se aksar **estimate** maanga jaata hai. Isliye "andaaza lagana" ek zaroori skill hai (chapter 06).

## 👨‍💻 Developer deep dive: is stage par developer kya karta hai?
1. **Feasibility spike:** chhota sa throwaway prototype, jaise "kya PWA 2G par offline chal sakta hai? Kya service worker Android ke purane phones par chalta hai?" Time-boxed (1–3 din), aur nateeja ek page par.
2. **Tech cost estimate:** 1,000 messes par DB, hosting aur SMS ka kitna kharcha aayega (chapter 04 mein back-of-envelope).
3. **Risk list:** kya cheez tech ki wajah se fail ho sakti hai? Misaal: offline sync, WhatsApp API ka kharcha, aur Play Store ki policy.
4. **"Build vs buy":** login, payments aur SMS khud banayein ya service lein? (Hamara faisla: auth khud, payments ke liye Razorpay, SMS ke liye provider.)
5. **Sawal poochho:** "Ye feature kis problem ko solve karta hai?" Isse galat cheez banane se bachte ho.

> **Golden rule:** "Build the right thing" (sahi cheez banana) "build the thing right" (cheez ko sahi tarah banana) se zyada zaroori hai. Bahut khoobsurat code bhi bekaar hai agar koi use nahi karta.

## 📄 Namuna 1: Lean Canvas (is app ka)
| Box | Is app ke liye |
|---|---|
| Problem | 1) Kal kitne tiffin? 2) Kiska paisa baaki? 3) Khana bekaar jaata hai |
| Customer segment | 15–100 customers wale PG/hostel/office tiffin owners (Tier-2 shehar) |
| Unique value proposition | Hindi mein, WhatsApp jaisa aasaan; 10 min setup; offline chalta hai |
| Solution | Kal ka count, delivery list, khata + reminder, customer skip link |
| Channels | Student resellers, owner-to-owner referral, WhatsApp groups |
| Revenue | Monthly subscription (₹299–999), WhatsApp add-on packs |
| Cost structure | Hosting, DB, SMS/WhatsApp, reseller commission, support |
| Key metrics | Activated messes, weekly active, churn, collection time |
| Unfair advantage | Hindi-first + reseller network + wastage/festival data |

## 📄 Namuna 2: Problem interview script (Hindi)
```
1. Apne mess ke baare mein bataiye: kitne customer, lunch/dinner, kitne log kaam karte hain?
2. Kal raat aapne kaise tay kiya ki aaj kitne tiffin banane hain? (process dikhaiye)
3. Pichhle mahine kitni baar khana zyada ya kam bana? Tab kya kiya?
4. Paisa kaun-kaun baaki hai, ye aap kaise yaad rakhti/rakhte hain? Pichhli baar kab jhagda hua?
5. Customer chhutti kaise batate hain? Der se batayein to kya hota hai?
6. Abhi koi app/register/Excel use karte hain? Usme kya achha hai, kya pareshan karta hai?
7. Is kaam mein roz kitna time jaata hai?
8. (Aakhir mein) Agar ye kaam aadha ho jaaye to kya aap mahine ka ₹___ denge? Kisi aur owner se milwa sakte hain?
```

## ⚠️ Aam galtiyan
- Pehle 3 mahine code likhna, phir poochna ki kisi ko chahiye bhi ya nahi.
- Leading sawal: "Aapko aisa app pasand aayega na?" (jawab hamesha "haan" hi aata hai).
- Bahut sasta daam rakhna. Baad mein badhana mushkil hota hai, aur infra/support ka kharcha nahi nikalta.
- Distribution bhool jaana. Achha product bhi tabhi bikta hai jab log tak pahunchne ka raasta ho.
- "Sabke liye" banana: student mess, hotel aur catering, sab ek saath.

## ✅ Checklist: is stage ke baad kya hona chahiye
- [ ] Problem statement ek line mein ("X log Y problem se pareshan hain kyunki Z")
- [ ] 10+ interviews ke notes, aur ek pattern
- [ ] Competitors ki table aur hamari positioning
- [ ] Business model: daam ka andaaza aur unit economics ka formula
- [ ] MVP ka scope (kya pehle, kya baad mein), aur ek validation plan (pilot)
- [ ] Bade risks ki list, jisme tech feasibility bhi ho

## 🔗 Is repo mein
- [../product/vision.md](../product/vision.md): positioning, target, sidhant, validation
- [../product/business-model.md](../product/business-model.md): plans, reseller, billing
- [../product/competitors.md](../product/competitors.md): market
- [../roadmap.md](../roadmap.md) → Decision register Q8 (prices), Q11 (reseller commission)

## 🏋️ Practice task
Apne aas-paas ke 2 tiffin/mess owners se upar ki script se baat karo, aur notes [../product/vision.md](../product/vision.md) ke "Validation" mein jodo. Saath mein ek line likho ki unke jawab se roadmap mein kya badalna chahiye.
