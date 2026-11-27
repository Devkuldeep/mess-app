# Business model: SaaS, reseller aur kamai

> Source: purana `init-2.md` aur `init-4.md` (Step 6), aur root ka `plan-buiness.md` (content/AI ideas).
> Technical plans:
> - billing ka plan abhi likhna baaki hai ([../roadmap.md](../roadmap.md) → M-BILL)
> - SaaS metrics ke liye [../plan/business-growth.md](../plan/business-growth.md) Part 3

## 1. Structure: 4 levels
```
Super Admin (hum)
 └── Reseller (student/agent)
      └── Organization (mess / tiffin service)
           └── Users: Owner, Manager, Delivery staff  +  Customers (bina login, link se)
```

| Level | Kya dekhta/karta hai | Status |
|---|---|---|
| **Super Admin** | Saare resellers, messes, revenue, plans, commission; kisi org ko suspend karna | ❌ ([plan/roles-permissions.md](../plan/roles-permissions.md) §7, [plan/observability.md](../plan/observability.md) Level D) |
| **Reseller** | Apne messes, unka payment status, apna commission, referral link/code | ❌ (M-RESELLER) |
| **Organization** | Apna alag data, menu, customers aur branding | ✅ (branding 🟡) |
| **Org roles** | Owner (sab kuch), Manager (roz ka kaam), Delivery (sirf delivery list) | ✅ ([plan/roles-permissions.md](../plan/roles-permissions.md)) |

## 2. Tenant isolation (sabse zaroori rule)
- Har tenant table mein `orgId` hai, aur har query `ctx.orgId` se filter hoti hai. Ye code level par hai (`src/server/CLAUDE.md`).
- **Faisla:** Supabase ki jagah Prisma + Postgres liya, aur RLS ki jagah app-level isolation. Postgres RLS baad mein defence-in-depth ke liye jod sakte hain ([../roadmap.md](../roadmap.md) → Decisions).

## 3. White-label: kitna door tak

| Level | Kya milta hai | Kab |
|---|---|---|
| Basic | Mess ka naam, logo, colors | Stage 2 (abhi sirf `brandColor`) |
| Subdomain | `sharma-mess.app.com` | Stage 5 |
| Custom domain | `app.sharmamess.com` | Baad mein, paid plan |
| Har mess ka alag native app | n/a | **Nahi banayenge.** Kharcha aur review ki jhanjhat bahut hai |

App distribute kaise hoga:
- Ek hi PWA aur ek Play Store app (TWA).
- Har mess ka apna link aur QR code.
- Customer link se kholta hai, aur chahe to "Add to Home Screen" kar leta hai.

## 4. Mess owner ke plans (monthly)
- **Free trial:** 14 din.
- **Starter:** kam customers (jaise 30 tak).
- **Growth:** zyada customers, staff logins aur WhatsApp reminders.
- **Pro:** custom domain, advanced reports aur forecasting.

Daam ₹299–₹999/month ke beech realistic lagte hain. **Final daam 5–10 owners se baat karke tay karenge.** Daam aur plan ke features `src/lib/business.ts` (`PLANS`) mein hain, abhi placeholder ke saath.

**Plan limits** ye honge: customers ki ginti, staff logins, aur WhatsApp/SMS quota (notifications plan ka `NotificationUsage`). Ye limits billing module mein enforce hongi.

## 5. Billing aur payouts
- Mess owner se paisa **Razorpay Subscriptions / UPI AutoPay** se lenge.
- **Payment fail hone par:**
  - Pehle grace period milega.
  - Phir naye entries ruk jaayengi (read-only mode).
  - **Data kabhi delete nahi hoga.**
- **Margin:** WhatsApp API aur SMS ka kharcha plan ke daam mein jod ke rakhna hai, nahi to profit khatam ho jaayega.

## 6. Reseller model
- **Commission:** recurring 30–40% har mahine (Option A, recommended). Isse reseller mess ko active rakhne ke liye motivated rehta hai. Doosra option tha pehle mahine bada hissa aur baad mein kam.
- **Hisaab** system khud nikalega. Payout mahine mein ek baar hoga, manually ya Razorpay Route se.
- **Dashboard** mein "kitna kamaya, kitna pending" saaf dikhna chahiye, nahi to bharosa toot jaata hai.
- **Rules:**
  - Ek mess sirf ek reseller se judega, aur signup par reseller code lock ho jaayega.
  - Terms mein likhna hai ki end-customer ka data mess ka hai (DPDP).
- **Training:** resellers ke liye training guide, demo mode (sample data ke saath), pitch (WhatsApp message, poster) aur leaderboard/badges. Ye reseller toolkit hai, [feature-backlog.md](feature-backlog.md) mein.
- **Kab shuru karein:** jab product 3–5 pilot owners ke saath sach mein kaam karta dikh jaaye.

## 7. Kamai ke aur raaste (baad mein)
- **Premium features:** forecasting, festival insights aur advanced reports Growth/Pro plan mein.
- **Add-on packs:** extra WhatsApp/SMS credits.
- **Content aur Academy:** basic courses free, advanced ya certification paid.
- **AI features:**
  - Paid plan mein AI data entry aur "Hindi AI assistant" milega.
  - Free users ko app ke andar hi free alternatives batayenge, jaise "ye prompt copy karke kisi bhi AI mein daalo, jawab yahan paste karo, system accept kar lega" (`plan-buiness.md` ka idea).
  - Details: [modules/academy-content.md](../modules/academy-content.md).
- **Fintech partner:** owners ko working-capital loan ke liye jodna (bahut baad mein).
- **Benchmarking:** "Aapke area ka avg wastage", sirf anonymous aggregates se. Ye Pro plan ki value hai.

## 8. Go-to-market
1. Pilot: 3–5 owners ko free.
2. Apne shehar ke PG, hostel aur office-area tiffin waale pehle.
3. Entry plan competitors se thoda sasta, aur 14 din ka trial.
4. Phir resellers, unki training aur recurring commission ke saath.
5. Content (blog, YouTube, WhatsApp tips) ko marketing channel bhi banana hai ([modules/academy-content.md](../modules/academy-content.md)).
