# 09. Frontend aur mobile deep dive: RSC, forms, offline PWA, performance, a11y, TWA

## 📖 Kahani
Rohan (frontend) ne Tum ko ek **sasta Android phone** diya (2 GB RAM) aur kaha: "Hamara user ye phone chalata hai, tumhara MacBook nahi. DevTools mein 'Slow 3G' + '4x CPU slowdown' lagao, aur dekho app kaisa lagta hai."

Delivery list khulne mein 6 second lage. Wajah teen nikli: bada JS bundle, ek bhaari animation, aur Hindi font load hone ka intezaar. Teeno theek karke 2.2 second hua. Rohan: "Frontend ka matlab sirf sundar UI nahi hai. Matlab hai **user ke phone par tez, samajh mein aane wala aur bharosemand** UI."

## 1. Rendering ke models
| Model | Kahan render | Kab |
|---|---|---|
| CSR (client-side) | Browser mein JS | Bahut interactive apps. Pehla load slow |
| SSR (server-side) | Har request par server | Taaza data, achha SEO |
| SSG / ISR | Build time / kabhi-kabhi | Blog, legal pages |
| **RSC** (React Server Components) | Server par component, client ko kam JS | **Hamara default.** Data server par, sirf interactive hissa client par |

**Is repo ke rules** (CLAUDE.md):
- **"use client" sirf interactive leaves mein.** Poora page client component mat banao.
- **Cache Components:** jo cookies, params ya DB padhta hai, woh `<Suspense>` ke andar render ho. Pattern: ek sync `default export`, jo async component ko `<Suspense fallback={<ConnectivityFallback/>}>` mein lapetta hai (rule 4).
- Layout ke top par session `await` mat karo, warna poora page ruk jaata hai.

## 2. Data aur mutations
- **Reads:** Server Component seedha `src/server/data.ts` bulata hai. Client par fetch/`useEffect` nahi.
- **Writes:** Server Actions (`src/app/actions/*`). Uske baad `refresh()` se UI taaza hota hai.
- **Offline writes:** outbox → `/api/sync` (§5).
- **Next 16 ka `useOffline`:** offline mein navigations aur actions ko roke rakhta hai aur reconnect par dobara bhejta hai. **Par sirf jab tak tab khula ho.** Isliye zaroori kaam outbox se jaate hain.

## 3. Forms: progressive enhancement
- Form **JS ke bina bhi** kaam kare: plain HTML form post ek Server Action ko. JS aane par behtar UX.
- `ActionForm` (`src/components/ui/forms/action-form.tsx`):
  - har field ke neeche uska error dikhata hai
  - galti par jo likha tha woh wapas bhar deta hai (password nahi)
  - pehle galat field par focus le jaata hai, kyunki phone par woh screen ke bahar ho sakta hai
- **Validation UX:**
  - native `required` aur `maxLength` se turant feedback
  - server ka zod error hi aakhri sach hai
  - error text mein ho, sirf laal rang se nahi
- Chhoti settings ke liye `QuickForm` ("…" phir "✓ saved"), aur delete ke liye `ConfirmButton` (do tap).

## 4. State management: kaunsa state kahan
| State | Kahan rakhein | Is repo mein |
|---|---|---|
| Server ka data (customers, bills) | **Server Components** (RSC) | `data.ts` → page |
| Form ka state | `ActionForm` / `useActionState` | forms |
| Filters, tabs, search | **URL** (`?d=tomorrow`) | Share aur refresh ke baad bhi rehta hai |
| Offline queue | **IndexedDB (Dexie)** | `src/lib/local-db.ts` |
| Global UI (toast, confirm) | **zustand** store | `src/stores/*` |

⚠️ **zustand mein kabhi server data ya per-user cheez mat rakho.** SSR mein module-level store **saari requests mein share** hota hai, aur ek user ka data dusre ko dikh sakta hai (rule 9).

## 5. Offline / PWA: teen layers
```
1. Service Worker (Serwist): app ka shell + pages cache (network-first, 4s timeout, 7 din), /offline fallback. Sirf production build mein.
2. Next useOffline: tab khula ho to actions pending rakhta hai.
3. Outbox (Dexie): delivery/payment/wastage pehle phone ke DB mein → UI turant → /api/sync par order mein replay
   (reconnect, focus, har 30s). App band ho jaaye tab bhi bacha rehta hai.
```
- **Optimistic UI:** `usePendingOps()` pending ops ko server data ke upar dikhata hai ("⏳ sync baaki").
- **Idempotency:** har op ka device-generated id. Server par duplicate nahi (chapter 08).
- **Logout:** cached pages aur local DB saaf. Pehle warning, agar unsynced ops hon. Phone aksar share hote hain.
- **Kya offline nahi:** customer skip (server time), settings, customer edit.
- **Aage:** Background Sync API (app band ho tab bhi sync), ops ka version, Dexie migrations (foundations §16).
- **Test kaise karein:** `npm run build && npm start` → page ek baar kholo → DevTools → Network → Offline → reload ya tap karo.

## 6. Performance: Core Web Vitals
| Metric | Kya napta hai | "Good" |
|---|---|---|
| **LCP** (Largest Contentful Paint) | Sabse bada content kab dikha | ≤ 2.5s |
| **INP** (Interaction to Next Paint) | Tap ke baad UI kitni jaldi badla | ≤ 200ms |
| **CLS** (Cumulative Layout Shift) | Load ke dauraan cheezein kitna khiski | ≤ 0.1 |

