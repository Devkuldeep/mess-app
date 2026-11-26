# Mess SaaS: white-label, reseller-based

Yeh model accha hai, kyunki tum mess walon ko khud sell nahi karoge. Students sell karenge aur tum sirf product aur billing sambhaloge.

## 1. Structure: 4 levels

```
Tum (Super Admin)
 └── Reseller (student/agent)
      └── Organization (mess / tiffin service)
           └── Users: Owner, Manager, Delivery boy, Customers
```

- **Super Admin (tum):** saare resellers, messes, revenue, plans aur commission dekhoge, aur kisi ko suspend kar sakoge.
- **Reseller:** apna dashboard hoga jisme uske messes, unke payment status, uska commission aur referral link/code dikhega.
- **Organization (tenant):** ek mess ka apna alag data, menu, customers aur branding hoga.
- **Org ke andar roles:** Owner (sab kuch), Manager (daily kaam), Delivery staff (sirf delivery list), Customer (sirf apna account).

## 2. Multi-tenant ka sabse zaroori rule
Har table me `org_id` hoga, aur database level par isolation hoga (Postgres Row Level Security). Ek mess ka data doosre ko kabhi nahi dikhna chahiye. Yeh baad me fix karna bahut mushkil hai, isliye shuru se sahi karo.

## 3. White-label: kitna door tak jaana hai

| Level | Kya milta hai | Kab banao |
|---|---|---|
| Basic | Mess ka naam, logo, colors | MVP me |
| Subdomain | `sharma-mess.tumhariapp.com` | MVP me |
| Custom domain | `app.sharmamess.com` | Baad me, paid plan |
| Alag native app (Play Store) | Har mess ka apna app | **Mat karo**. Kharcha aur review jhanjhat bahut hai |

**App download ka sahi tareeka:** ek hi PWA rakho. Har mess ka apna link aur QR code hoga, customer use khol kar "Add to Home Screen" karega aur usko mess ke naam aur logo wala app milega. Ya ek hi Play Store app me "Mess code" daal kar branding load ho.

## 4. Paisa kaise banega

**Mess owner ka plan (monthly):**
- Free trial: 14 din
- Starter: kam customers tak (jaise 30)
- Growth: zyada customers + staff logins + WhatsApp reminders
- Pro: custom domain + reports

Price tum market dekh kar tay karna. Chhote mess walon ke liye ₹299–₹999/month ke beech ka range realistic lagta hai, par pehle 5–10 mess walon se poochh lo.

**Reseller ka commission:**
- Option A: har mess ke monthly payment ka 30–40% recurring. Isse reseller ko lagatar kamai hoti hai aur woh mess ko active rakhta hai.
- Option B: pehle mahine ka bada hissa + baad me kam. Reseller ko jaldi paisa milta hai.

Recurring wala model reseller ko support aur retention ke liye motivate karta hai, to woh behtar hai.

## 5. Billing aur payouts
- Mess owner se paisa **Razorpay Subscriptions / UPI AutoPay** se lo.
- Commission ka hisaab system khud nikale, aur payout tum mahine me ek baar manually ya Razorpay Route se karo.
- Reseller dashboard me "kitna kamaya, kitna pending" saaf dikhna chahiye, nahi to bharosa toot jaata hai.

## 6. Tech suggestion (sasta aur tez)
- **Frontend:** Next.js (PWA)
- **Backend + DB + Auth:** Supabase (Postgres, RLS, login, free tier se shuru)
- **Payments:** Razorpay
- **WhatsApp:** shuru me click-to-chat links, WhatsApp API baad me (usme per-message kharcha lagta hai)
- **Hosting:** Vercel

Shuru me monthly kharcha lagbhag zero ya bahut kam rahega.

## 7. Phases me banao

1. **Phase 1, single mess jaisa kaam karne wala product:** customers, tomorrow's count, delivery list, payments, skip/pause.
2. **Phase 2, multi-tenant:** org signup, roles, har org ka branding, subdomain.
3. **Phase 3, reseller system:** referral code, reseller dashboard, commission tracking.
4. **Phase 4, billing:** trial, subscription, auto-suspend jab payment na ho.
5. **Phase 5, growth:** custom domain, WhatsApp API, reports.

Pehle 1–2 khud 3–5 mess walon ko free me do aur feedback lo. Uske baad hi resellers laao, kyunki kaam karta hua product dikhane par hi student bech payenge.

## 8. Dhyan rakhne wali baatein
- **Support:** resellers onboarding aur training karenge, to unke liye ek chhota training guide aur demo video banao.
- **Customer kiska hai:** terms me likh do ki end-customer data mess ka hai aur platform sirf use karta hai. DPDP Act (India ke data privacy rules) ka dhyan rakhna.
- **Reseller dusre ke mess ko ulta na bech de:** ek mess ek hi reseller se jude, aur signup par reseller code lock ho jaaye.
- **Non-payment:** payment fail hone par grace period do, phir sirf naye entries rok do, data delete mat karo.
- **Margin:** WhatsApp API aur SMS ka kharcha plan me jod ke rakho, nahi to profit khatam ho sakta hai.

Agle step me main Phase 1 + 2 ka multi-tenant structure (database tables, roles, org signup) design karke ek working prototype bana sakta hoon. Pehle yeh batao: tumhare resellers zyada tar kis shehar ya kis type ke mess (student PG, office tiffin) ko target karenge?

Want me to put this on a Whiteboard?