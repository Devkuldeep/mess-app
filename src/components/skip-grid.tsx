"use client";
// Customer's 7-day tiffin grid. Optimistic toggle; server enforces cutoff.
import { useOptimistic, useState, useTransition } from "react";
import { portalSetSkip } from "@/app/actions/portal";
import type { Portal } from "@/server/data";

type Labels = Record<"lunch" | "dinner" | "portalSkip" | "portalComing" | "portalLocked" | "holiday" | "portalCutoffPassed", string>;
type Day = Portal["days"][number];

export function SkipGrid({ token, days, meals, dayLabels, labels }: { token: string; days: Day[]; meals: ("lunch" | "dinner")[]; dayLabels: string[]; labels: Labels }) {
  const [optimistic, apply] = useOptimistic(days, (state, u: { date: string; meal: "lunch" | "dinner"; skip: boolean }) =>
    state.map((d) => (d.date === u.date ? { ...d, [`${u.meal}Skipped`]: u.skip } : d)),
  );
  const [, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggle = (date: string, meal: "lunch" | "dinner", skip: boolean) =>
    start(async () => {
      setError(null);
      apply({ date, meal, skip });
      const r = await portalSetSkip(token, date, meal, skip);
      if (!r.ok) setError(r.error === "cutoff" ? labels.portalCutoffPassed : "Error");
    });

  return (
    <div className="space-y-2">
      {error && <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
      <ul className="card divide-y divide-line">
        {optimistic.map((d, i) => (
          <li key={d.date} className="flex min-h-16 items-center gap-2 px-3 py-2">
            <span className="w-24 shrink-0 text-sm font-medium">{dayLabels[i]}</span>
            {d.holiday !== null ? (
              <span className="flex-1 text-center text-sm text-warn">{labels.holiday}{d.holiday ? ` · ${d.holiday}` : ""}</span>
            ) : !d.active ? (
              <span className="flex-1 text-center text-sm text-muted">—</span>
            ) : (
              <div className="grid flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${meals.length}, minmax(0, 1fr))` }}>
                {meals.map((m) => {
                  const skipped = d[`${m}Skipped`];
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={d.locked}
                      aria-pressed={!skipped}
                      onClick={() => toggle(d.date, m, !skipped)}
                      className={`flex min-h-12 flex-col items-center justify-center rounded-xl border text-sm font-medium transition active:scale-95 disabled:active:scale-100 ${
                        skipped ? "border-line bg-surface text-muted line-through" : "border-ok/40 bg-ok-soft text-ok"
                      } ${d.locked ? "opacity-60" : ""}`}
                    >
                      <span>{labels[m]}</span>
                      <span className="text-xs no-underline">{d.locked ? `🔒 ${labels.portalLocked}` : skipped ? labels.portalSkip : labels.portalComing}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
