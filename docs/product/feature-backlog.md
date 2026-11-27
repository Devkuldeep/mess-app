# Feature backlog (saare ideas, module-wise)

> Source: purana `feature-list.md` (aur `init.md` ke "nice to have").
>
> **Kaise use karein:**
> - Har idea ek module (roadmap ki `M-…` ID) aur ek stage se juda hai.
> - Naya idea aaye to yahan sahi module mein ❌ ke saath jodo.
> - Jab koi idea build karna ho, pehle uska module plan `docs/plan/` mein likho.
>
> Status: ✅ bana · 🟡 aadha · ❌ nahi · ⏸️ baad mein. Stage numbers [../roadmap.md](../roadmap.md) se hain.

## Customer engagement aur retention: M-ENGAGE (Stage 5–6)

| Idea | Kya | Status | Stage |
|---|---|---|---|
| Rating aur feedback | Har tiffin par ek-tap rating, aur kharab rating par owner ko alert | ❌ | 5 |
| Complaint + auto-credit | Photo ke saath complaint, aur sahi complaint par agle bill mein credit | ❌ | 6 |
| Referral aur loyalty | Dost laao to free meal, 3 mahine rehne par discount, streak rewards (20 din = 1 free) | ❌ | 5 (source/referral tracking Stage 4 mein) |
| Win-back campaigns | 5–7 din se gayab customer ko "aapko miss kiya" + offer | ❌ | 5 (M-NOTIFY + churn risk) |
| Weekly menu voting | Agle hafte ki dishes par vote | ❌ | 6 (M-MENU ke baad) |
| Auto greetings | Birthday, festival, menu change ke messages | ❌ | 5 |
| Trial tiffin offer (₹49) aur guest meal pass | Naye customer jodna | ❌ | 5 |
| Kitchen transparency | Roz rasoi ki photo, hygiene checklist, "khana taiyaar" | ❌ | 6 |
| Calories/protein info | Health-conscious customers ke liye | ❌ | 6 |

## Payments aur khata: M-PAYMENTS+ (Stage 4–5)
> Ye items [../plan/core-domain-v2.md](../plan/core-domain-v2.md) ke ledger aur statements par khade hain: prepaid = `pack` pricing + `pack_purchase`, late fee = ledger kind, aur GST bill = statement + `invoiceNo`. Collection aur auto-match M-COLLECT mein hai.


| Idea | Kya | Status | Stage |
|---|---|---|---|
| Auto khata + UPI reminder | Khata apne aap banta hai, reminder abhi haath se jaata hai | 🟡 | 4 (auto reminder M-NOTIFY se) |
| Prepaid wallet / meal packs | 26-meal pack, har tiffin par balance kate | ❌ | 5 |
| Udhaar limit aur late fee | Limit paar ho to tiffin ruke | ❌ | 5 |
| Parent payment link | Student ke parents fees bharein aur meal-count dekhein | ❌ | 5 |
| GST invoice PDF | Monthly bill apne aap | ❌ | 5 (M-BILL ke saath) |
| Roommate group + bill split | PG dost ek order, bill baant jaaye | ❌ | 6 |
| Company/hostel accounts | Ek admin, ek monthly bill | ❌ | 6 |
| UPI payment auto-match | Paisa aate hi khata match | ❌ | 6 (payment gateway/UPI intent par depend) |

## Menu aur orders: M-MENU (Stage 2, phir 5)
> Data model [../plan/core-domain-v2.md](../plan/core-domain-v2.md) mein hai: ek catalog (`Dish`), weekly menu (P3), extras (`AddonOrder`, P3/P4) aur customer prefs (P3). M-MENU sirf UI hai.


