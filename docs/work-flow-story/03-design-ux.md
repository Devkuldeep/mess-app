# 03. Design (UX/UI): "kaisa dikhega, kaise chalega?"

## 📖 Kahani
Sana (designer) ne pehle din kaagaz par 6 screens ke sketches banaye aur Sunita didi ko dikhaye. Teen baatein turant saamne aayin:
1. Didi ne "Dashboard" padh kar poocha, "Ye kya hai?" Phir saari labels Hindi mein hui ("आज", "डिलीवरी", "हिसाब").
2. Raju (delivery) ek haath se phone chalata hai, isliye zaroori buttons **neeche** (thumb zone) aaye, aur tap area bade hue.
3. Testing mein didi ne galti se ek payment delete kar diya. Iske baad **"do tap se delete"** (`ConfirmButton`) ka pattern bana.

Tum ne Sana se poocha: "Design 'achha' kaise pata chalta hai?" Sana: "Jab user bina poochhe kaam kar le. Hum 5 logon ko task dete hain, jaise 'kal ka lunch count batao', aur dekhte hain kahan atakte hain. Sundar dikhna baad ki baat hai."

## 🏢 Industry mein kaise hota hai

### 1. Design ka process
```
Research → Information Architecture → User flows → Wireframes (low-fi)
→ Mockups (hi-fi) → Prototype → Usability test → Handoff → Design QA (build ke baad)
```
| Step | Kya | Output |
|---|---|---|
| Information Architecture (IA) | Kaunsi cheez kahan hai, aur navigation | Bottom nav: Aaj, Delivery, Customers, Hisaab, More |
| User flows | Kaam ke steps aur branches | "Payment record karo": customer → amount → method → save → receipt |
| Wireframes | Box aur text, bina rang | Layout jaldi test hota hai |
| Mockups | Final look, design system se | Figma screens |
| Prototype | Clickable flow | Usability test ke liye |
| Usability test | 5 users, real tasks, "bol kar socho" | Problems ki list, aur kitne log task poora kar paaye |
| Handoff | Specs, states, edge cases, assets | Developer ke liye screen spec |
| Design QA | Bana hua UI design se match karta hai ya nahi | Bugs/tweaks ki list |

**Tools:** Figma (components, auto-layout, variants), FigJam (flows), aur prototype testing ke tools.

### 2. Design system: ek baar banao, har jagah use karo
- **Tokens:** rang, spacing, typography, radius aur shadow ke **naam** wale values, jaise `brand`, `ink`, `muted`, `card`. Raw hex jagah-jagah nahi likhte.
- **Components:** Button, Input, Drawer, Dialog, Toast, Table, Card, List, aur unke variants (size, tone).
- **Patterns:** "form ke neeche saved tick", "delete do tap se", "empty state ke saath next action".
- **Kyun:** consistency (user har jagah ek jaisa paata hai), speed (naya screen 1 din mein ban jaata hai), aur accessibility ek jagah theek ho jaati hai.

### 3. Mobile-first ke rules
- **Thumb zone:** primary action neeche rakho. Tap target kam se kam **44–48 px**.
- **Ek screen, ek kaam.** Settings ek menu mein hon, aur har option ki apni screen (CLAUDE.md rule 6).
- **Progressive disclosure:** pehle zaroori cheez dikhao, baaki "aur dekho" mein.
- **Har screen ki saari states design karo:** loading, empty, error, offline, success, aur partial (kuch sync baaki).
- **Text:** chhote, seedhe Hindi shabd, action wale verbs ("सेव करें", "भेजें").

### 4. Accessibility (a11y): WCAG 2.2 ke basics
- Text contrast **4.5:1** (bada text 3:1). Owner ka chuna hua brand color bhi isse check hona chahiye.
- Keyboard/focus visible ho, har input ka label ho, aur errors text mein hon (sirf rang se nahi).
- Screen reader ke liye sahi HTML elements: button ke liye `button`, dialog ke liye `dialog`.
- **Reduced motion:** jinhe animation se dikkat hoti hai, unke liye motion kam karo.
- Font bada karne par layout na toote.

### 5. Localization (Hindi-first)
- Devanagari font aur line-height. Hindi mein matras upar-neeche jaati hain, isliye zyada jagah chahiye.
- **String jod kar sentence mat banao** ("₹" + amount + " baaki"). Hindi ka word order alag hota hai, isliye `fmt("{amount} बाकी", …)` jaisa template use karo.
- Date, number aur currency ka format locale ke hisaab se: ₹2,720 (lakh grouping), aur Hindi mein mahine ke naam.
- English mein design karke baad mein translate mat karo. Hindi se shuru karo.

