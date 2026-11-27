# Roles & permissions redesign

## Context
Abhi role checks lagbhag 30 jagah bikhre hue hain: `requireStaff()`, `requireMember(["owner"])`, `role === "delivery"`, `staffOnly` tabs, aur `owner`/`staff` booleans. Isliye naya role jodna ya kisi ek staff ki access badalna mushkil hai. Is redesign ke teen goal hain:
1. Ek central **permission map**, aur har check usi se ho. Default roles ka behaviour bilkul same rahega.
2. Abhi **koi naya role nahi**. Baad mein naya role jodne ke liye sirf enum value, ek map entry aur i18n label chahiye honge.
3. **Har member ke liye overrides**: role ki defaults ke upar owner kisi staff ko extra permission de sakta hai ya default mein se hata sakta hai. DB mein sirf yeh farak save hoga.
4. Platform roles (Super Admin, Reseller) abhi build nahi honge, par model mein unki jagah rahegi.

**Prerequisite:** staff-invite ka uncommitted kaam (Invite model, `actions/staff.ts`, `/more/staff`, `/join/[token]`, migration `20261127045237_staff_invites`) pehle commit ho. Ye plan usi ke upar banega.

## Permission list (abhi ke behaviour se mapped)
Owner ke paas saari permissions hain. Manager ke paas saari grantable permissions hain. Delivery ke paas sirf `delivery.view` aur `delivery.mark` hain.

| Permission | Server enforcement |
|---|---|
| `today.view` | `/today` |
| `delivery.view` / `delivery.mark` | `/delivery`, `applyDelivery` |
| `customers.view` / `customers.edit` | `/customers*` pages, `actions/customers.ts` |
| `payments.view` / `payments.record` / `payments.delete` | `/payments`, customer page, `recordPayment`, `deletePayment`, `applyPayment` (sync) |
| `wastage.entry` / `wastage.report` | `/wastage`, `applyWastage`, `/wastage/report` |
| `plans.edit`, `dishes.edit`, `holidays.edit` | `/more/*` screens + `actions/settings.ts` |
| **Owner-only** (kabhi grant nahi ho sakti): `settings.org`, `staff.manage`, `backup.manage`, `export.download` | `/more/mess`, `updateOrg`, staff actions, `/more/backup`, `actions/drive.ts`, `api/google/*`, `api/export` |

- **Prerequisites (`REQUIRES`):**
  - `customers.edit` → `customers.view`
  - `payments.view` → `customers.view`
  - `payments.record` / `payments.delete` → `payments.view`
  - `delivery.mark` → `delivery.view`

  Kisi permission ka prerequisite na ho to woh permission drop ho jaati hai, kabhi apne aap add nahi hoti.
- `/more` (profile, language, logout) har member ke liye hamesha khula hai, taaki har user ke paas ek safe home page ho.

## Implementation

### 1. `src/lib/permissions.ts` (new, pure, unit-tested)
- `ROLES`, `Role`, `STAFF_ROLES`, `isRole`, `isStaffRole`
- `PERMISSIONS`, `Permission`, `OWNER_ONLY`, `GRANTABLE`, `ROLE_DEFAULTS: Record<Role, …>`, `REQUIRES`
- `PERMISSION_GROUPS` (kitchen, delivery, customers, payments, setup), jo UI ke liye hain
- Functions:
  - `sanitizeOverrides(role, grants, revokes)`: unknown, owner-only aur redundant values hata deta hai.
  - `resolvePermissions(role, grants, revokes)`: `(defaults ∪ grants) − revokes`, phir REQUIRES ka cascade. Owner ko hamesha saari permissions milti hain.
  - `diffFromDefaults(role, checked)`: form mein checked set ko role defaults se minimal diff mein badalta hai.
  - `can(ctx, perm)`
  - `homeFor(perms)`: `/today`, ya `/delivery`, ya `/more`.
  - `permLabelKey(p)`
- `src/lib/invite.ts`: local `Role`, `STAFF_ROLES`, `isStaffRole` aur `homeFor` hata kar `permissions.ts` se lo. `inviteSchema` (`src/lib/validation.ts`) mein `z.enum(STAFF_ROLES)` use karo.

### 2. Schema: `prisma/schema/org.prisma` → `Member`
```prisma
grants  String[] @default([])
revokes String[] @default([])
```
Naya migration banao: `npm run db:migrate -- --name member_permissions`. Ye purely additive hai.

