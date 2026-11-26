// Offline outbox operations — shared by the browser (src/components/outbox.ts)
// and the server (/api/sync). Every op is idempotent so replaying it is safe.
import { isISODate, type ISODate } from "./dates.ts";

export type DeliveryOp = {
  opId: string;
  kind: "delivery";
  customerId: string;
  date: ISODate;
  meal: "lunch" | "dinner";
  delivered: boolean;
  at: number; // device timestamp (ms) of the tap
};

export type PaymentOp = {
  opId: string;
  kind: "payment";
  paymentId: string; // generated on device → stored once even if replayed
  customerId: string;
  amount: number;
  paidOn: ISODate;
  method: "upi" | "cash" | "other";
  note?: string;
};

export type WastageOp = {
  opId: string;
  kind: "wastage";
  date: ISODate;
  meal: "lunch" | "dinner";
  reason: "none" | "late_skip" | "not_taken" | "disliked" | "overcooked" | "other";
  note?: string;
  /** Full replacement of that meal's record (last write wins). */
  items: { dishId: string; label?: string; cooked: number; leftover: number }[];
};

export type SyncOp = DeliveryOp | PaymentOp | WastageOp;

export type SyncResult = { opId: string; ok: true } | { opId: string; ok: false; error: string; retry: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

/** Validate an untrusted op from the network. Returns null if malformed. */
export function parseOp(v: unknown): SyncOp | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.opId !== "string" || o.opId.length > 64) return null;
  if (o.kind === "wastage") return parseWastage(o);
  if (!isUuid(o.customerId)) return null;
  if (o.kind === "delivery") {
    if (!isISODate(o.date) || (o.meal !== "lunch" && o.meal !== "dinner") || typeof o.delivered !== "boolean") return null;
    return { opId: o.opId, kind: "delivery", customerId: o.customerId, date: o.date, meal: o.meal, delivered: o.delivered, at: Number(o.at) || 0 };
  }
  if (o.kind === "payment") {
    const amount = Number(o.amount);
    if (!isUuid(o.paymentId) || !isISODate(o.paidOn) || !(amount > 0 && amount < 1e7)) return null;
    if (o.method !== "upi" && o.method !== "cash" && o.method !== "other") return null;
    const note = typeof o.note === "string" ? o.note.slice(0, 200) : undefined;
    return { opId: o.opId, kind: "payment", paymentId: o.paymentId, customerId: o.customerId, amount: Math.round(amount * 100) / 100, paidOn: o.paidOn, method: o.method, note };
  }
  return null;
}

const REASONS = new Set(["none", "late_skip", "not_taken", "disliked", "overcooked", "other"]);
const qty = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n < 100_000 ? Math.round(n * 1000) / 1000 : null;
};

function parseWastage(o: Record<string, unknown>): WastageOp | null {
  if (!isISODate(o.date) || (o.meal !== "lunch" && o.meal !== "dinner")) return null;
  if (typeof o.reason !== "string" || !REASONS.has(o.reason)) return null;
  if (!Array.isArray(o.items) || o.items.length === 0 || o.items.length > 30) return null;
  const items: WastageOp["items"] = [];
  const seen = new Set<string>();
  for (const raw of o.items as Record<string, unknown>[]) {
    if (!raw || !isUuid(raw.dishId) || seen.has(raw.dishId)) return null;
    const cooked = qty(raw.cooked);
    const leftover = qty(raw.leftover);
    if (cooked === null || leftover === null || leftover > cooked) return null;
    seen.add(raw.dishId);
    const label = typeof raw.label === "string" && raw.label.trim() ? raw.label.trim().slice(0, 40) : undefined;
    items.push({ dishId: raw.dishId, label, cooked, leftover });
  }
  const note = typeof o.note === "string" && o.note.trim() ? o.note.trim().slice(0, 200) : undefined;
  return { opId: o.opId as string, kind: "wastage", date: o.date, meal: o.meal, reason: o.reason as WastageOp["reason"], note, items };
}
