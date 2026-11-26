"use server";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { db } from "@/server/db";
import { requireStaff } from "@/server/auth";
import { applyPayment } from "@/server/mutations";
import { isISODate, toDbDate, todayIn } from "@/lib/dates";
import { normalizePhone } from "@/lib/links";
import { isUuid } from "@/lib/sync";
import type { FormState } from "./auth";

const str = (fd: FormData, k: string, max: number) => {
  const v = String(fd.get(k) ?? "").trim().slice(0, max);
  return v || null;
};

export async function saveCustomer(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireStaff();
  const id = String(fd.get("id") ?? "");
  const name = str(fd, "name", 80);
  if (!name) return { error: "name" };
  const rawPhone = str(fd, "phone", 20);
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  if (rawPhone && !phone) return { error: "invalidPhone" };
  const planId = String(fd.get("planId") ?? "");
  if (planId && !(isUuid(planId) && (await db.plan.count({ where: { id: planId, orgId: ctx.orgId } })) === 1)) {
    return { error: "plan" };
  }
  const start = String(fd.get("startDate") ?? "");
  const data = {
    name,
    phone,
    address: str(fd, "address", 300),
    area: str(fd, "area", 60),
    notes: str(fd, "notes", 300),
    diet: fd.get("diet") === "nonveg" ? ("nonveg" as const) : ("veg" as const),
    planId: planId || null,
    startDate: toDbDate(isISODate(start) ? start : todayIn(ctx.org.timezone)),
  };

  let customerId = id;
  if (id) {
    const { count } = await db.customer.updateMany({ where: { id, orgId: ctx.orgId }, data });
    if (count !== 1) return { error: "name" };
  } else {
    const c = await db.customer.create({
      data: { ...data, orgId: ctx.orgId, portalToken: randomBytes(18).toString("base64url") },
    });
    customerId = c.id;
  }
  redirect(`/customers/${customerId}`);
}

/** Stop service from a date (default today) or resume (clear end date). */
export async function setCustomerEnd(fd: FormData) {
  const ctx = await requireStaff();
  const id = String(fd.get("id") ?? "");
  const end = String(fd.get("endDate") ?? "");
  if (!isUuid(id)) return;
  await db.customer.updateMany({
    where: { id, orgId: ctx.orgId },
    data: { endDate: end === "" ? null : toDbDate(isISODate(end) ? end : todayIn(ctx.org.timezone)) },
  });
  refresh();
}

/** Online payment form path (the offline path goes through /api/sync). */
export async function recordPayment(fd: FormData) {
  const ctx = await requireStaff();
  const amount = Number(fd.get("amount"));
  const customerId = String(fd.get("customerId") ?? "");
  const paymentId = String(fd.get("paymentId") ?? "");
  const paidOn = String(fd.get("paidOn") ?? "");
  const method = fd.get("method");
  if (!isUuid(customerId) || !isUuid(paymentId) || !(amount > 0)) return;
  await applyPayment(ctx, {
    paymentId, customerId, amount: Math.round(amount * 100) / 100,
    paidOn: isISODate(paidOn) ? paidOn : todayIn(ctx.org.timezone),
    method: method === "cash" || method === "other" ? method : "upi",
    note: str(fd, "note", 200) ?? undefined,
  });
  refresh();
}

export async function deletePayment(fd: FormData) {
  const ctx = await requireStaff();
  const id = String(fd.get("id") ?? "");
  if (!isUuid(id)) return;
  await db.payment.deleteMany({ where: { id, orgId: ctx.orgId } });
  refresh();
}
