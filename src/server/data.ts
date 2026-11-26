// Org-scoped read queries. Every function takes the OrgCtx from requireMember()
// and filters by ctx.orgId — this is the tenant-isolation boundary.
import "server-only";
import { db } from "./db";
import type { OrgCtx } from "./auth";
import { addDays, fromDbDate, isSkipLocked, monthEnd, toDbDate, todayIn, type ISODate } from "@/lib/dates";
import { billing, scheduledMeals, skipKey, type MealName, type SchedCustomer } from "@/lib/schedule";

type Ctx = Pick<OrgCtx, "orgId" | "org">;

async function schedulingInputs(orgId: string, from: ISODate, to: ISODate) {
  const [customers, holidays, skips] = await Promise.all([
    db.customer.findMany({
      where: { orgId, startDate: { lte: toDbDate(to) }, OR: [{ endDate: null }, { endDate: { gte: toDbDate(from) } }] },
      include: { plan: true },
      orderBy: { name: "asc" },
    }),
    db.holiday.findMany({ where: { orgId, date: { gte: toDbDate(from), lte: toDbDate(to) } } }),
    db.skip.findMany({ where: { orgId, date: { gte: toDbDate(from), lte: toDbDate(to) } } }),
  ]);
  const sched: SchedCustomer[] = customers.map((c) => ({
    id: c.id,
    startDate: fromDbDate(c.startDate),
    endDate: c.endDate ? fromDbDate(c.endDate) : null,
    meals: c.plan?.meals ?? null,
    pricePerMeal: c.plan ? c.plan.pricePerMeal.toNumber() : 0,
  }));
  return {
    customers,
    sched,
    holidays: new Map(holidays.map((h) => [fromDbDate(h.date), h.reason])),
    skipSet: new Set(skips.map((s) => skipKey(s.customerId, fromDbDate(s.date), s.meal))),
    skipCount: skips.length,
  };
}

export type DayCount = {
  date: ISODate;
  holiday: string | null | undefined; // undefined = not a holiday
  counts: Record<MealName, { veg: number; nonveg: number; total: number; skipped: number }>;
  notes: { id: string; name: string; notes: string; meals: MealName[] }[];
};

/** How many tiffins to cook on a date, split by meal and veg/non-veg. */
export async function getDayCount(ctx: Ctx, date: ISODate): Promise<DayCount> {
  const inp = await schedulingInputs(ctx.orgId, date, date);
  const byId = new Map(inp.customers.map((c) => [c.id, c]));
  const counts: DayCount["counts"] = {
    lunch: { veg: 0, nonveg: 0, total: 0, skipped: 0 },
    dinner: { veg: 0, nonveg: 0, total: 0, skipped: 0 },
  };
  const holidays = new Set(inp.holidays.keys());
  const meals = scheduledMeals(inp.sched, date, date, holidays, inp.skipSet);
  const notes = new Map<string, DayCount["notes"][number]>();
  for (const m of meals) {
    const c = byId.get(m.customerId)!;
    counts[m.meal][c.diet] += 1;
    counts[m.meal].total += 1;
    if (c.notes) {
      const n = notes.get(c.id) ?? { id: c.id, name: c.name, notes: c.notes, meals: [] };
      n.meals.push(m.meal);
      notes.set(c.id, n);
    }
  }
  for (const k of inp.skipSet) {
    const meal = k.split("|")[2] as MealName;
    counts[meal].skipped += 1;
  }
  return { date, holiday: inp.holidays.has(date) ? inp.holidays.get(date) : undefined, counts, notes: [...notes.values()] };
}

export type DeliveryRow = {
  customerId: string;
  name: string;
  phone: string | null;
  address: string | null;
  area: string | null;
  diet: "veg" | "nonveg";
  notes: string | null;
  delivered: boolean;
};

export async function getDeliveryList(ctx: Ctx, date: ISODate, meal: MealName): Promise<DeliveryRow[]> {
  const inp = await schedulingInputs(ctx.orgId, date, date);
  const delivered = await db.delivery.findMany({
    where: { orgId: ctx.orgId, date: toDbDate(date), meal },
    select: { customerId: true },
  });
  const done = new Set(delivered.map((d) => d.customerId));
  const due = new Set(
    scheduledMeals(inp.sched, date, date, new Set(inp.holidays.keys()), inp.skipSet)
      .filter((m) => m.meal === meal)
      .map((m) => m.customerId),
  );
  return inp.customers
    .filter((c) => due.has(c.id))
    .map((c) => ({
      customerId: c.id, name: c.name, phone: c.phone, address: c.address, area: c.area,
      diet: c.diet, notes: c.notes, delivered: done.has(c.id),
    }))
    .sort((a, b) => (a.area ?? "￿").localeCompare(b.area ?? "￿") || a.name.localeCompare(b.name));
}

export async function listCustomers(ctx: Ctx) {
  return db.customer.findMany({
    where: { orgId: ctx.orgId },
    include: { plan: { select: { name: true, meals: true } } },
    orderBy: [{ endDate: { sort: "desc", nulls: "first" } }, { name: "asc" }],
  });
}

export async function getCustomer(ctx: Ctx, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return db.customer.findFirst({ where: { id, orgId: ctx.orgId }, include: { plan: true } });
}

export async function listPlans(ctx: Ctx) {
  const plans = await db.plan.findMany({
    where: { orgId: ctx.orgId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { customers: true } } },
  });
  return plans.map((p) => ({ id: p.id, name: p.name, meals: p.meals, pricePerMeal: p.pricePerMeal.toNumber(), customers: p._count.customers }));
}

