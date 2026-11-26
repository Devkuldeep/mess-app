"use client";
// Single date. Uses the phone's own date picker (<input type="date">) plus
// optional one-tap shortcuts ("आज", "कल").
// Value is always "YYYY-MM-DD" (CLAUDE.md rule 2). Pass `today` from the server
// (todayIn(org.timezone)) — never compute "today" in the browser.
// File name kept as created; import it as FormDatePicker from "@/components/ui/forms".
import { useState } from "react";
import { addDays, type ISODate } from "@/lib/dates";
import { formatDate, type Lang } from "@/lib/i18n";
import { useFieldState } from "./form-context";
import { describedBy, errorRing, FormField, useFieldIds, type FieldBaseProps } from "./form-field";

export type DateShortcut = { label: string; /** days from `today` (0 = today, 1 = tomorrow, -1 = yesterday) */ days: number };

export type FormDatePickerProps = FieldBaseProps & {
  name: string;
  id?: string;
  defaultValue?: ISODate;
  /** Controlled mode: pass value + onChange. */
  value?: ISODate;
  onChange?: (value: ISODate) => void;
  min?: ISODate;
  max?: ISODate;
  /** Org-local today; needed for shortcuts. */
  today?: ISODate;
  shortcuts?: DateShortcut[];
  /** Show the chosen date in words under the field ("गुरुवार, 26 नवंबर"). */
  lang?: Lang;
  disabled?: boolean;
};

export function FormDatePicker({
  label, hint, error, required, className, name, id, defaultValue, value, onChange, min, max, today, shortcuts = [], lang, disabled,
}: FormDatePickerProps) {
  const ids = useFieldIds(id);
  const fs = useFieldState(name);
  const err = error ?? fs.error;
  const [inner, setInner] = useState<ISODate>(fs.value ?? defaultValue ?? "");
  const current = value ?? inner;
  const set = (v: ISODate) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };
  const inRange = (d: ISODate) => (!min || d >= min) && (!max || d <= max);

  return (
    <FormField label={label} hint={hint} error={err} required={required} className={className} htmlFor={ids.id} ids={ids}>
      {today && shortcuts.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2" role="group" aria-label={typeof label === "string" ? label : undefined}>
          {shortcuts.map((s) => {
            const d = addDays(today, s.days);
            return (
              <button
                key={s.label}
                type="button"
                disabled={disabled || !inRange(d)}
                aria-pressed={current === d}
                onClick={() => set(d)}
                className="chip disabled:opacity-40"
              >
                {s.label}
              </button>
            );
          })}
        </div>
      )}
      <div className="relative">
        <input
          id={ids.id}
          type="date"
          name={name}
          value={current}
          onChange={(e) => set(e.target.value)}
          min={min}
          max={max}
          required={required}
          disabled={disabled}
          aria-invalid={err ? true : undefined}
          aria-describedby={describedBy(ids, hint, err)}
          className={`field ${err ? errorRing : ""}`}
        />
      </div>
      {lang && current && (
        <p className="mt-1 text-sm font-medium text-brand-ink" aria-live="polite">
          {formatDate(current, lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}
    </FormField>
  );
}
