# Module: Core operations (roz ka kaam)

> Source: purana `init.md`. Ye product ka dil hai: **kal kitna banana hai** aur **kisne pay kiya**.
> Status legend: ✅ bana · 🟡 aadha · ❌ nahi · ⏸️ baad mein. Live status ke liye [../progress.md](../progress.md) dekho.

## Owner side

| Feature | Status | Kahan / note |
|---|---|---|
| Daily headcount (aaj/kal, lunch/dinner, veg/non-veg, special requests) | ✅ | `/today` (`?d=tomorrow`) |
| Headcount mein extras (roti, rice, sweet) | ❌ | `AddonOrder` aayega, [../plan/core-domain-v2.md](../plan/core-domain-v2.md) §9 (P3) |
| Customer list (naam, phone, address, area, plan, start date, notes) | ✅ | `/customers` |
| Delivery list, area-wise, tap karo to delivered | ✅ | `/delivery`, offline bhi |
| Payments aur dues, ek tap mein WhatsApp reminder | ✅ | `/payments`, abhi wa.me se haath se bhejna padta hai |
| **Weekly menu** + kisi ek din ka badlaav | ❌ | **M-MENU, pilot se pehle zaroori** |
| Holidays (band din par koi charge nahi) | ✅ | More → Holidays |
| Plans aur daam | ✅ | More → Plans. Daam badalne par purani history bhi re-price ho jaati hai. Ye M-DOMAIN-V2 mein fix hoga (plan versions + band mahine ke statements) |
| Mess details, UPI, skip cutoff | ✅ | More → Mess |
| Staff logins (manager, delivery) | ✅ | More → Staff (invite link) |

## Customer side (`/c/[token]`, bina login)

| Feature | Status | Note |
|---|---|---|
| Skip meal, cutoff ke saath (default raat 9 baje) | ✅ | Server time se check hota hai |
| Pause (from–to) | 🟡 | Abhi din-din karke skip karna padta hai. `SubscriptionPause` aayega (M-DOMAIN-V2 P1) |
| Balance dekhna, UPI se pay (link + QR) | ✅ | Owner "mark paid" karta hai |
| Weekly menu dekhna | ❌ | M-MENU |
| Khud subscribe karna (plan, trial day) | ❌ | Baad mein (M-ONBOARD / public mess page) |
| Extras jodna | ❌ | Customer portal se extras: M-DOMAIN-V2 P4. Owner/delivery ke extras P3 mein |
| Notifications (kal ka menu, reminder, out for delivery) | ❌ | M-NOTIFY ([../plan/notifications.md](../plan/notifications.md)) |
| Data notice + delete request | ✅ | DPDP |

## Rules jo badalne nahi hain
- **Billing:** khula mahina derived hai (scheduled meals × plan ka daam), isliye skip aur holiday apne aap bill se ghat jaate hain. M-DOMAIN-V2 ke baad **band mahine ka bill freeze** ho jaayega, aur sudhaar ledger adjustment se hoga (decision D3, [../roadmap.md](../roadmap.md)).
- **Customer ka skip/unskip online-only hai:** cutoff server ke time se check hota hai.
- **Delivery aur payment offline chalte hain** (outbox), jaisa CLAUDE.md ke "Offline architecture" mein likha hai.

## Agla kaam is module mein
Pehle **M-DOMAIN-V2** ([../plan/core-domain-v2.md](../plan/core-domain-v2.md)) banega, kyunki niche ke teeno kaam usi ke data par hain:
1. **M-MENU, weekly menu:** owner hafte ka menu ek baar banata hai aur kisi ek din ko badal sakta hai. Customer link par bhi dikhega, aur aage `menu.tomorrow` notification se judega. Data P3 mein hai, aur UI ka chhota plan likhna baaki hai.
2. **Pause from–to:** customer portal par ek date range chunke pause (P1, `SubscriptionPause`).
3. **Extras/add-ons** (roti, sweet, chaas): headcount, delivery list aur bill teeno mein judenge (P3, `AddonOrder`).