export async function listHolidays(ctx: Ctx, fromDate: ISODate) {
  const rows = await db.holiday.findMany({
    where: { orgId: ctx.orgId, date: { gte: toDbDate(fromDate) } },
    orderBy: { date: "asc" },
  });
  return rows.map((h) => ({ date: fromDbDate(h.date), reason: h.reason }));
}

export type BillRow = {
  customerId: string; name: string; phone: string | null; stopped: boolean;
  monthMeals: number; monthAmount: number; monthPaid: number; balance: number;
};

export async function getBilling(ctx: Ctx, month: ISODate): Promise<BillRow[]> {
  const mEnd = monthEnd(month);
  const first = await db.customer.findFirst({ where: { orgId: ctx.orgId }, orderBy: { startDate: "asc" }, select: { startDate: true } });
  if (!first) return [];
  const from = fromDbDate(first.startDate);
  const [inp, payments] = await Promise.all([
    schedulingInputs(ctx.orgId, from, mEnd),
    db.payment.findMany({ where: { orgId: ctx.orgId, paidOn: { lte: toDbDate(mEnd) } }, select: { customerId: true, amount: true, paidOn: true } }),
  ]);
  const bills = billing(
    inp.sched, month, new Set(inp.holidays.keys()), inp.skipSet,
    payments.map((p) => ({ customerId: p.customerId, amount: p.amount.toNumber(), paidOn: fromDbDate(p.paidOn) })),
    todayIn(ctx.org.timezone),
  );
  const byId = new Map(inp.customers.map((c) => [c.id, c]));
  const today = todayIn(ctx.org.timezone);
  return bills
    .map((b) => {
      const c = byId.get(b.customerId)!;
      return {
        customerId: b.customerId, name: c.name, phone: c.phone,
        stopped: !!c.endDate && fromDbDate(c.endDate) < today,
        monthMeals: b.monthMeals, monthAmount: b.monthAmount, monthPaid: b.monthPaid, balance: b.balance,
      };
    })
    .sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name));
}

export async function getCustomerPayments(ctx: Ctx, customerId: string) {
  const rows = await db.payment.findMany({
    where: { orgId: ctx.orgId, customerId },
    orderBy: [{ paidOn: "desc" }, { createdAt: "desc" }],
    take: 24,
  });
  return rows.map((p) => ({ id: p.id, amount: p.amount.toNumber(), paidOn: fromDbDate(p.paidOn), method: p.method, note: p.note }));
}

/** Running balance up to today for one customer. */
export async function getCustomerBalance(ctx: Ctx, customerId: string): Promise<number> {
  const today = todayIn(ctx.org.timezone);
  const rows = await getBilling(ctx, today);
  return rows.find((r) => r.customerId === customerId)?.balance ?? 0;
}

// ─────────────── Customer portal (no login, token only) ───────────────

export async function getPortal(token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const c = await db.customer.findUnique({ where: { portalToken: token }, include: { plan: true, org: true } });
  if (!c) return null;
  const tz = c.org.timezone;
  const today = todayIn(tz);
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const [holidays, skips, payments] = await Promise.all([
    db.holiday.findMany({ where: { orgId: c.orgId, date: { gte: toDbDate(today), lte: toDbDate(days[6]) } } }),
    db.skip.findMany({ where: { customerId: c.id, date: { gte: c.startDate, lte: toDbDate(days[6]) } } }),
    db.payment.findMany({ where: { customerId: c.id }, select: { amount: true, paidOn: true } }),
  ]);
  const hol = new Map(holidays.map((h) => [fromDbDate(h.date), h.reason ?? ""]));
  const skipSet = new Set(skips.map((s) => skipKey(s.customerId, fromDbDate(s.date), s.meal)));
  const start = fromDbDate(c.startDate);
  const end = c.endDate ? fromDbDate(c.endDate) : null;

  // balance up to today (all past holidays needed for charges)
  const pastHolidays = await db.holiday.findMany({ where: { orgId: c.orgId, date: { gte: toDbDate(start), lte: toDbDate(today) } }, select: { date: true } });
  const sched: SchedCustomer = { id: c.id, startDate: start, endDate: end, meals: c.plan?.meals ?? null, pricePerMeal: c.plan?.pricePerMeal.toNumber() ?? 0 };
  const charged = scheduledMeals([sched], start, today, new Set(pastHolidays.map((h) => fromDbDate(h.date))), skipSet).length * sched.pricePerMeal;
  const paid = payments.reduce((s, p) => s + p.amount.toNumber(), 0);

  return {
    customer: { name: c.name, diet: c.diet, start, end },
    plan: c.plan ? { name: c.plan.name, meals: c.plan.meals, pricePerMeal: c.plan.pricePerMeal.toNumber() } : null,
    org: { name: c.org.name, phone: c.org.phone, upiId: c.org.upiId, brandColor: c.org.brandColor, skipCutoffHour: c.org.skipCutoffHour },
    today,
    balance: Math.round((charged - paid) * 100) / 100,
    days: days.map((date) => ({
      date,
      holiday: hol.has(date) ? hol.get(date) || "" : null,
      active: date >= start && (!end || date <= end),
      locked: isSkipLocked(date, c.org.skipCutoffHour, tz),
      lunchSkipped: skipSet.has(skipKey(c.id, date, "lunch")),
      dinnerSkipped: skipSet.has(skipKey(c.id, date, "dinner")),
    })),
  };
}
export type Portal = NonNullable<Awaited<ReturnType<typeof getPortal>>>;
