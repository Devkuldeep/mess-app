"use client";
// Record a payment. Saved to the offline outbox first (works without
// internet); the device-generated paymentId makes replays idempotent.
import { useState } from "react";
import { enqueue, newId, usePendingOps } from "./outbox";
import type { PaymentOp } from "@/lib/sync";

type Labels = Record<"recordPayment" | "amount" | "method" | "upi" | "cash" | "other" | "save" | "saved" | "pendingSync", string>;

export function PaymentForm({ customerId, today, suggested, labels }: { customerId: string; today: string; suggested: number; labels: Labels }) {
  const [amount, setAmount] = useState(suggested > 0 ? String(suggested) : "");
  const [method, setMethod] = useState<PaymentOp["method"]>("upi");
  const [paidOn, setPaidOn] = useState(today);
  const [flash, setFlash] = useState(false);
  const queued = usePendingOps().filter((o): o is PaymentOp => o.kind === "payment" && o.customerId === customerId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Math.round(Number(amount) * 100) / 100;
    if (!(n > 0)) return;
    await enqueue({ opId: newId(), kind: "payment", paymentId: newId(), customerId, amount: n, paidOn, method });
    setAmount("");
    setFlash(true);
    setTimeout(() => setFlash(false), 2000);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <h2 className="font-semibold">{labels.recordPayment}</h2>
      <div className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">{labels.amount}</span>
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-lg text-muted">₹</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            placeholder="0"
            required
            className="field pl-8 text-xl font-semibold tabular-nums"
          />
        </label>
        <input type="date" value={paidOn} max={today} onChange={(e) => setPaidOn(e.target.value)} aria-label="Date" className="field w-40" />
      </div>
      <div className="flex gap-2" role="radiogroup" aria-label={labels.method}>
        {(["upi", "cash", "other"] as const).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={method === m} onClick={() => setMethod(m)} className="chip flex-1 justify-center">
            {labels[m]}
          </button>
        ))}
      </div>
      <button type="submit" className="btn-primary w-full">{flash ? `✓ ${labels.saved}` : labels.save}</button>
      {queued.length > 0 && (
        <p className="text-sm text-warn" role="status">
          {labels.pendingSync.replace("{n}", String(queued.length))}: {queued.map((q) => `₹${q.amount}`).join(", ")}
        </p>
      )}
    </form>
  );
}
