// Org-scoped wastage queries (dishes, entries, history, suggestions).
import "server-only";
import { db } from "./db";
import type { OrgCtx } from "./auth";
import { getDayCount } from "./data";
import { addDays, eachDay, fromDbDate, toDbDate, type ISODate } from "@/lib/dates";
import { DEFAULT_DISHES, suggestCooking, wastageReport, type DishInfo, type Entry, type Reason } from "@/lib/wastage";
import type { MealName } from "@/lib/schedule";

type Ctx = Pick<OrgCtx, "orgId" | "org">;

export type DishRow = DishInfo & { variety: boolean; archived: boolean; used: number };

/** Create Dal/Chawal/Sabzi/Roti once for orgs that have no dishes yet. */
export async function ensureDefaultDishes(orgId: string) {
  if ((await db.dish.count({ where: { orgId } })) > 0) return;
  await db.dish.createMany({
    data: DEFAULT_DISHES.map((d, i) => ({ orgId, name: d.name, unit: d.unit, perTiffin: d.perTiffin, costPerUnit: d.costPerUnit, variety: d.variety, sortOrder: i })),
    skipDuplicates: true,
  });
}

export async function listDishes(ctx: Ctx, opts: { includeArchived?: boolean } = {}): Promise<DishRow[]> {
  await ensureDefaultDishes(ctx.orgId);
  const rows = await db.dish.findMany({
    where: { orgId: ctx.orgId, ...(opts.includeArchived ? {} : { archived: false }) },
    orderBy: [{ archived: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { items: true } } },
  });
  return rows.map((d) => ({
    id: d.id, name: d.name, unit: d.unit, perTiffin: d.perTiffin.toNumber(), costPerUnit: d.costPerUnit?.toNumber() ?? null,
    variety: d.variety, archived: d.archived, used: d._count.items,
  }));
}

/** Entries with items in [from, to], oldest first. */
export async function getEntries(ctx: Ctx, from: ISODate, to: ISODate): Promise<Entry[]> {
  const rows = await db.wastageEntry.findMany({
    where: { orgId: ctx.orgId, date: { gte: toDbDate(from), lte: toDbDate(to) } },
    include: { items: true },
    orderBy: [{ date: "asc" }, { meal: "asc" }],
  });
  return rows.map((e) => ({
    date: fromDbDate(e.date),
    meal: e.meal,
    tiffins: e.tiffins,
    reason: e.reason as Reason,
    items: e.items.map((i) => ({
      dishId: i.dishId, label: i.label, cooked: i.cooked.toNumber(), leftover: i.leftover.toNumber(), costPerUnit: i.costPerUnit?.toNumber() ?? null,
    })),
  }));
}

export async function getEntry(ctx: Ctx, date: ISODate, meal: MealName) {
  const e = await db.wastageEntry.findUnique({
    where: { orgId_date_meal: { orgId: ctx.orgId, date: toDbDate(date), meal } },
    include: { items: true },
  });
  if (!e) return null;
  return {
    tiffins: e.tiffins,
    reason: e.reason as Reason,
    note: e.note,
    items: e.items.map((i) => ({ dishId: i.dishId, label: i.label, cooked: i.cooked.toNumber(), leftover: i.leftover.toNumber() })),
  };
}

/** Which meals already have an entry on these dates ("date|meal"). */
export async function loggedMeals(ctx: Ctx, from: ISODate, to: ISODate): Promise<Set<string>> {
  const rows = await db.wastageEntry.findMany({
    where: { orgId: ctx.orgId, date: { gte: toDbDate(from), lte: toDbDate(to) } },
    select: { date: true, meal: true },
  });
  return new Set(rows.map((r) => `${fromDbDate(r.date)}|${r.meal}`));
}

const LEARN_DAYS = 28;

/** What to cook on `date` for each meal, learned from the last 4 weeks. */
export async function getSuggestions(ctx: Ctx, date: ISODate) {
  const [dishes, day, history] = await Promise.all([
    listDishes(ctx),
    getDayCount(ctx, date),
    getEntries(ctx, addDays(date, -LEARN_DAYS), addDays(date, -1)),
  ]);
  return {
    lunch: suggestCooking(day.counts.lunch.total, "lunch", dishes, history),
    dinner: suggestCooking(day.counts.dinner.total, "dinner", dishes, history),
    tiffins: { lunch: day.counts.lunch.total, dinner: day.counts.dinner.total },
    holiday: day.holiday !== undefined,
  };
}

export async function getReport(ctx: Ctx, today: ISODate, days: number) {
  const from = addDays(today, -(days - 1));
  const [dishes, entries] = await Promise.all([listDishes(ctx, { includeArchived: true }), getEntries(ctx, from, today)]);
  return wastageReport(entries, dishes, eachDay(from, today));
}
