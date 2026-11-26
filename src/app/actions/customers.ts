"use server";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { db } from "@/server/db";
import { requireStaff } from "@/server/auth";
import { applyPayment } from "@/server/mutations";
import { isISODate, toDbDate, todayIn } from "@/lib/dates";
import { isUuid } from "@/lib/sync";
import { customerSchema, fieldError, parseForm, type FormState } from "@/lib/validation";

const str = (fd: FormData, k: string, max: number) => {
  const v = String(fd.get(k) ?? "").trim().slice(0, max);
  return v || null;
};

export async function saveCustomer(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireStaff();
  const id = String(fd.get("id") ?? "");
  if (id && !isUuid(id)) return { error: "invalidValue" };
  const parsed = parseForm(customerSchema, fd);
  if (!parsed.ok) return parsed.state;
  const { startDate, ...rest } = parsed.data;
  // The plan must belong to this mess (never trust an id from the form).
  if (rest.planId && (await db.plan.count({ where: { id: rest.planId, orgId: ctx.orgId } })) !== 1) {
    return fieldError("planId", "planInvalid", fd);
  }
  const data = { ...rest, startDate: toDbDate(startDate) };

  let customerId = id;
  if (id) {
    const { count } = await db.customer.updateMany({ where: { id, orgId: ctx.orgId }, data });
    if (count !== 1) return { error: "invalidValue" };
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
