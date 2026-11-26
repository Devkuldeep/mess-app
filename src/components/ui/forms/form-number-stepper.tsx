"use client";
// Number with big −/+ buttons (quantities: tiffins, kg, roti count).
// Typing still works; the value is clamped to min/max on blur.
import { useState } from "react";
import { useFieldState } from "./form-context";
import { describedBy, errorRing, FormField, useFieldIds, type FieldBaseProps } from "./form-field";

export type FormNumberStepperProps = FieldBaseProps & {
  name: string;
  id?: string;
  defaultValue?: number | null;
  /** Controlled mode (string so "1." can be typed). */
  value?: string;
  onChange?: (value: string) => void;
  min?: number;
  max?: number;
  /** Amount −/+ change by. Default 1. */
  step?: number;
  /** Unit after the number ("किलो", "नग"). */
  unit?: string;
  /** Allow decimals (kg/litre). Default: decimals only if step isn't a whole number. */
  decimal?: boolean;
  disabled?: boolean;
  labels?: { decrease: string; increase: string };
};

const round = (n: number) => Math.round(n * 1000) / 1000;

export function FormNumberStepper({
  label, hint, error, required, className, name, id, defaultValue, value, onChange, min = 0, max, step = 1, unit,
  decimal = !Number.isInteger(step), disabled, labels = { decrease: "−", increase: "+" },
}: FormNumberStepperProps) {
  const ids = useFieldIds(id);
  const fs = useFieldState(name);
  const err = error ?? fs.error;
  const [inner, setInner] = useState(fs.value ?? (defaultValue != null ? String(defaultValue) : ""));
  const cur = value ?? inner;
  const set = (v: string) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };
  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min, n));
  const num = Number(cur) || 0;
  const bump = (dir: 1 | -1) => set(String(round(clamp(num + dir * step))));

  return (
    <FormField label={label} hint={hint} error={err} required={required} className={className} htmlFor={ids.id} ids={ids}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => bump(-1)}
          disabled={disabled || num <= min}
          aria-label={labels.decrease}
          className="icon-btn border border-line bg-surface text-2xl disabled:opacity-40"
        >
          −
        </button>
        <div className="relative flex-1">
          <input
            id={ids.id}
            name={name}
            type="text"
            inputMode={decimal ? "decimal" : "numeric"}
            value={cur}
            onChange={(e) => set(e.target.value.replace(decimal ? /[^\d.]/g : /\D/g, ""))}
            onBlur={() => cur !== "" && set(String(round(clamp(Number(cur) || 0))))}
            required={required}
            disabled={disabled}
            placeholder="0"
            aria-invalid={err ? true : undefined}
            aria-describedby={describedBy(ids, hint, err)}
            className={`field text-center text-xl font-semibold tabular-nums ${unit ? "pr-12" : ""} ${err ? errorRing : ""}`}
          />
          {unit && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted">{unit}</span>}
        </div>
        <button
          type="button"
          onClick={() => bump(1)}
          disabled={disabled || (max !== undefined && num >= max)}
          aria-label={labels.increase}
          className="icon-btn border border-line bg-surface text-2xl disabled:opacity-40"
        >
          +
        </button>
      </div>
    </FormField>
  );
}
