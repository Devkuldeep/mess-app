# prisma — schema & migrations

- Change `schema.prisma`, then `npm run db:migrate -- --name <what_changed>` (local Docker Postgres). Commit the generated folder under `migrations/`. Never edit an applied migration; add a new one.
- Production/CI applies migrations with `npm run db:deploy` (or the Dockerfile `migrator` target).
- After schema changes: `npx prisma generate` (also runs on `npm install`). The client is generated to `src/generated/prisma` — import from `@/generated/prisma/client` / `@/generated/prisma/enums`.
- Every new tenant table needs `orgId` + relation to `Org` (onDelete: Cascade) + an index starting with `orgId`. If it references a customer/plan, use a composite relation on `(orgId, customerId)` → `Customer(orgId, id)` so cross-org references are impossible.
- `@db.Date` columns hold calendar dates; convert with `toDbDate`/`fromDbDate` (`src/lib/dates.ts`).
- Money is `Decimal(10,2)`; call `.toNumber()` at the edge, round with 2 decimals.
- Ids that can be created offline (e.g. `Payment.id`) have **no default** — the device generates the UUID so replays are idempotent.
- `seed.ts` is idempotent-ish (skips if the demo owner exists). Run with `npm run db:seed`.