**Tareeke:**
- **Kam JS:** RSC, chhote client components, aur bhaari library ka dynamic import.
- **Bundle dekho:** kya-kya client mein ja raha hai. Is repo ka ek asli issue: `clientT` poori en + hi dictionary har page par le jaata hai (foundations §14).
- **Fonts:** subset + `display: swap`. Images: sahi size, lazy load.
- **Main thread:** lambe loops aur heavy animation sasta phone atka dete hain.
- **Real device + throttling** par napo, aur performance budget CI mein rakho (production-readiness Phase 5).

## 7. Accessibility (a11y) code mein
- **Semantic HTML pehle:** `button`, `label`, `dialog`, `nav`, `main`. `div` par onClick mat lagao.
- **Native `<dialog>`** (is repo ke Drawer/Dialog): focus trap, Esc aur focus wapas laana browser se muft.
- Har input ka `label`, aur errors `aria-describedby` se jude hon.
- Keyboard se poora flow chal sake. Focus dikhna chahiye.
- **Reduced motion:** `prefersReducedMotion()` (`src/components/ui/gsap.ts`) se animation fade mein badalti hai.
- Swipe actions ke saath button bhi ho. Swipe kabhi akela raasta na ho (rule 11).

## 8. i18n code mein
- Har string `en` + `hi` mein (`src/lib/i18n.ts`). Server par `getT()`, aur client components ko strings **props** se.
- String jod kar sentence mat banao. `fmt("{n} बाकी", { n })` jaise templates use karo.
- Number/date/money ke formatters ek jagah, locale ke hisaab se.

## 9. Design system engineering
- **Tokens** `globals.css` mein (Tailwind v4 `@theme`). Custom CSS `@utility` ya `@layer components` mein, kyunki plain rules Turbopack mein drop ho jaate hain (rule 12).
- **Variants** cva se, class merge `cn()` se.
- **Composition:** chhote parts (`DrawerHeader`, `DrawerBody` …), ek bada "god component" nahi.
- **Animation:** GSAP sirf `ui/gsap.ts` se register, `useGSAP` + `scope` ke saath, taaki cleanup apne aap ho aur memory leak na ho.

## 10. Frontend testing
- **Pure logic** (formatting, table sort/search, validation) ko `src/lib/*.test.ts` mein unit test karo.
- **Component behaviour** mein user ki nazar se test karo (role, label se dhoondho), implementation se nahi.
- **E2E** (Playwright, planned): offline flow, mobile viewport, aur accessibility (axe).
- Visual regression ke tests aksar flaky hote hain. Unki jagah dev galleries (`/dev/*`) mein haath se check.

## 11. Android app (TWA) aur iOS
- **TWA (Trusted Web Activity):** Play Store ka app jo andar PWA kholta hai, bina URL bar ke. Codebase alag nahi hota.
  - **Digital Asset Links:** `/.well-known/assetlinks.json` saabit karta hai ki app aur site ek hi owner ke hain (`ANDROID_PACKAGE_NAME`, `ANDROID_CERT_SHA256`, jisme upload key **aur** Play App Signing key dono hon).
  - Banane ke tools: PWABuilder ya Bubblewrap. **Domain pehle final karo,** kyunki app usi se bandh jaata hai.
  - Manifest ke screenshots Chrome ke install sheet aur store ke liye hain.
- **iOS:** PWA chalta hai, par web push sirf "Add to Home Screen" ke baad (iOS 16.4+) aur kuch limits ke saath. Background sync nahi hai.

## 📄 Namuna: frontend PR checklist
- [ ] Kya ye server component reh sakta tha? "use client" sirf zaroori hisse mein
- [ ] Loading, empty, error aur offline states
- [ ] Strings en + hi, props se
- [ ] Tap target ≥ 44px, keyboard/focus theek, labels
- [ ] Sasta phone + Slow 3G par check (screenshot ya number)
- [ ] Naya component hai to gallery (`/dev/*`) mein uski states
- [ ] zustand mein server/per-user data nahi

## ⚠️ Aam galtiyan
- Poora page `"use client"` bana dena, aur data client par `useEffect` se laana.
- Server data global store mein rakhna, jisse SSR mein data leak hota hai.
- Sirf fast laptop par test karna.
- Offline/error states bhool jaana.
- `div` buttons aur bina label ke inputs.
- Animation mein cleanup bhool jaana, jisse memory leak hota hai.

## ✅ Seekh
- **Server pehle, client sirf zaroorat par.**
- State ko uski sahi jagah rakho: server, URL, form, IndexedDB ya UI store.
- User ke phone par napo, aur har state design karo.

## 🔗 Is repo mein
- CLAUDE.md rules 4–12, "Offline architecture"
- `src/components/ui/*`, `src/components/outbox.ts`, `src/lib/local-db.ts`, `src/app/sw.ts`, `src/components/app-runtime.tsx`
- `src/app/.well-known/assetlinks.json/route.ts`, `src/lib/assetlinks.ts`

## 🏋️ Practice task
`npm run build && npm start` karo, `/delivery` kholo, phir offline hokar 3 ticks karo, app band karke kholo, aur online karo. Har step par DevTools → Application → IndexedDB mein outbox dekho, aur likho ki op kab bana aur kab gaya.