### 3. `src/server/auth.ts`
- `OrgCtx` mein `permissions: Permission[]` jodo. `getMember` ise `resolvePermissions` se calculate karega, har request par DB se. Isliye revoke agli request se hi lagu ho jaata hai.
- `requireMember()` ab sirf membership check karega.
- Naya `requirePermission(...perms)`: permission na ho to `redirect(homeFor(ctx.permissions))`. Isse redirect loop nahi banega.
- `requireStaff` delete karo.
- Compile-time assertion: lib ka `Role` aur Prisma ka `Role` same hone chahiye.

### 4. Har scattered check ko badlo
- **Pages:**
  - `customers`, `customers/[id]`, `customers/new`, `customers/[id]/edit`
  - `payments`, `wastage`, `wastage/report`
  - `today` (manual redirect hata do)
  - `more/plans`, `more/dishes`, `more/holidays`, `more/mess`, `more/backup`, `more/staff`

  Har page `requirePermission(...)` use karega. Customer page aur Today ke andar ke buttons (PaymentForm, delete, edit, wastage buttons, report link) `can()` se gate honge.
- **Actions:**
  - `actions/customers.ts` aur `actions/settings.ts`: har function apni permission khud check karega. `owner()` aur `staff()` helpers hata do.
  - `actions/drive.ts`: `backup.manage`.
  - `actions/staff.ts`: `staff.manage`.
- **API:**
  - `api/export`: `export.download`, nahi to 403.
  - `api/google/connect` aur `callback`: `backup.manage`.
- **`src/server/mutations.ts`:** `applyDelivery` → `delivery.mark`, `applyPayment` → `payments.record`, `applyWastage` → `wastage.entry`. Teeno `"forbidden"` throw karenge, jiska matlab `retry: false` hai.
- **Navigation:**
  - `(app)/layout.tsx`: `permissions` prop pass karo.
  - `bottom-nav.tsx`: har tab par `perm?: Permission`.
  - `more/page.tsx`: har row aur har data fetch apni permission se.
- **Landing:** `joinWithInvite` aur `(auth)/join/[token]` mein `homeFor(resolvePermissions(...))` use karo.

### 5. Owner UI
- `src/server/staff.ts`: `listStaff` mein grants aur revokes bhi lautao. Naya `getStaffMember(ctx, userId)`, jo org-scoped `findFirst` karega.
- `more/staff/page.tsx`: member rows ab `ListItem href=/more/staff/[userId]` honge, aur overrides hon to "custom access" meta dikhega.
- **New** `more/staff/[userId]/page.tsx` (mobile-ui skill follow karo; sync default export + Suspense):
  - Role picker: `FormRadioGroup` in `QuickForm` → `changeRole`. Role badalne par overrides reset ho jaate hain, aur UI mein ye hint dikhega.
  - Permissions: har group ka ek `ListSection`, aur usme `FormSwitch name="p:<perm>"` rows. Har row bataayegi "role ka default" ya "jodi gayi/hatayi gayi". Owner-only permissions sirf locked text mein dikhengi.
  - `ConfirmButton` "Role defaults par reset karo" aur "Hatao".
  - Owner ki row `notFound()` dega.
- **New actions:**
  - `setMemberPermissions`: `isUuid` check, member load karo, owner ho to mana karo, `GRANTABLE` mein se jo checked hain unka `diffFromDefaults` nikalo, phir `updateMany({ where: { orgId, userId, role: member.role } })`.
  - `resetMemberPermissions`.
  - `changeRole` ab overrides bhi clear karega.

### 6. Export, i18n, docs, changeset
- `src/server/export.ts`: `staff.csv` mein `extra_permissions` aur `removed_permissions` columns, aur JSON mein `grants` aur `revokes`.
- `src/lib/i18n.ts` (en + hi):
  - har permission ka `perm_*` label
  - group titles
  - `permissions`, `customAccess`, `resetToDefaults`, `ownerOnly`, `defaultForRole`, `roleChangeResets`
- Docs update: `src/server/CLAUDE.md` (roles → `permissions.ts`, checklist → `requirePermission`) aur `CLAUDE.md` ka staff note.
- `.changeset/staff-permissions.md` (minor): "Owner ab har staff ke liye chun sakte hain ki woh kya dekhe aur kya kare."

## Platform roles: baad ke liye (abhi build nahi)
- `User.platformRole PlatformRole?` (`super_admin`, `reseller`), aur ek alag `src/lib/platform-permissions.ts` jiska namespace bhi alag ho (`platform.*`, `reseller.*`).
- `requirePlatform(perm)` sirf `User` padhega, `Member` nahi. Iske routes alag honge (`/admin`, `/reseller`). Types ki wajah se dono namespaces mix nahi ho sakte.
- Platform role se org data ki access kabhi nahi milegi:
  - Reseller ko `Org.resellerId` se sirf aggregates dikhenge.
  - Super Admin ko kisi mess ke andar dekhna ho to explicit, audited support session chahiye hoga.

