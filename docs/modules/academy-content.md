# Module: Growth Academy, content aur AI help

> Source: purana `feature-list.md` (Mess Growth Academy section) aur root ka `plan-buiness.md`.
> Roadmap: Stage 5 (M-ACADEMY) aur Stage 6 (M-AI). Pehle core product aur billing.

**Goal:** owner ko sirf software nahi, **business chalana bhi** sikhana. Iske teen fayde hain:
- **Retention:** jo owner seekhta hai aur jiska business badhta hai, woh app nahi chhodta.
- **Support kam:** resellers ko baar-baar samjhana nahi padta.
- **Marketing:** content se naye owners khud aate hain.

## 1. Content channels (niche: mess aur tiffin business)
- **Blog** (public site `(public)/`): tips aur tricks, operations optimization, marketing advice, pricing. Ye SEO ke liye bhi kaam aata hai.
- **YouTube** (baad mein): 3–5 minute ke Hindi videos. App mein unlisted embed, jisse hosting ka kharcha zero.
- **WhatsApp tips:** weekly tip card. Ye M-NOTIFY ke ek low-priority category se jaayega.
- **App mein:** dashboard par "aaj ka tip", aur har screen se juda chhota lesson.

## 2. In-app Academy (mini courses)

**Format:**
- Har lesson 3–5 minute ka (video ya ek page ka text), Hindi aur local language mein.
- Ek course mein 5–7 lessons, aur har lesson ke end mein ek **action task**, jaise "aaj 5 customers se feedback maango".
- Progress aur badges ("Certified Mess Owner"), jo mess ke public page par dikh sakein.
- App se judav: wastage wale lesson ke neeche "Apna wastage tracker kholo" button.
- Offline/WhatsApp: lesson ka summary WhatsApp par.

**Pehle courses:**
1. Mess shuru karna aur pehle 30 customer laana (pricing, trial tiffin, WhatsApp group, local marketing).
2. Wastage aur kharcha kam karna (sahi quantity, mandi tips, recipe costing, profit).
3. Customer retention (skip kam karwana, feedback, loyalty, churn rokna).
4. Hygiene aur FSSAI (licence, kitchen checklist, bharosa).
5. Marketing basics (Google Maps listing, Instagram/WhatsApp status, referral, festival campaigns).
6. Paisa sambhalna (udhaar recovery, monthly hisaab, GST basics, kab expand karein).
7. Bonus: "Festival season ki taiyaari", jo festival calendar se juda hoga.

**Personalised suggestion:** agar wastage zyada hai to app khud wastage course suggest kare. Ye business-growth plan ke insights engine se judega.

**Aur cheezein:** community Q&A, success stories ("pehle aur baad"), aur wahi courses resellers ki training ke liye bhi ("Mess kaise bechein").

**Kamai:** basic courses free, advanced ya certification paid/premium mein, aur course ke andar premium features ka natural upsell.

**Sasta shuru:**
- 2–3 course hum khud ya kisi achhe owner ke saath record karein.
- Videos YouTube unlisted par.
- Progress DB mein save ho.
- Jo lessons zyada dekhe jaate hain, wahi aur banayein (observability analytics se pata chalega).

## 3. AI integration (paid + free alternative)
- **Paid plan:** AI se data entry, jaise voice ("aaj 40 tiffin bane, 5 bache"), kharid ki parchi ki photo se kharcha, aur WhatsApp message se entry. Saath mein **Hindi AI assistant**, jisse owner pooch sake "is mahine ka profit kitna?" aur jawab chart ke saath mile.
- **Free alternative (app ke andar):** app ek **tayyar prompt** dega. Owner use kisi bhi free AI (ChatGPT, Gemini) mein copy karke apni parchi/note daalega, jawab ek tay format (JSON/CSV) mein aayega, aur owner use paste karega. App usse validate karke accept karega. Isse free users ko bhi AI ka fayda milta hai aur hamara AI ka kharcha nahi lagta.
- **Rules:**
  - AI ka output hamesha zod schema se validate ho (`src/lib/validation.ts` pattern), aur save hone se pehle owner use confirm kare.
  - Data bahar bhejne se pehle consent liya jaaye, aur privacy page mein AI processor ka naam ho.
- Plan likhna baaki hai: **M-AI** (Stage 6).

## Status
❌ Sab baaki. Public site aur legal pages bane hue hain, isliye blog wahi par jud sakta hai.