| Idea | Kya | Status | Stage |
|---|---|---|---|
| Weekly menu + ek din ka badlaav | Owner aur customer dono dekhein | ❌ | **2** |
| Add-on store / extras | Mithai, chaas, extra roti ek tap mein | ❌ | 2 (owner/delivery ke extras, M-DOMAIN-V2 P3) · 5 (portal + roz ke extras, P4) |
| Diet aur allergy preferences | Jain, no onion, vrat, kam tel; kitchen ko roz ki list | 🟡 sirf veg/non-veg + notes | 2 (`Customer.prefs`, M-DOMAIN-V2 P3) |
| Festival pre-booking | Special thali ka advance order | ❌ | 6 (M-FESTIVAL) |
| Bulk aur party orders | Catering form, quote, advance | ❌ | 6 |
| Personal meal plans | Gym/diabetic thali premium | ❌ | 6 |
| Packing labels + kitchen screen | Naam/address/preference label, prep list | ❌ | 5 |

## Delivery: M-DELIVERY+ (Stage 5–6)

| Idea | Kya | Status | Stage |
|---|---|---|---|
| Delivery staff login + ek-tap delivered | | ✅ | done |
| Route plan (optimized) | Area/route order | ❌ | 6 |
| Live delivery tracking | Customer ko location aur "10 min mein" | ❌ | 6 |
| Delivery zones aur slots | Pincode-wise charge, slot limit | ❌ | 6 |
| Dabba aur deposit tracking | Kitne dabbe diye ya wapas aaye | ❌ | 5 |
| Dine-in QR check-in | Headcount aur fraud control | ❌ | 6 |

## Kitchen, kharcha aur inventory: M-FINANCE, M-INVENTORY (Stage 4)
Ye sab [../plan/business-growth.md](../plan/business-growth.md) mein planned hain.

| Idea | Status |
|---|---|
| Expense aur profit tracker | ❌ planned |
| Inventory + supplier order (WhatsApp se) | ❌ planned (supplier order Stage 5) |
| Recipe costing | ❌ planned (`DishMaterial`) |
| Mandi rate alerts | ❌ Stage 6 |
| Staff attendance aur salary | ❌ Stage 5 (M-STAFF-HR) |
| Multi-branch dashboard | ❌ Stage 7 |

## Data entry aasaan banana: M-EASY-ENTRY (Stage 4–6)

| Idea | Status | Stage |
|---|---|---|
| Ek-tap entry (sliders/buttons) | 🟡 wastage mein hai | ongoing (mobile-ui skill) |
| Smart defaults / auto-fill (kal jaisa) | 🟡 | 4 |
| Customer khud data bharein (skip, address, plan) | 🟡 skip hai | 4–5 |
| Voice entry (Hindi) | ❌ | 6 (M-AI) |
| WhatsApp se entry (message/photo) | ❌ | 6 (M-AI + WhatsApp inbound) |
| Missed call / SMS se skip | ❌ | 6 (M-NOTIFY SMS) |
| Offline mode | ✅ | done |

## Communication: M-NOTIFY (Stage 3–4)
[../plan/notifications.md](../plan/notifications.md) dekho.

| Idea | Status | Stage |
|---|---|---|
| WhatsApp auto-bot ("skip kal", "menu") | ❌ | 6 (WhatsApp inbound) |
| Push/WhatsApp notifications (menu, reminder, out for delivery) | ❌ | 3–4 |

## Platform, reseller aur growth: M-ADMIN, M-RESELLER, M-PUBLIC (Stage 3–5)

| Idea | Status | Stage |
|---|---|---|
| Roles, audit log aur backup | 🟡 roles + export + Drive backup ✅, audit ❌ | 1, 3 |
| Mess health score (super admin) + support tickets | ❌ | 5 |
| Reseller toolkit (demo mode, lead tracker, pitch, videos) | ❌ | 5 |
| Reseller leaderboard aur rewards | ❌ | 5 |
| Mess ka public page + discovery (menu, photos, reviews, "order now") | ❌ | 5 (M-PUBLIC) |
| Hindi AI assistant | ❌ | 6 (M-AI) |
| Multi-language (Marathi, Tamil, Bengali) | ❌ | 7 |
| Fintech loan partner | ⏸️ | 7+ |

## Compliance
| Idea | Status | Stage |
|---|---|---|
| DPDP consent + "data delete karo" | ✅ (delete abhi manual) | automated delete: 2 |
| FSSAI licence + hygiene checklist reminder | ❌ | 5 |
