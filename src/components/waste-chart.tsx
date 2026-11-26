"use client";
// Daily waste % bars (single series, one hue) with a target line.
// Tap/hover a bar for its value; a table view sits under the chart.
import { useState } from "react";

type Day = { date: string; label: string; pct: number | null; loss: number };

export function WasteChart({ days, targetPct, labels }: { days: Day[]; targetPct: number; labels: { target: string; wasted: string; loss: string; noEntry: string; table: string } }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(targetPct / 100 * 1.5, ...days.map((d) => d.pct ?? 0), 0.05);
  const worst = days.reduce((w, d, i) => ((d.pct ?? -1) > (days[w]?.pct ?? -1) ? i : w), 0);
  const shown = active ?? worst;
  const sel = days[shown];
  const dense = days.length > 14;

  return (
    <div className="space-y-2">
      <p className="h-6 text-sm text-muted" aria-live="polite">
        {sel && (
          <>
            <b className="text-ink">{sel.label}</b> · {sel.pct === null ? labels.noEntry : `${labels.wasted} ${Math.round(sel.pct * 100)}% · ${labels.loss} ₹${sel.loss}`}
          </>
        )}
      </p>
      <div className="relative h-36" onMouseLeave={() => setActive(null)}>
        {/* target line */}
        <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted/60" style={{ bottom: `${(targetPct / 100 / max) * 100}%` }}>
          <span className="absolute -top-5 right-0 rounded bg-card px-1 text-xs text-muted">{labels.target} {targetPct}%</span>
        </div>
        <div className={`flex h-full items-end ${dense ? "gap-[2px]" : "gap-1"}`}>
          {days.map((d, i) => (
            <button
              key={d.date}
              type="button"
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              aria-label={`${d.label}: ${d.pct === null ? labels.noEntry : `${Math.round(d.pct * 100)}%`}`}
              className="group flex h-full flex-1 items-end justify-center"
            >
              {d.pct === null ? (
                <span className="mb-0 h-1 w-full rounded-sm bg-line" />
              ) : (
                <span
                  className={`w-full rounded-t-[4px] transition ${i === shown ? "bg-brand" : "bg-brand/55 group-hover:bg-brand/80"}`}
                  style={{ height: `${Math.max(2, (d.pct / max) * 100)}%` }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span>{days[0]?.label}</span>
        <span>{days.at(-1)?.label}</span>
      </div>
      <details className="text-sm">
        <summary className="min-h-10 cursor-pointer py-2 text-muted">{labels.table}</summary>
        <table className="w-full tabular-nums">
          <tbody className="divide-y divide-line">
            {days.map((d) => (
              <tr key={d.date}>
                <td className="py-1.5">{d.label}</td>
                <td className="py-1.5 text-right">{d.pct === null ? "—" : `${Math.round(d.pct * 100)}%`}</td>
                <td className="py-1.5 text-right text-muted">{d.pct === null ? "" : `₹${d.loss}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
