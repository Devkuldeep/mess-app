# 07. Developer ka din: ek feature, ticket se production tak

## 📖 Kahani: Tumhara pehla bada ticket
**Ticket:** "Payment offline record ho, aur net aane par ek hi baar save ho" (MESS-151).

**9:30, samajhna.** Tum ne ticket, AC aur design padhe. Phir Neha se 2 sawal kiye:
1. "Payment ki id kahan banegi?" → Neha: "**Device par.** Offline replay mein duplicate rokne ka yahi tareeka hai."
2. "Delivery role payment kar sakta hai?" → "Nahi. Server par bhi rokna hai, sirf UI mein chhupana kaafi nahi."

**10:00, chhota design note** (ticket ke comment mein):
- naya outbox op `payment`
- `parseOp` mein validation
- server par `createMany({ skipDuplicates: true })`
- UI par optimistic "sync baaki"

**10:30, branch:**
```bash
git switch -c feat/offline-payment
```

**11:00–15:00, code**, test pehle, us hisse ke liye jo pure logic hai:
1. `src/lib/sync.ts` → `PaymentOp` type + `parseOp` validation (amount > 0, 2 decimal, method, note max 200).
2. `src/lib/sync.test.ts` → galat amount, galat UUID aur lamba note reject ho.
3. `src/server/mutations.ts` → `applyPayment`: role check, customer usi org ka hai, `skipDuplicates`.
4. `src/components/payment-form.tsx` → device par `paymentId`, `enqueue()`, pending list.
5. `src/lib/i18n.ts` → naye strings **en + hi**.

**15:00, khud test** (manual):
- Chrome DevTools → Network → Offline → payment daalo → "sync baaki" dikha.
- Online karo → ek row bani.
- Phir wahi op dobara bheja (outbox ka replay) → phir bhi ek hi row.

**16:00, self-review:** apna diff aise padha jaise kisi aur ka ho. Do galtiyan mili: ek `console.log` reh gaya tha, aur ek string sirf English mein thi.

**16:30, PR** (neeche namuna). CI green hua. **17:00 Neha ka review:**
> ⚠️ *blocking:* `applyPayment` mein `customerId` usi org ka hai, ye check karo, warna dusre mess ke customer par payment ban sakti hai.
> 💬 *question:* amount ko round kyun kiya, server par bhi karna chahiye?
> 🔧 *nit:* variable naam `n` → `amount`.

**Agle din:** fix kiya, Neha ne approve kiya, **squash merge** hua, aur preview deploy par Isha (QA) ne verify kiya. Changeset bhi gaya: "Payment ab bina internet ke bhi record hoti hai." Ticket **Done**.

> Ye flow is repo mein asli hai: `src/lib/sync.ts`, `src/components/outbox.ts`, `src/app/api/sync/route.ts`, `src/server/mutations.ts` (`applyPayment` mein `customerInOrg` aur `skipDuplicates`).

## 🏢 Industry mein kaise hota hai: feature ka lifecycle
```
Ticket samjho → sawal poochho → chhota design (bade kaam ke liye RFC)
→ branch → test + code → khud test (happy + edge + offline) → self-review
→ commit(s) → PR → CI → code review → feedback fix → merge
→ preview/staging verify (QA) → release → production monitor → ticket close
```

### Code review: dono taraf
**Author ke roop mein:**
- PR **chhota** rakho, ek kaam ka, ~400 line tak.
- Description mein: kya, **kyun**, kaise test kiya, screenshots/GIF, risks.
- Pehle khud review karo, aur jo baat reviewer poochega uska jawab pehle se likh do.
- Feedback ko personal mat lo. Code par baat hai, tum par nahi.

**Reviewer ke roop mein**, ye dekho (zaroorat ke order mein):
1. **Correctness:** kya ye sahi hai? Edge cases? Offline/replay?
2. **Security:** permission, tenant isolation (`orgId`), input validation, secrets.
3. **Data:** migration safe hai? Backward compatible? Index chahiye?
4. **Tests:** sahi cheez test hui? Fail hone wala case bhi?
5. **Design:** sahi jagah par hai? (`src/lib` pure, `src/server` server-only.) Duplicate logic?
6. **Readability:** naam, chhote functions, comments mein "kyun".
7. **Nits:** chhoti style ki baatein. Inhe "nit" likh kar non-blocking batao.

**Comment ke labels** se tone saaf rehti hai: `blocking`, `question`, `suggestion`, `nit`, `praise`. Achhi cheez ki taarif bhi karo.

### Merge ke tareeke
- **Squash merge:** ek PR = ek commit `main` par. History saaf rehti hai (hamara tareeka).
- **Rebase:** linear history, par commits waise hi rehte hain.
- **Merge commit:** poori branch history.

