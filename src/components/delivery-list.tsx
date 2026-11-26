"use client";
// Delivery checklist. Taps are optimistic and go through the offline outbox,
// so a delivery boy with no signal can keep working; it syncs later.
import { useMemo } from "react";
import { enqueue, newId, usePendingOps } from "./outbox";
import { IconCheck, IconMap, IconPhone } from "./icons";
import type { DeliveryRow } from "@/server/data";
import { mapsLink } from "@/lib/links";
import type { DeliveryOp } from "@/lib/sync";

type Labels = Record<"delivered" | "pending" | "noArea" | "call" | "directions" | "allDone" | "noMeals" | "veg" | "nonveg" | "markDelivered", string>;

export function DeliveryList({ date, meal, rows, labels }: { date: string; meal: "lunch" | "dinner"; rows: DeliveryRow[]; labels: Labels }) {
  const pending = usePendingOps();

  // Server state + any not-yet-synced taps (last tap wins).
  const state = useMemo(() => {
    const m = new Map(rows.map((r) => [r.customerId, r.delivered]));
    for (const op of pending) {
      if (op.kind === "delivery" && op.date === date && op.meal === meal && m.has(op.customerId)) m.set(op.customerId, op.delivered);
    }
    return m;
  }, [rows, pending, date, meal]);

  const unsynced = useMemo(
    () => new Set(pending.filter((o): o is DeliveryOp => o.kind === "delivery" && o.date === date && o.meal === meal).map((o) => o.customerId)),
    [pending, date, meal],
  );

  if (rows.length === 0) return <p className="card p-6 text-center text-muted">{labels.noMeals}</p>;

  const done = [...state.values()].filter(Boolean).length;
  const groups = new Map<string, DeliveryRow[]>();
  for (const r of rows) {
    const k = r.area || labels.noArea;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }

  const toggle = (customerId: string) =>
    void enqueue({ opId: newId(), kind: "delivery", customerId, date, meal, delivered: !state.get(customerId) });

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-3xl font-bold tabular-nums">{done}<span className="text-lg text-muted">/{rows.length}</span></p>
          <p className="text-sm text-muted">{done === rows.length ? labels.allDone : `${labels.pending}: ${rows.length - done}`}</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-ok transition-all" style={{ width: `${(done / rows.length) * 100}%` }} />
        </div>
      </div>

      {[...groups].map(([area, list]) => (
        <section key={area} className="space-y-2">
          <h2 className="section-title">{area} · {list.filter((r) => state.get(r.customerId)).length}/{list.length}</h2>
          <ul className="card divide-y divide-line overflow-hidden">
            {list.map((r) => {
              const isDone = !!state.get(r.customerId);
              return (
                <li key={r.customerId} className={`flex items-center gap-1 py-1 pr-1 pl-2 ${isDone ? "bg-ok-soft/60" : ""}`}>
                  <button
                    type="button"
                    onClick={() => toggle(r.customerId)}
                    aria-pressed={isDone}
                    aria-label={`${labels.markDelivered}: ${r.name}`}
                    className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-xl px-2 text-left active:bg-line/60"
                  >
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition ${isDone ? "border-ok bg-ok text-card" : "border-line"}`}>
                      {isDone && <IconCheck className="size-5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`flex items-center gap-2 font-medium ${isDone ? "text-muted line-through" : ""}`}>
                        <span className={`size-2.5 shrink-0 rounded-sm ${r.diet === "veg" ? "bg-veg" : "bg-nonveg"}`} aria-label={labels[r.diet]} />
                        <span className="truncate">{r.name}</span>
                        {unsynced.has(r.customerId) && <span className="size-2 shrink-0 rounded-full bg-warn" aria-hidden />}
                      </span>
                      {r.address && <span className="block truncate text-sm text-muted">{r.address}</span>}
                      {r.notes && <span className="block truncate text-sm text-warn">{r.notes}</span>}
                    </span>
                  </button>
                  {r.address && (
                    <a href={mapsLink(r.address)} target="_blank" rel="noreferrer" className="icon-btn" aria-label={labels.directions}><IconMap /></a>
                  )}
                  {r.phone && (
                    <a href={`tel:${r.phone}`} className="icon-btn" aria-label={labels.call}><IconPhone /></a>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
