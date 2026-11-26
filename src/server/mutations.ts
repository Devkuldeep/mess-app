// Idempotent writes used by both Server Actions and the offline sync endpoint.
import "server-only";
import { db } from "./db";
import type { OrgCtx } from "./auth";
import { toDbDate, todayIn } from "@/lib/dates";
import type { DeliveryOp, PaymentOp, SyncOp, SyncResult, WastageOp } from "@/lib/sync";
import { getDayCount } from "./data";

async function customerInOrg(orgId: string, customerId: string) {
  return (await db.customer.count({ where: { id: customerId, orgId } })) === 1;
}

export async function applyDelivery(ctx: OrgCtx, op: Omit<DeliveryOp, "opId" | "kind" | "at">) {
  if (!(await customerInOrg(ctx.orgId, op.customerId))) throw new Error("not found");
  const key = { customerId_date_meal: { customerId: op.customerId, date: toDbDate(op.date), meal: op.meal } };
  if (op.delivered) {
    await db.delivery.upsert({
      where: key,
      create: { orgId: ctx.orgId, customerId: op.customerId, date: toDbDate(op.date), meal: op.meal, deliveredBy: ctx.user.id },
      update: {},
    });
  } else {
    await db.delivery.deleteMany({ where: { orgId: ctx.orgId, customerId: op.customerId, date: toDbDate(op.date), meal: op.meal } });
  }
}

export async function applyPayment(ctx: OrgCtx, op: Omit<PaymentOp, "opId" | "kind">) {
  if (ctx.role === "delivery") throw new Error("forbidden");
  if (!(await customerInOrg(ctx.orgId, op.customerId))) throw new Error("not found");
  await db.payment.createMany({
    data: [{
      id: op.paymentId, orgId: ctx.orgId, customerId: op.customerId, amount: op.amount,
      paidOn: toDbDate(op.paidOn), method: op.method, note: op.note || null, createdBy: ctx.user.id,
    }],
    skipDuplicates: true, // replayed op → no second payment
  });
}

/**
 * Save one meal's wastage record. Replaces any earlier record for the same
 * org + date + meal (last write wins), so replays and edits are idempotent.
 * Tiffin count and dish costs are snapshotted at save time.
 */
export async function applyWastage(ctx: OrgCtx, op: Omit<WastageOp, "opId" | "kind">) {
  if (ctx.role === "delivery") throw new Error("forbidden");
  if (op.date > todayIn(ctx.org.timezone)) throw new Error("invalid"); // can't log leftovers in advance
  const ids = op.items.map((i) => i.dishId);
  const dishes = await db.dish.findMany({ where: { orgId: ctx.orgId, id: { in: ids } }, select: { id: true, costPerUnit: true } });
  if (dishes.length !== ids.length) throw new Error("not found");
  const cost = new Map(dishes.map((d) => [d.id, d.costPerUnit]));
  const tiffins = (await getDayCount(ctx, op.date)).counts[op.meal].total;
  const date = toDbDate(op.date);

  await db.$transaction(async (tx) => {
    const entry = await tx.wastageEntry.upsert({
      where: { orgId_date_meal: { orgId: ctx.orgId, date, meal: op.meal } },
      create: { orgId: ctx.orgId, date, meal: op.meal, tiffins, reason: op.reason, note: op.note ?? null, createdBy: ctx.user.id },
      update: { tiffins, reason: op.reason, note: op.note ?? null },
    });
    await tx.wastageItem.deleteMany({ where: { orgId: ctx.orgId, entryId: entry.id } });
    await tx.wastageItem.createMany({
      data: op.items.map((i) => ({
        orgId: ctx.orgId, entryId: entry.id, dishId: i.dishId, label: i.label ?? null,
        cooked: i.cooked, leftover: i.leftover, costPerUnit: cost.get(i.dishId) ?? null,
      })),
    });
  });
}

export async function applyOps(ctx: OrgCtx, ops: SyncOp[]): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  for (const op of ops) {
    try {
      if (op.kind === "delivery") await applyDelivery(ctx, op);
      else if (op.kind === "payment") await applyPayment(ctx, op);
      else await applyWastage(ctx, op);
      results.push({ opId: op.opId, ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error";
      // not found / forbidden will never succeed → drop; anything else → retry later
      results.push({ opId: op.opId, ok: false, error: msg, retry: !["not found", "forbidden", "invalid"].includes(msg) });
    }
  }
  return results;
}