## 👨‍💻 Developer deep dive

### 1. Debugging ka tareeka (andaaze se nahi)
1. **Reproduce:** pakke steps. "Kabhi-kabhi hota hai" se kaam nahi chalta.
2. **Isolate:** kahan toota? Browser, server, DB, ya network?
3. **Hypothesis:** "mera andaaza hai ki timezone ki wajah se…"
4. **Verify:** log, breakpoint ya test se sabit karo.
5. **Fix + test:** bug ka ek test, jo pehle fail ho aur fix ke baad pass ho (regression test).
6. **Root cause likho:** PR mein "kyun hua".

**Tools:**
- Browser DevTools: Network, Application → IndexedDB/Service Worker, Performance
- `npm run db:studio` (Prisma Studio)
- server logs
- `git bisect`: kaunse commit se toota, binary search se
- `node --test` se ek file chalao

### 2. Achhe commits
```
feat(payments): record payments offline via outbox
fix(payments): check customer belongs to org before insert
test(sync): reject payment ops with invalid amount
```
Commit message mein **kya + kyun**. "fixed stuff" se kuch pata nahi chalta.

### 3. Self-review checklist (PR kholne se pehle)
- [ ] Diff khud padha. Koi `console.log`, comment kiya hua code ya TODO bina ticket ke nahi
- [ ] Naye strings en + hi
- [ ] Har server entry point par permission + `orgId`
- [ ] Galat input par kya hota hai, test kiya
- [ ] Offline/replay ka case (agar applicable)
- [ ] `npm test && npm run typecheck && npm run lint`
- [ ] Changeset (user-visible ho to)

### 4. AI coding tools ka sahi use
- AI se likhwao, par **har line samjho**. Jo samajh nahi aaya, woh merge mat karo.
- AI ka code bhi review aur tests se guzrega. Hallucinated APIs aam baat hain, isliye docs se verify karo. Is repo mein Next ke docs `node_modules/next/dist/docs/` mein hain (AGENTS.md).
- Secrets, production data ya customer ki jaankari prompt mein mat daalo.
- Project ke rules (CLAUDE.md) AI ko bhi dikhte hain, isliye unhe updated rakho.

### 5. Time aur focus
- **Deep work** ke blocks banao (2 ghante, notifications band).
- Context switch mehnga hota hai. Review ka time tay karo (jaise subah aur shaam).
- Poochne mein sharm mat karo. Par saath mein batao ki kya-kya try kiya (15-minute rule).

## 📄 Namuna: PR description
```markdown
## Kya badla aur kyun
Payment ab offline record hoti hai (MESS-151). Delivery staff/owner ke paas basement me net nahi hota.

## Kaise
- Outbox op `payment` (src/lib/sync.ts) + validation
- Device par paymentId (UUID) → server `createMany({ skipDuplicates })` → replay safe
- Server par role + customer-in-org check (applyPayment)
- UI: pending payments "sync baaki" ke saath

## Testing
- Unit: sync.test.ts (+4 cases)
- Manual: offline → 2 payments → online → 2 rows; same op replay → 2 hi rows (GIF attached)

## Risk / rollout
- Purane clients par koi asar nahi (naya op type). Rollback: revert, queued ops retry honge.
```

## ⚠️ Aam galtiyan
- Ticket aadha padh kar code shuru kar dena.
- 2,000 line ka PR. Koi theek se review nahi kar pata, aur bugs nikal jaate hain.
- Sirf happy path test karna.
- Review comments ko ignore karna, ya behas mein ulajhna. Agar baat 2 comments se aage jaaye to call kar lo.
- "Mere yahan chalta hai" bol kar CI fail ko nazarandaz karna.

## ✅ Seekh
- **Samjho → chhota banao → khud todo → dikhao → sudhaaro.**
- Review code ka hota hai, insaan ka nahi.
- Bug ka fix tabhi poora hai jab uska test bhi ho.

## 🔗 Is repo mein
- Offline flow: `src/lib/sync.ts`, `src/components/outbox.ts`, `src/app/api/sync/route.ts`, `src/server/mutations.ts`
- CLAUDE.md → "Adding a new offline-capable action" (3 steps)

## 🏋️ Practice task
`recordPayment` (`src/app/actions/customers.ts`) aur `applyPayment` (`src/server/mutations.ts`) dono padho. Phir ek **review comment** likho ki dono jagah logic kyun duplicate hai, aur [../plan/platform-foundations.md](../plan/platform-foundations.md) §5 ka command layer ise kaise ek karega.
