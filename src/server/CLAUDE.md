# src/server — server-only data access

Everything here imports `server-only`; never import it from a client component
(type-only imports are fine).

## Tenant isolation checklist (no database RLS — this layer IS the boundary)

- Get context with `requireMember(roles?)` / `requireStaff()` from `auth.ts`. It redirects if not signed in, not in an org, or wrong role.
- Every Prisma call on tenant tables (`plan`, `customer`, `skip`, `holiday`, `delivery`, `payment`, `member`, `invite`, `org`, `dish`, `wastageEntry`) includes `orgId: ctx.orgId` in `where` (or `data` on create).
- Lookups by id: `findFirst({ where: { id, orgId } })`, `updateMany`/`deleteMany({ where: { id, orgId } })` — never `findUnique/update/delete({ where: { id } })` alone.
- Before writing a row that references a customer/plan id from the client, confirm it belongs to the org (`customerInOrg` in `mutations.ts`). Composite FKs `(orgId, customerId)` / `(orgId, planId)` in the schema back this up at the DB level.
- Validate ids with `isUuid` and dates with `isISODate` before they reach Prisma.
- Roles: `owner` (everything), `manager` (daily ops, no org settings), `delivery` (delivery list + mark delivered only; no payments).
- The customer portal (`getPortal`, `actions/portal.ts`) authenticates by `portalToken` only and must only ever touch that one customer.
- Staff invites (`staff.ts`, `actions/staff.ts`): `/join/<token>` is public; the token picks the invite, and the account must have the invite's phone. Only owners create/cancel invites or change roles; owner rows are never changed or removed there.

## Files

- `db.ts` — Prisma client singleton (pg adapter).
- `auth.ts` — sessions (cookie holds a random token; DB stores its sha256), `getUser`, `getMember`, `requireMember`, `requireStaff`.
- `password.ts` — scrypt hash/verify (node:crypto, no native deps).
- `data.ts` — org-scoped read queries used by pages.
- `staff.ts` — team members + pending invites (owner screen), `getInvite` for the public join page.
- `mutations.ts` — idempotent writes shared by Server Actions and `/api/sync`.
- `i18n.ts` — `getT()` reads the `lang` cookie.
- `learn.ts` — reads `docs/work-flow-story/*.md` for the public `/learn` pages (`'use cache'`, no tenant data).

Getting heavier? Postgres Row Level Security can be layered on later (set `app.org_id` per transaction via a Prisma client extension) as defence in depth.
