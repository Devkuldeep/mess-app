"use client";
// From–to dates with one-tap presets (आज, पिछले 7 दिन, इस महीने…).
// Submits two fields: `${name}From` and `${name}To` (or fromName / toName).
// "To" can never be before "From" — it is clamped as the user picks.
import { useState } from "react";
import { addDays, addMonths, diffDays, monthEnd, monthStart, type ISODate } from "@/lib/dates";
import { useFieldState } from "./form-context";
import { describedBy, errorRing, FormField, useFieldIds, type FieldBaseProps } from "./form-field";

export type DateRange = { from: ISODate; to: ISODate };
export type RangePreset = { label: string; range: DateRange };

/** Common presets relative to the org-local `today`. Pass translated labels. */
export function rangePresets(today: ISODate, labels: { today: string; last7: string; thisMonth: string; lastMonth: string }): RangePreset[] {
  const lastMonth = addMonths(today, -1);
  return [
    { label: labels.today, range: { from: today, to: today } },
    { label: labels.last7, range: { from: addDays(today, -6), to: today } },
    { label: labels.thisMonth, range: { from: monthStart(today), to: today } },
    { label: labels.lastMonth, range: { from: monthStart(lastMonth), to: monthEnd(lastMonth) } },
  ];
}

export type FormDateRangePickerProps = FieldBaseProps & {
  /** Field name prefix → submits `${name}From` and `${name}To`. */
  name: string;
  fromName?: string;
  toName?: string;
  id?: string;
  defaultValue?: Partial<DateRange>;
  /** Controlled mode. */
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  min?: ISODate;
  max?: ISODate;
  presets?: RangePreset[];
  /** Labels for the two inputs and the day count (translated by the caller). */
  labels?: { from: string; to: string; days?: string /** e.g. "{n} दिन" */ };
  disabled?: boolean;
};

export function FormDateRangePicker({
  label, hint, error, required, className, name, fromName, toName, id, defaultValue, value, onChange, min, max, presets = [],
  labels = { from: "From", to: "To", days: "{n} days" }, disabled,
}: FormDateRangePickerProps) {
  const ids = useFieldIds(id);
  const fromField = useFieldState(fromName ?? `${name}From`);
  const toField = useFieldState(toName ?? `${name}To`);
  const err = error ?? fromField.error ?? toField.error;
  const [inner, setInner] = useState<DateRange>({ from: fromField.value ?? defaultValue?.from ?? "", to: toField.value ?? defaultValue?.to ?? "" });
  const cur = value ?? inner;
  const set = (r: DateRange) => {
    // keep the range valid: "to" never before "from"
    const fixed = r.from && r.to && r.to < r.from ? { from: r.from, to: r.from } : r;
    if (value === undefined) setInner(fixed);
    onChange?.(fixed);
  };
  const days = cur.from && cur.to ? diffDays(cur.to, cur.from) + 1 : null;
  const active = (p: RangePreset) => p.range.from === cur.from && p.range.to === cur.to;
  const ring = err ? errorRing : "";

  return (
    <FormField as="fieldset" label={label} hint={hint} error={err} required={required} className={className} ids={ids}>
      {presets.length > 0 && (
        <div className="-mx-1 mb-2 flex gap-2 overflow-x-auto px-1 pb-1">
          {presets.map((p) => (
            <button key={p.label} type="button" disabled={disabled} aria-pressed={active(p)} onClick={() => set(p.range)} className="chip shrink-0">
              {p.label}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <label className="min-w-0">
          <span className="mb-1 block text-xs font-medium text-muted">{labels.from}</span>
          <input
            id={`${ids.id}-from`}
            type="date"
            name={fromName ?? `${name}From`}
            value={cur.from}
            min={min}
            max={max}
            required={required}
            disabled={disabled}
            onChange={(e) => set({ ...cur, from: e.target.value })}
            aria-invalid={err ? true : undefined}
            aria-describedby={describedBy(ids, hint, err)}
            className={`field px-2 ${ring}`}
          />
        </label>
        <label className="min-w-0">
          <span className="mb-1 block text-xs font-medium text-muted">{labels.to}</span>
          <input
            id={`${ids.id}-to`}
            type="date"
            name={toName ?? `${name}To`}
            value={cur.to}
            min={cur.from || min}
            max={max}
            required={required}
            disabled={disabled}
            onChange={(e) => set({ ...cur, to: e.target.value })}
            aria-invalid={err ? true : undefined}
            aria-describedby={describedBy(ids, hint, err)}
            className={`field px-2 ${ring}`}
          />
        </label>
      </div>
      {days !== null && labels.days && (
        <p className="mt-1 text-sm text-muted tabular-nums" aria-live="polite">{labels.days.replace("{n}", String(days))}</p>
      )}
    </FormField>
  );
}
