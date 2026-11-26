"use client";
// Daily "kitna bana / kitna bacha" entry. Designed for ~30 seconds:
// cooked is prefilled (suggestion or last save), leftover is one tap.
// Saves through the offline outbox, so it works without internet.
import { useMemo, useState } from "react";
import Link from "next/link";
import { enqueue, newId, usePendingOps } from "./outbox";
import type { WastageOp } from "@/lib/sync";
import { LEFTOVER_STEPS, REASONS, type Reason, type Unit } from "@/lib/wastage";
import type { Dict } from "@/lib/i18n";

type Dish = { id: string; name: string; unit: Unit; variety: boolean };
type Initial = { reason: Reason; items: { dishId: string; label: string | null; cooked: number; leftover: number }[] } | null;
type Row = { cooked: string; leftover: string; step: number | null; label: string };

const STEP_LABEL = ["leftNone", "leftLittle", "leftQuarter", "leftHalf"] as const;
const fmtQty = (n: number, unit: Unit) => (unit === "count" ? String(Math.round(n)) : String(Math.round(n * 100) / 100));
const parse = (s: string) => (s.trim() === "" ? null : Number(s));

export function WastageForm({
  date, meal, dishes, suggested, initial, t,
}: {
  date: string;
  meal: "lunch" | "dinner";
  dishes: Dish[];
  suggested: Record<string, number>;
  initial: Initial;
  t: Pick<Dict, "cooked" | "leftover" | "leftNone" | "leftLittle" | "leftQuarter" | "leftHalf" | "exact" | "varietyPlaceholder" | "whyLeft" | "reason_late_skip" | "reason_not_taken" | "reason_disliked" | "reason_overcooked" | "reason_other" | "notCooked" | "chooseLeftover" | "save" | "saved" | "unit_kg" | "unit_litre" | "unit_count" | "wastageReport" | "pendingSync">;
}) {
  const pending = usePendingOps().filter((o): o is WastageOp => o.kind === "wastage" && o.date === date && o.meal === meal);
  const latest = pending.at(-1);
  // Prefill: unsynced save on this phone > saved entry > suggestion.
  const start = useMemo<Initial>(() => (latest ? { reason: latest.reason, items: latest.items.map((i) => ({ ...i, label: i.label ?? null })) } : initial), [latest, initial]);

  const [rows, setRows] = useState<Record<string, Row>>(() => initRows(dishes, start, suggested));
  const [reason, setReason] = useState<Reason>(start?.reason ?? "none");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const set = (id: string, patch: Partial<Row>) => {
    setSavedAt(null);
    setRows((r) => {
      const next = { ...r[id], ...patch };
      // Leftover chip follows changes to "cooked".
      if (patch.cooked !== undefined && next.step !== null) {
        const c = parse(next.cooked) ?? 0;
        next.leftover = fmtQty(c * LEFTOVER_STEPS[next.step], unitOf(id));
      }
      return { ...r, [id]: next };
    });
  };
  const unitOf = (id: string) => dishes.find((d) => d.id === id)!.unit;

  const made = dishes.filter((d) => (parse(rows[d.id].cooked) ?? 0) > 0);
  const missing = made.filter((d) => parse(rows[d.id].leftover) === null);
  const invalid = made.some((d) => (parse(rows[d.id].leftover) ?? 0) > (parse(rows[d.id].cooked) ?? 0) || Number.isNaN(parse(rows[d.id].cooked)));
  const anyLeft = made.some((d) => (parse(rows[d.id].leftover) ?? 0) > 0);
  const canSave = made.length > 0 && missing.length === 0 && !invalid;

  async function save() {
    if (!canSave) return;
    await enqueue({
      opId: newId(), kind: "wastage", date, meal, reason: anyLeft ? reason : "none",
      items: made.map((d) => ({
        dishId: d.id,
        label: d.variety ? rows[d.id].label.trim() || undefined : undefined,
        cooked: parse(rows[d.id].cooked)!,
        leftover: parse(rows[d.id].leftover)!,
      })),
    });
    setSavedAt(Date.now());
  }

  return (
    <div className="space-y-3">
      {dishes.map((d) => {
        const r = rows[d.id];
        const unit = t[`unit_${d.unit}`];
        const cooked = parse(r.cooked) ?? 0;
        const step = d.unit === "count" ? 10 : cooked >= 5 ? 0.5 : 0.1;
        return (
          <section key={d.id} className={`card space-y-3 p-4 ${cooked > 0 ? "" : "opacity-70"}`}>
            <div className="flex items-center gap-2">
              <h2 className="flex-1 text-lg font-semibold">{d.name}</h2>
              {cooked > 0 ? (
                <button type="button" onClick={() => set(d.id, { cooked: "", leftover: "", step: null })} className="chip min-h-9 text-muted">{t.notCooked}</button>
              ) : null}
            </div>
            {d.variety && cooked > 0 && (
              <input value={r.label} onChange={(e) => set(d.id, { label: e.target.value })} maxLength={40} placeholder={t.varietyPlaceholder} className="field" />
            )}
            <div className="flex items-center gap-2">
              <span className="w-12 text-sm text-muted">{t.cooked}</span>
              <button type="button" aria-label="−" onClick={() => set(d.id, { cooked: fmtQty(Math.max(0, cooked - step), d.unit) })} className="icon-btn border border-line bg-surface text-xl">−</button>
              <input
                value={r.cooked}
                onChange={(e) => set(d.id, { cooked: e.target.value.replace(/[^\d.]/g, "") })}
                inputMode="decimal"
                aria-label={`${d.name} ${t.cooked}`}
                className="field flex-1 text-center text-xl font-semibold tabular-nums"
                placeholder="0"
              />
              <button type="button" aria-label="+" onClick={() => set(d.id, { cooked: fmtQty(cooked + step, d.unit) })} className="icon-btn border border-line bg-surface text-xl">+</button>
              <span className="w-10 text-sm text-muted">{unit}</span>
            </div>
            {cooked > 0 && (
              <div className="space-y-2">
                <span className="text-sm text-muted">{t.leftover}</span>
                <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={`${d.name} ${t.leftover}`}>
                  {LEFTOVER_STEPS.map((f, i) => (
                    <button
                      key={f}
                      type="button"
                      role="radio"
                      aria-checked={r.step === i}
                      onClick={() => set(d.id, { step: i, leftover: fmtQty(cooked * f, d.unit) })}
                      className="chip justify-center px-1"
                    >
                      {t[STEP_LABEL[i]]}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2">
                  <span className="text-sm text-muted">{t.exact}</span>
                  <input
                    value={r.leftover}
                    onChange={(e) => set(d.id, { leftover: e.target.value.replace(/[^\d.]/g, ""), step: null })}
                    inputMode="decimal"
                    className={`field w-28 tabular-nums ${(parse(r.leftover) ?? 0) > cooked ? "border-bad" : ""}`}
                    placeholder="—"
                  />
                  <span className="text-sm text-muted">{unit}</span>
                </label>
              </div>
            )}
          </section>
        );
      })}

      {anyLeft && (
        <section className="card space-y-2 p-4">
          <h2 className="font-semibold">{t.whyLeft}</h2>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.whyLeft}>
            {REASONS.map((x) => (
              <button key={x} type="button" role="radio" aria-checked={reason === x} onClick={() => { setReason(reason === x ? "none" : x); setSavedAt(null); }} className="chip">
                {t[`reason_${x}`]}
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] space-y-2 bg-surface/95 pt-2 pb-1 backdrop-blur">
        {!canSave && made.length > 0 && missing.length > 0 && <p className="text-center text-sm text-warn">{t.chooseLeftover}</p>}
        <button type="button" onClick={save} disabled={!canSave} className="btn-primary w-full">
          {savedAt ? `✓ ${t.saved}` : t.save}
        </button>
        {savedAt && (
          <Link href="/wastage/report" className="btn-ghost w-full">{t.wastageReport} →</Link>
        )}
        {pending.length > 0 && <p className="text-center text-sm text-warn">{t.pendingSync.replace("{n}", String(pending.length))}</p>}
      </div>
    </div>
  );
}

function initRows(dishes: Dish[], start: Initial, suggested: Record<string, number>): Record<string, Row> {
  const saved = new Map(start?.items.map((i) => [i.dishId, i]));
  return Object.fromEntries(
    dishes.map((d) => {
      const s = saved.get(d.id);
      if (s) return [d.id, { cooked: fmtQty(s.cooked, d.unit), leftover: fmtQty(s.leftover, d.unit), step: null, label: s.label ?? "" }];
      if (start) return [d.id, { cooked: "", leftover: "", step: null, label: "" }]; // saved entry without this dish = not made
      const sug = suggested[d.id] ?? 0;
      return [d.id, { cooked: sug > 0 ? fmtQty(sug, d.unit) : "", leftover: "", step: null, label: "" }];
    }),
  );
}
