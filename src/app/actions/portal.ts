"use server";
// Customer self-service (no login). The secret token in the link is the only
// credential; every check (plan, cutoff, range) happens here on the server.
import { refresh } from "next/cache";
import { db } from "@/server/db";
import { addDays, isISODate, isSkipLocked, todayIn, toDbDate, fromDbDate } from "@/lib/dates";
import { mealsOf } from "@/lib/schedule";

export type SkipResult = { ok: true } | { ok: false; error: "invalid" | "cutoff" | "plan" };

export async function portalSetSkip(token: string, date: string, meal: "lunch" | "dinner", skip: boolean): Promise<SkipResult> {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{20,64}$/.test(token) || !isISODate(date) || (meal !== "lunch" && meal !== "dinner")) {
    return { ok: false, error: "invalid" };
  }
  const c = await db.customer.findUnique({ where: { portalToken: token }, include: { plan: true, org: true } });
  if (!c) return { ok: false, error: "invalid" };
  if (!mealsOf(c.plan?.meals ?? null).includes(meal)) return { ok: false, error: "plan" };
  const tz = c.org.timezone;
  if (isSkipLocked(date, c.org.skipCutoffHour, tz)) return { ok: false, error: "cutoff" };
  if (date > addDays(todayIn(tz), 60) || date < fromDbDate(c.startDate)) return { ok: false, error: "invalid" };

  const key = { customerId_date_meal: { customerId: c.id, date: toDbDate(date), meal } };
  if (skip) {
    await db.skip.upsert({ where: key, create: { orgId: c.orgId, customerId: c.id, date: toDbDate(date), meal, byCustomer: true }, update: {} });
  } else {
    await db.skip.deleteMany({ where: { customerId: c.id, date: toDbDate(date), meal } });
  }
  refresh();
  return { ok: true };
}
