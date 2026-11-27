# Module: Wastage aur forecast (app ka "data analyst")

> Source: purana `init-3.md`. Technical details ke liye CLAUDE.md ka "Wastage module" section aur `src/lib/wastage.ts` dekho.
> Isse jude plans: [../plan/business-growth.md](../plan/business-growth.md) (inventory, kitchen reports) aur [../plan/observability.md](../plan/observability.md) (reports hub).

**Idea:** app roz ka data jama kare (kitne tiffin bane, kitne skip hue, kitna bacha) aur khud bataye ki kal, parso aur festival ke din kitna banana hai.

## 1. Wastage tracking (roz 30 second)

| Kya record hota hai | Status |
|---|---|
| Kitna bana (dal, chawal, sabzi, roti: kg ya count) | ✅ `/wastage` |
| Kitna bacha | ✅ |
| Kyun bacha (late skip, liya nahi, pasand nahi aaya, zyada bana) | ✅ |
| Dish ka kharcha → nuksan ₹ mein | ✅ `costPerUnit`. Inventory aane par apne aap bharega (M-INVENTORY) |

**Output:** "Is hafte 12 kg khana bacha, ₹1,800 ka nuksan. Sabse zyada wastage bhindi aur chawal mein."

## 2. Wastage kam karne wale features

| Feature | Status |
|---|---|
| Cooking quantity suggestion: kal ke tiffin × per-tiffin quantity + buffer (buffer pichhle data se) | ✅ 28 din ka median, "learning" mode |
| Wastage target (jaise 5% se kam) + progress | ✅ |
| Dish performance (kis dish par zyada bachta hai) | ✅ report mein |
| Skip cutoff analytics (aakhri ghante mein kitne skip aate hain) | ❌ business-growth plan → Skips report |
| Surplus flash sale (nearby customers ko discount) / NGO donate reminder | ❌ M-DIFFERENTIATORS |

## 3. Demand forecasting (sasta tareeka pehle, smart baad mein)

| Layer | Kaise | Kab |
|---|---|---|
| Simple average / median | Pichhle 4 hafton ka data | ✅ bana |
| Pattern-based | Weekday, mahine ki tareekh (salary week, month-end), mausam | ❌ M-FORECAST |
| ML model | Saare data se seekhe | ⏸️ 2–3 mahine ka data aane ke baad |

Shuru mein ML ki zaroorat nahi hai. Average aur kuch rules (jaise "Somvar ko 10% kam") bhi achha kaam karte hain.

## 4. Festival aur event calendar (**sabse bada differentiator**)
- **Built-in calendar:** Diwali, Holi, Navratri, Eid, Chhath, Ganesh Chaturthi, Pongal, long weekends, exam season, college vacation aur shaadi ka season.
- **Har festival ka asar:** app pichhle saal ke data se seekhe ki us din orders kitne gire ya badhe. Diwali par PG/hostel ke orders girte hain, office tiffin mein asar alag hota hai.
- **Advance alert:** "Agle hafte Navratri hai. Pichhle saal 30% customers ne vrat menu maanga tha, vrat thali add karo." Ye M-NOTIFY se jaayega.
- **Region-wise rules:** North, South aur East ke festival alag hain, isliye owner apna region chunega.
- **Local events:** owner khud bhi event daal sake (college fest, mela, exam, strike).
- **Festival pre-booking:** special thali ka advance order aur payment.

Status: ❌, module **M-FESTIVAL** (roadmap Stage 6).

## 5. Owner analytics dashboard
Ye ab [../plan/observability.md](../plan/observability.md) Level C aur [../plan/business-growth.md](../plan/business-growth.md) Part 2 mein detail se planned hai:
- aaj ka summary (orders, skip, wastage, kamai)
- trend charts
- peak aur slow days
- customer insights aur churn risk
- dish insights
- profit view
- forecast card ("Kal 85 tiffin banao, confidence: achha")

## 6. SaaS ke liye fayda
- **Benchmarking:** "Tumhara wastage 9%, tumhare area ka avg 6%". Sirf anonymous aggregate data se, aur tabhi jab group mein kam se kam 5 orgs hon.
- **Premium:** forecasting aur festival insights Growth/Pro plan mein jaayenge.
- **Resellers:** apne saare messes ka performance dekh sakein.

## 7. Dhyan rakhne wali baatein
- **Data quality:** owner roz entry nahi karega to forecast bekaar hai. Isliye entry bahut aasaan rakho, aur shuru mein sirf 3 cheezein maango.
- **Kam data par confidence mat dikhao.** Pehle 3–4 hafte "learning" mode.
- **Isolation:** analytics mein bhi har org ka data alag rahe.
- **Over-engineering se bacho.** Pehle simple charts aur average.

## Phases (is module ke andar)
1. ✅ **MVP:** roz ki entry + simple wastage report.
2. ✅/🟡 **Phase 2:** quantity suggestion + dish-wise wastage ✅. Orders aur revenue ke trend charts ❌, ye reports hub mein aayenge.
3. ❌ **Phase 3:** festival calendar + advance alerts + churn risk.
4. ⏸️ **Phase 4:** ML forecast + area benchmarking (premium).