### 6. Designer aur developer ka saath
- Designer **states aur edge cases** bhi deta hai, sirf happy path nahi.
- Developer design ke **feasibility** par jaldi bolta hai: "ye animation sasta phone par atkega", "ye offline mein kaise dikhega?"
- **Design QA:** build ke baad designer screen check karta hai. Chhote farak ticket mein jaate hain.

## 👨‍💻 Developer deep dive: design system code mein kaise banta hai (is repo)
| Cheez | Is repo mein | Seekh |
|---|---|---|
| Tokens | `src/app/globals.css` (Tailwind v4, config file nahi) | Rang ka naam use karo (`bg-brand`), hex nahi |
| Components | `src/components/ui/` (forms, drawers, dilog-box, toast, tables, cards, list) | Ek jagah banao, sab jagah import karo (`@/components/ui`) |
| Variants | **cva** (class-variance-authority) ke props, jaise `size`, `tone`, `side` | Component ka API saaf ho, aur har jagah alag class na likhni pade |
| Class merge | `cn()` = clsx + tailwind-merge (`src/lib/cn.ts`) | Bahar se `className` override safe rahe |
| Native elements | Drawer/Dialog native `<dialog>` par bane hain | Focus trap, Esc aur screen reader browser se muft milte hain |
| Motion | GSAP sirf `src/components/ui/gsap.ts` se, `useGSAP` + `scope` ke saath, `prefersReducedMotion()` | Animation ek jagah se control hoti hai, aur a11y ka dhyan rehta hai |
| Galleries | `/dev/forms`, `/dev/drawers`, `/dev/dialogs`, `/dev/tables`, `/dev/cards`, `/dev/list` (production mein 404) | Ye Storybook jaisa kaam karte hain: har component ki saari states ek page par |
| Rules | `.claude/skills/mobile-ui/SKILL.md` | Design ke rules likhe hue hon, sirf dimaag mein nahi |
| Patterns | `QuickForm` ("…" phir "✓ saved"), `ConfirmButton` (do tap se delete) | Ek pattern = kam bugs, user ko ek jaisa anubhav |

**Component API design ke sawal** (naya component banate waqt):
1. Iske **variants** kya hain (size, tone)? Kya ye cva mein aate hain?
2. Kya ye **server component** reh sakta hai, ya sirf iska chhota interactive hissa client mein jaana chahiye (rule: "use client" sirf leaves mein)?
3. Kya ye **keyboard** se chalta hai? Focus kahan jaata hai?
4. **Strings** props se aati hain (i18n, rule 5)?
5. Kya iski saari states gallery mein hain?

## 📄 Namuna: screen spec (handoff)
```
Screen: Delivery list (/delivery)
Goal: delivery staff ek haath se, bina net ke, tick kar sake.
Layout: upar meal toggle (Lunch/Dinner), area-wise groups, har row: naam, address, diet badge, notes, bada tick button (48px).
States:
  loading     → skeleton rows (5)
  empty       → "Aaj koi delivery nahi" + holiday ho to wajah
  offline     → upar patti "Offline: tick save ho rahe hain", har pending row par chhota ⏳
  error       → "Load nahi hua, dobara try karo" + retry
  all done    → "Sab deliver ho gaya 🎉"
Actions: row tap → tick/untick (optimistic); long text → 2 line tak.
Edge cases: 200 customers (scroll smooth), naam Hindi + English, address bahut lamba, same naam ke 2 log.
Analytics: delivery_marked (offline/online).
A11y: tick button ka label "Raju ko delivered mark karo"; contrast AA.
```

## ⚠️ Aam galtiyan
- Sirf happy path design karna, aur empty/error/offline states bhool jaana.
- Har screen par naya button style. Design system ke bina UI bikhar jaata hai.
- English mein design aur Hindi baad mein. Text phir buttons se bahar nikalta hai.
- Chhote tap targets aur halke grey text, jo dhoop mein nahi padha jaata.
- Animation ko feature samajhna. Sasta phone atakta hai, aur reduced motion ka dhyan nahi rehta.

## ✅ Seekh
- Design = **user ka kaam aasaan karna**. Test karo, maan kar mat chalo.
- Design system developer ke liye bhi speed hai.
- Har component: variants + states + a11y + i18n, aur gallery mein dikhe.

## 🔗 Is repo mein
- `.claude/skills/mobile-ui/SKILL.md`, CLAUDE.md rules 6–12
- `src/components/ui/`, `src/app/globals.css`, `src/app/dev/*`

## 🏋️ Practice task
`/dev/forms` gallery kholo (`npm run dev`) aur ek component ka code padho. Phir uske liye ek "screen spec" likho, upar ke namune ki tarah, jisme har state ho. Dekho ki koi state chhooti hui hai kya.
