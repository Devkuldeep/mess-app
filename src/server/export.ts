// "Download my data": everything an org owns, as a ZIP of Excel-ready CSVs
// plus a full JSON dump (for re-import / migration). Org-scoped like data.ts.
import "server-only";
import { strToU8, zipSync } from "fflate";
import { db } from "./db";
import type { OrgCtx } from "./auth";
import { getBilling } from "./data";
import { fromDbDate, todayIn } from "@/lib/dates";
import { toCsv } from "@/lib/csv";

const d = (v: Date | null) => (v ? fromDbDate(v) : null);
const ts = (v: Date | null) => (v ? v.toISOString() : null);

export async function buildExport(ctx: OrgCtx): Promise<{ filename: string; zip: Uint8Array }> {
  const orgId = ctx.orgId;
  const today = todayIn(ctx.org.timezone);

  const [org, members, plans, customers, skips, holidays, deliveries, payments, bills, dishes, wastage] = await Promise.all([
    db.org.findUniqueOrThrow({ where: { id: orgId } }),
    db.member.findMany({ where: { orgId }, include: { user: { select: { name: true, phone: true } } }, orderBy: { createdAt: "asc" } }),
    db.plan.findMany({ where: { orgId }, orderBy: { createdAt: "asc" } }),
    db.customer.findMany({ where: { orgId }, include: { plan: { select: { name: true } } }, orderBy: { name: "asc" } }),
    db.skip.findMany({ where: { orgId }, orderBy: [{ date: "asc" }, { customerId: "asc" }] }),
    db.holiday.findMany({ where: { orgId }, orderBy: { date: "asc" } }),
    db.delivery.findMany({ where: { orgId }, orderBy: [{ date: "asc" }, { customerId: "asc" }] }),
    db.payment.findMany({ where: { orgId }, orderBy: [{ paidOn: "asc" }, { createdAt: "asc" }] }),
    getBilling(ctx, today),
    db.dish.findMany({ where: { orgId }, orderBy: { sortOrder: "asc" } }),
    db.wastageEntry.findMany({ where: { orgId }, include: { items: true }, orderBy: [{ date: "asc" }, { meal: "asc" }] }),
  ]);
  const dishName = new Map(dishes.map((x) => [x.id, x]));

  const name = new Map(customers.map((c) => [c.id, c.name]));
  const files: Record<string, Uint8Array> = {};
  const add = (file: string, text: string) => { files[file] = strToU8(text); };

  add("customers.csv", toCsv(
    ["id", "name", "phone", "address", "area", "plan", "diet", "notes", "start_date", "end_date", "customer_link_token"],
    customers.map((c) => [c.id, c.name, c.phone, c.address, c.area, c.plan?.name ?? null, c.diet, c.notes, d(c.startDate), d(c.endDate), c.portalToken]),
  ));
  add("balances.csv", toCsv(
    ["customer_id", "name", "phone", `meals_${today.slice(0, 7)}`, `bill_${today.slice(0, 7)}`, `paid_${today.slice(0, 7)}`, `balance_as_of_${today}`],
    bills.map((b) => [b.customerId, b.name, b.phone, b.monthMeals, b.monthAmount, b.monthPaid, b.balance]),
  ));
  add("payments.csv", toCsv(
    ["id", "customer_id", "customer", "amount", "paid_on", "method", "note", "recorded_at"],
    payments.map((p) => [p.id, p.customerId, name.get(p.customerId) ?? "", p.amount.toNumber(), d(p.paidOn), p.method, p.note, ts(p.createdAt)]),
  ));
  add("skips.csv", toCsv(
    ["customer_id", "customer", "date", "meal", "by_customer"],
    skips.map((s) => [s.customerId, name.get(s.customerId) ?? "", d(s.date), s.meal, s.byCustomer]),
  ));
  add("deliveries.csv", toCsv(
    ["customer_id", "customer", "date", "meal", "delivered_at"],
    deliveries.map((x) => [x.customerId, name.get(x.customerId) ?? "", d(x.date), x.meal, ts(x.deliveredAt)]),
  ));
  add("plans.csv", toCsv(
    ["id", "name", "meals", "price_per_meal"],
    plans.map((p) => [p.id, p.name, p.meals, p.pricePerMeal.toNumber()]),
  ));
  add("dishes.csv", toCsv(
    ["id", "name", "unit", "per_tiffin", "cost_per_unit", "changes_daily", "removed"],
    dishes.map((x) => [x.id, x.name, x.unit, x.perTiffin.toNumber(), x.costPerUnit?.toNumber() ?? null, x.variety, x.archived]),
  ));
  add("wastage.csv", toCsv(
    ["date", "meal", "tiffins", "dish", "variety", "unit", "cooked", "leftover", "leftover_pct", "cost_per_unit", "loss_rs", "reason", "note"],
    wastage.flatMap((e) => e.items.map((i) => {
      const cooked = i.cooked.toNumber();
      const left = i.leftover.toNumber();
      const cost = i.costPerUnit?.toNumber() ?? null;
      return [d(e.date), e.meal, e.tiffins, dishName.get(i.dishId)?.name ?? i.dishId, i.label, dishName.get(i.dishId)?.unit ?? null,
        cooked, left, cooked > 0 ? Math.round((left / cooked) * 1000) / 10 : null, cost, cost === null ? null : Math.round(left * cost * 100) / 100, e.reason, e.note];
    })),
  ));
  add("holidays.csv", toCsv(["date", "reason"], holidays.map((h) => [d(h.date), h.reason])));
  add("staff.csv", toCsv(["name", "phone", "role", "joined"], members.map((m) => [m.user.name, m.user.phone, m.role, ts(m.createdAt)])));

  const json = {
    format: "mess-manager-export",
    version: 2,
    exportedAt: new Date().toISOString(),
    org: { id: org.id, name: org.name, slug: org.slug, phone: org.phone, upiId: org.upiId, skipCutoffHour: org.skipCutoffHour, timezone: org.timezone, createdAt: ts(org.createdAt) },
    staff: members.map((m) => ({ name: m.user.name, phone: m.user.phone, role: m.role })),
    plans: plans.map((p) => ({ id: p.id, name: p.name, meals: p.meals, pricePerMeal: p.pricePerMeal.toNumber() })),
    customers: customers.map((c) => ({
      id: c.id, name: c.name, phone: c.phone, address: c.address, area: c.area, planId: c.planId, diet: c.diet,
      notes: c.notes, startDate: d(c.startDate), endDate: d(c.endDate), portalToken: c.portalToken,
    })),
    skips: skips.map((s) => ({ customerId: s.customerId, date: d(s.date), meal: s.meal, byCustomer: s.byCustomer })),
    holidays: holidays.map((h) => ({ date: d(h.date), reason: h.reason })),
    deliveries: deliveries.map((x) => ({ customerId: x.customerId, date: d(x.date), meal: x.meal, deliveredAt: ts(x.deliveredAt) })),
    payments: payments.map((p) => ({ id: p.id, customerId: p.customerId, amount: p.amount.toNumber(), paidOn: d(p.paidOn), method: p.method, note: p.note })),
    dishes: dishes.map((x) => ({ id: x.id, name: x.name, unit: x.unit, perTiffin: x.perTiffin.toNumber(), costPerUnit: x.costPerUnit?.toNumber() ?? null, variety: x.variety, archived: x.archived })),
    wastage: wastage.map((e) => ({
      date: d(e.date), meal: e.meal, tiffins: e.tiffins, reason: e.reason, note: e.note,
      items: e.items.map((i) => ({ dishId: i.dishId, label: i.label, cooked: i.cooked.toNumber(), leftover: i.leftover.toNumber(), costPerUnit: i.costPerUnit?.toNumber() ?? null })),
    })),
  };
  add("data.json", JSON.stringify(json, null, 2));
  add("README.txt", [
    `${org.name} — data export (${today})`,
    "",
    "CSV files open in Excel / Google Sheets. data.json has everything in one file.",
    "balances.csv: balance > 0 means the customer owes money; < 0 means advance paid.",
    "Keep this file private: it contains customer phone numbers and addresses,",
    "and customer_link_token lets anyone open that customer's skip/pay page.",
    "",
  ].join("\r\n"));

  // Fixed timestamp → identical data gives an identical ZIP.
  const zip = zipSync(files, { level: 6, mtime: new Date(`${today}T00:00:00Z`) });
  return { filename: `${org.slug}-data-${today}.zip`, zip };
}
