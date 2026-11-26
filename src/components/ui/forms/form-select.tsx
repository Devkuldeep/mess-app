"use client";
// Native <select> styled to match fields. Native is the best picker on phones
// (full-screen list, accessible, works offline) — don't swap it for a custom dropdown.
// For 2–4 choices prefer FormRadioGroup (chips): one tap instead of two.
import type { SelectHTMLAttributes } from "react";
import { useFieldState } from "./form-context";
import { describedBy, errorRing, FormField, useFieldIds, type FieldBaseProps } from "./form-field";

export type SelectOption = { value: string; label: string; disabled?: boolean };
export type SelectGroup = { label: string; options: SelectOption[] };

export type FormSelectProps = FieldBaseProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> & {
    options: (SelectOption | SelectGroup)[];
    /** Empty first option ("चुनें…"). With `required`, forces a real choice. */
    placeholder?: string;
  };

const isGroup = (o: SelectOption | SelectGroup): o is SelectGroup => "options" in o;

export function FormSelect({ label, hint, error, required, className, options, placeholder, id, defaultValue, ...select }: FormSelectProps) {
  const ids = useFieldIds(id);
  const fs = useFieldState(select.name);
  const err = error ?? fs.error;
  const initial = select.value !== undefined ? undefined : (fs.value ?? defaultValue ?? (placeholder ? "" : undefined));
  return (
    <FormField label={label} hint={hint} error={err} required={required} className={className} htmlFor={ids.id} ids={ids}>
      <div className="relative">
        <select
          id={ids.id}
          required={required}
          defaultValue={initial}
          aria-invalid={err ? true : undefined}
          aria-describedby={describedBy(ids, hint, err)}
          className={`field appearance-none pr-10 ${err ? errorRing : ""}`}
          {...select}
        >
          {placeholder && <option value="" disabled={required}>{placeholder}</option>}
          {options.map((o) =>
            isGroup(o) ? (
              <optgroup key={o.label} label={o.label}>
                {o.options.map((x) => <option key={x.value} value={x.value} disabled={x.disabled}>{x.label}</option>)}
              </optgroup>
            ) : (
              <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
            ),
          )}
        </select>
        <svg className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </FormField>
  );
}