## Aage ke plans se aane wali permissions (ek jagah list)
Ye permissions `PERMISSIONS`, `ROLE_DEFAULTS` aur `PERMISSION_GROUPS` mein **apne module ke saath** judengi, abhi nahi. Unka naam aur default yahan pehle se tay hai, taaki baad mein confusion na ho. Commands inhe `permission` mein declare karenge ([platform-foundations.md](platform-foundations.md) §5).

| Permission | Owner | Manager default | Delivery | Grantable? | Kis plan se |
|---|---|---|---|---|---|
| `subscriptions.edit` (needs `customers.edit`) | ✓ | ✓ | ✗ | ✓ | [core-domain-v2](core-domain-v2.md) |
| `menu.edit` | ✓ | ✓ | ✗ | ✓ | core-domain-v2 |
| `addons.order` | ✓ | ✓ | ✗ | ✓ (delivery ko bhi) | core-domain-v2 |
| `ledger.adjust` | ✓ | ✗ | ✗ | ✓ | core-domain-v2 |
| `billing.close` | ✓ | ✗ | ✗ | ✓ | core-domain-v2 |
| `reports.view` / `reports.export` (needs view) | ✓ | ✗ | ✗ | ✓ | [observability](observability.md) |
| `audit.view` | ✓ | ✗ | ✗ | ✓ | observability |
| `finance.view` | ✓ | ✗ | ✗ | ✓ | [business-growth](business-growth.md) |
| `expenses.record` | ✓ | ✓ | ✗ | ✓ | business-growth |
| `inventory.manage` | ✓ | ✓ | ✗ | ✓ | business-growth |
| `stock.entry` | ✓ | ✓ | ✗ | ✓ | business-growth |
| `leads.manage` (needs `customers.view`) | ✓ | ✓ | ✗ | ✓ | business-growth |
| `notifications.manage` | ✓ | ✗ | ✗ | ✓ | [notifications](notifications.md) |

**Platform namespace** (`User.platformRole`, org permissions se kabhi mix nahi hota): `platform.analytics`, `platform.revenue`, `platform.orgs.view`, `platform.support_session`. `/admin` ke liye 2FA zaroori hai ([production-readiness.md](production-readiness.md) §2f).

## Tests: `src/lib/permissions.test.ts`
- Manager aur delivery ke exact default sets, jisse "behaviour nahi badla" lock ho jaaye.
- Owner par overrides ka koi asar nahi hota.
- Junk aur owner-only grants ignore hote hain.
- REQUIRES cascade sahi kaam karta hai.
- `diffFromDefaults` aur `resolvePermissions` round-trip karte hain.
- `homeFor` hamesha aisa route deta hai jo user khol sake (fuzz test).
- Har role aur permission ka en aur hi label hai.
- `GRANTABLE ∩ OWNER_ONLY = ∅`.
- `invite.test.ts` ko update karo.

## Verification
1. `npm run db:migrate -- --name member_permissions`, phir `npm test && npm run typecheck && npm run lint`.
2. Seed data (owner 9876543210) se ek manager aur ek delivery user invite karo. Check karo ki har role ke tabs, More rows aur landing page bilkul pehle jaise hain.
3. Manager se `payments.view` revoke karo:
   - Payments tab chala jaata hai.
   - `/payments` khulne par `/today` par redirect hota hai.
   - Customer page par PaymentForm nahi dikhta.
   - Forged `recordPayment` se kuch nahi hota.
   - `/api/sync` payment op `forbidden` deta hai.
4. Delivery user ko `customers.view` do: tab dikhta hai aur home `/delivery` hi rehta hai. Phir `delivery.view` revoke karo: home `/more` ho jaata hai aur koi redirect loop nahi banta.
5. Role badlo: overrides clear ho jaate hain. psql se `grants` mein ek bogus string daalo: woh ignore hoti hai. Manager ke liye `/api/export` 403 hi deta hai.
6. `npm run build && npm start`, phir offline mein revoke karo: sync par stale UI waale ops reject hote hain.
7. Grep karo: `role ===`, `requireStaff`, `requireMember([` sirf `permissions.ts` ya display code mein bache hon. Phir `npm run changeset:status`.
