# Progress tracker

Docs me jo plan hai, uska kitna bana hai. Build order aur dependencies [roadmap.md](roadmap.md) mein hain, aur ye file sirf **status** batati hai.
**Last updated:** 2026-11-27 · commit `76486ae` · live: https://mess-app-beta.vercel.app

Legend: ✅ bana hai · 🟡 aadha / jugaad wala · ❌ abhi nahi · ⏸️ jaan-boojh kar baad me

> Update kaise karein: koi feature banao to uski line ka status badlo, aur upar ki date + commit badal do.
> Naya idea aaye to sahi section me ❌ ke saath jodo.

---

## Ek nazar me

| Purana phase (ab [roadmap.md](roadmap.md) ke stages) | Status | Andaaza |
|---|---|---|
| Hafte 1-2: Single mess MVP | ✅ almost done | ~85% |
| Hafte 3-4: Multi-tenant | 🟡 base + staff invite bana, branding/subdomain baaki | ~60% |
| Hafte 5-6: Wastage + forecast | ✅ MVP + Phase 2 ka kaafi hissa | ~80% |
| Hafte 7-8: Reseller + billing | ❌ sirf pricing page | ~5% |
| Baad me (festival, WhatsApp bot, Academy, tracking…) | ❌ | ~0% |
| [product/feature-backlog.md](product/feature-backlog.md) ke ~50 extra ideas | 4-5 me kuch kaam hua | ~10% |
| [product/us-market.md](product/us-market.md) (USA version) | ⏸️ shuru nahi | 0% |

**Seedhi baat:** jo cheezein owner roz use karta hai (headcount, delivery, payments, skip, wastage), woh ban chuki hain, aur offline bhi chalti hain.
Paisa kamane wala hissa abhi bilkul nahi bana: reseller, subscription billing aur WhatsApp API.

---

## 1. Owner side ([modules/core-operations.md](modules/core-operations.md))

| Feature | Status | Kahan / note |
|---|---|---|
| Daily headcount (kal/aaj, lunch/dinner, veg/non-veg) | ✅ | `/today` (`?d=tomorrow`) |
| Headcount me extras (roti, rice, sweet) | ❌ | Extras ka data model hi nahi hai |
| Customer list (naam, phone, address, plan, start date, notes) | ✅ | `/customers`, search ke saath |
| Delivery list, area ke hisaab se group, tap = delivered | ✅ | `/delivery`, offline bhi |
| Payments aur dues, WhatsApp reminder ek tap me | ✅ | `/payments`, wa.me click-to-chat |
| Weekly menu setup + ek din ka badlaav | ❌ | Menu ka model/screen nahi hai (Dishes sirf wastage ke liye hain) |
| Holidays (band din, koi charge nahi) | ✅ | More → Holidays |
| Plans aur price | ✅ | More → Plans |
| Mess details, UPI ID, skip cutoff | ✅ | More → Mess |

## 2. Customer side ([modules/core-operations.md](modules/core-operations.md))

| Feature | Status | Note |
|---|---|---|
| Bina login ka link | ✅ | `/c/[token]` |
| Skip meal, cutoff ke saath (raat 9 baje default) | ✅ | Server time se check hota hai |
| Pause (kai din ek saath) | 🟡 | Skip grid se din-din karke ho jaata hai, "pause from–to" nahi hai |
| Balance dekhna | ✅ | |
| UPI se pay (link + QR) | ✅ | Paisa aane par owner khud "mark paid" karta hai |
| Weekly menu dekhna | ❌ | Menu hi nahi bana |
| Khud subscribe karna (plan chunna, trial day) | ❌ | Abhi owner hi customer jodta hai |
| Extras add karna | ❌ | |
| WhatsApp/push notification (menu, reminder, out for delivery) | ❌ | Sirf owner ke haath se WhatsApp reminder |
| Data notice + delete request | ✅ | DPDP ke liye |

## 3. Multi-tenant aur white-label ([product/business-model.md](product/business-model.md))

| Feature | Status | Note |
|---|---|---|
| Org signup + onboarding | ✅ | |
| Har table me `orgId`, data alag | ✅ | App-level (`requireMember`) |
| Postgres Row Level Security | ⏸️ | Supabase ki jagah Prisma liya; isolation code me hai, RLS nahi |
| Roles: owner / manager / delivery | ✅ | More → स्टाफ़: WhatsApp invite link, role badlo, hatao |
| Org switcher (ek user, kai mess) | ❌ | |
| Branding: naam, logo, color | 🟡 | `brandColor` field hai; logo upload aur poori theming nahi |
| Subdomain (`sharma-mess.app.com`) | ❌ | |
| Custom domain | ⏸️ | Paid plan, baad me |
| Ek PWA + Play Store app (TWA) | ✅ | assetlinks + screenshots ready, Play Store par daalna baaki |

## 4. Reseller + billing ([product/business-model.md](product/business-model.md), roadmap M-BILL / M-RESELLER)

| Feature | Status |
|---|---|
| Super admin dashboard (saare mess, revenue, suspend) | ❌ |
| Reseller: referral code, dashboard, commission | ❌ |
| Reseller code signup par lock | ❌ |
| Razorpay subscription / UPI AutoPay | ❌ |
| 14 din trial, grace period, auto-suspend (data delete nahi) | ❌ |
| Plan limits (Starter 30 customers, Growth staff + WhatsApp…) | ❌ |
| Pricing page — 🟡 page hai, daam placeholder (`src/lib/business.ts`) | 🟡 |

