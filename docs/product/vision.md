# Vision aur positioning

> Source: purane `init.md` aur `init-4.md` (Step 1–2, 5–6). Market ke liye [competitors.md](competitors.md) dekho, aur paisa kaise banega uske liye [business-model.md](business-model.md).

## Hum kya bana rahe hain
**Mess Manager:** chhote Indian tiffin/mess businesses (15–100 customers) ke liye multi-tenant SaaS.

Owner ki do sabse badi pareshani hain:
1. **Kal kitne tiffin banane hain?**
2. **Kisne paisa diya, kiska baaki hai?**

Product inhi do sawalon ke aas-paas bana hai. Baaki sab baad mein aata hai.

## Kiske liye (target segment)
- PG, hostel aur office-area ke tiffin/mess owners, jinke 15–100 customers hain.
- Ye log abhi WhatsApp, copy aur Excel se kaam chalate hain. Hamara asli muqabla inhi purani aadaton se hai.
- Bade players (SpaceBasic, MealPe) university/enterprise par focus karte hain, isliye ye segment khaali hai.

## Pitch
> "Hindi mein, WhatsApp jaisa aasaan, aur sabse sasta. 10 minute mein setup, wastage aur festival ka hisaab apne aap."

## Hum kahan behtar hain (differentiators)

| Fayda | Kyun kaam karega |
|---|---|
| Hindi-first, aage chal kar voice/WhatsApp se entry | Chhote owners English dashboards se ghabrate hain |
| Sasta aur simple plan | Enterprise tools unke budget se bahar hain |
| Wastage + festival forecast | Zyada tar tools mein ye nahi dikha |
| Reseller network (students) | Sales team nahi chahiye, kyunki reseller local owners tak pahunch jaate hain |
| Owner Academy + business content | Owner ko software ke saath business seekhna bhi milta hai ([modules/academy-content.md](../modules/academy-content.md)) |
| Offline-first PWA | 2G aur kamzor network par bhi chalta hai (pehle se bana hai) |

## Product sidhant (har feature par lagu)
1. **Jo cheezein owner roz use karta hai, woh pehle pakki karo:** headcount, delivery aur payments. Ek saath sab features mat banao.
2. **Data entry 30 second se kam mein ho.** Typing ki jagah bade buttons, smart defaults, aur jo customer khud bhar sake woh customer bhare.
3. **Native app alag se nahi.** Ek PWA aur ek Play Store TWA app, sab messes ke liye ek hi. Customer ko link se kaam chal jaata hai.
4. **Shuru mein online payment gateway nahi.** UPI ID/QR aur owner ka "mark paid" button. SaaS ka apna billing Razorpay se hoga ([business-model.md](business-model.md)).
5. **Data mess ka hai.** Platform sirf use karta hai. Privacy (DPDP) ke liye consent aur delete ka option.
6. **Kam data par bharosa mat dikhao.** Forecast mein "learning" mode, aur confidence saaf likha ho.

## Validation (bechne se pehle)
1. Apne area ke **10 mess/tiffin owners** se baat karo: "Abhi hisaab kaise rakhte ho? Sabse bada sir-dard kya hai?"
2. **3–5 owners ko free pilot** do aur har hafte feedback lo. Ye roadmap ka **Stage 2 gate** hai ([../roadmap.md](../roadmap.md)).
3. Competitors ka demo lo, aur unme kya kami hai jo owners ko chidhati hai, uski list banao.
4. Jab 3–5 log khush hon, tab resellers laao, unhe demo video aur pitch ke saath.

## Owner ko dene wali business advice
Ye in-app content aur Academy mein jaayegi:
- Pricing per meal aur per month rakho. Monthly plan par chhota discount do, aur extras alag se charge karo.
- Cost per tiffin (raashan, gas, packaging, delivery) track karo, taaki badhne se pehle apna margin pata ho.
- Shuru mein 15–30 customer rakho. Students, PG residents aur office workers sabse aasaan milte hain.