## 5. Wastage aur analytics ([modules/wastage-forecast.md](modules/wastage-forecast.md))

| Feature | Status | Note |
|---|---|---|
| Roz "kitna bana / kitna bacha" (30 sec) | ✅ | `/wastage`, offline bhi |
| Bache ka reason (dropdown) | ✅ | |
| Dish ka kharcha → nuksan ₹ me | ✅ | `costPerUnit` |
| Wastage report (7/30 din, worst dish, ₹ loss) | ✅ | `/wastage/report` |
| Cooking quantity suggestion + buffer | ✅ | 28 din ka median, "learning" mode |
| Wastage target + progress | ✅ | |
| Trend chart | ✅ | Wastage ka; orders/revenue ka chart nahi |
| Skip cutoff analytics (aakhri ghante ke skip) | ❌ | |
| Surplus flash sale / NGO donate | ❌ | |
| Pattern forecast (weekday, salary week, mausam) | ❌ | |
| Festival calendar + advance alert + region | ❌ | **Sabse bada differentiator, abhi baaki** |
| Owner dashboard: profit, churn risk, peak days, dish insights | 🟡 | Sirf wastage + payments ka hisaab |
| Area benchmarking, ML forecast | ⏸️ | Data aane ke baad |

## 6. [product/feature-backlog.md](product/feature-backlog.md) ke extra ideas

Kaam shuru hua:
- ✅ **Offline mode** (entry offline, baad me sync)
- ✅ **Data export Excel me** + Google Drive auto-backup (Roles/audit log wale idea ka backup hissa)
- ✅ **DPDP consent + "data delete karo"** (delete abhi manual email se)
- 🟡 **Smart cooking forecast** (sirf wastage data se; skip forecast nahi)
- 🟡 **Auto khata + UPI reminder** (khata apne aap banta hai; reminder WhatsApp par haath se bhejna padta hai)
- 🟡 **Diet preference** (sirf veg/non-veg + notes; Jain/no onion/vrat ki list nahi)
- 🟡 **Ek-tap entry** (wastage me hai; voice entry nahi)

Baaki sab ❌: WhatsApp bot, live delivery tracking, rating/feedback, prepaid wallet/meal packs, referral/loyalty, menu voting, expense + profit tracker, delivery boy route, voice entry, inventory, dine-in QR, staff salary, win-back campaigns, flash sale, complaint + auto-credit, parent link, bulk orders, GST invoice, multi-branch, Hindi AI assistant, recipe costing, reseller toolkit, audit log, public mess page, dabba tracking, delivery zones/slots, udhaar limit, greetings, add-on store, mandi rates, kitchen transparency, company/hostel accounts, health score, personal meal plans, festival pre-booking, missed-call skip, packing labels, roommate split, reseller leaderboard, **Mess Growth Academy**.

## 7. Jo docs me nahi tha, par bana hai

- PWA offline architecture (service worker + Dexie outbox + sync)
- Hindi-first i18n (Hindi/English toggle)
- Legal pages: Privacy, Terms, Refund, Shipping, Contact (placeholder ke saath; `npm run check:legal`)
- Google Drive backup owner ki apni Drive me (Google verification baaki)
- Design system: forms, drawers, dialogs, toasts, tables, cards, list, swipe rows
- Docker local dev, Vercel + Neon deploy, daily backup cron
- Conventional commits + Changesets changelog
- Android TWA ki taiyaari (assetlinks, screenshots, M logo)

## 8. Launch se pehle zaroori (blockers)

- [ ] `src/lib/business.ts` ke `[PLACEHOLDER]` bharo, lawyer se legal pages check karao
- [ ] Final domain lo (Play Store app usi se judega)
- [ ] Google OAuth app ko "Production" me publish + verification
- [x] Staff invite UI (delivery boy ke liye login dena)
- [ ] Uncommitted kaam commit karo: staff invites, multi-file Prisma schema (`prisma/schema/`), naya docs structure. M-ROLES isi par depend karta hai
- [ ] [roadmap.md](roadmap.md) ke Decision register ke 🔴 items (abhi: region Q1, SMS/DLT Q2, dev dependencies A1)
- [ ] 3-5 mess owners ko free pilot ([product/vision.md](product/vision.md) → Validation) — validation abhi hua ya nahi, yahan likho

## 9. Agla kya banaye

> Poora order ab [roadmap.md](roadmap.md) mein hai (Stage 1 → 2 → 3 …). Neeche purani short list hai.

1. ~~Staff invite UI~~ ✅ bana (2026-11-27)
2. **Weekly menu**: core feature ([modules/core-operations.md](modules/core-operations.md)), jo customer link par bhi dikhega.
3. **Pilot feedback** — 3-5 owners se chalwao, phir priority badlo.
4. **Billing (Razorpay subscription + trial + auto-suspend)** — tabhi paisa aayega.
5. **Reseller system** — referral code, dashboard, commission.
6. **Festival calendar + alerts** — sabse bada differentiator.
7. **WhatsApp API reminders** — kharcha plan me jod kar.
