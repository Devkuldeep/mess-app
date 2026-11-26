"use client";
// Search box with a magnifier and a clear (×) button. No label by default —
// pass `label` to show one; `aria-label` falls back to the placeholder.
import { useState, type InputHTMLAttributes } from "react";
import { describedBy, FormField, useFieldIds, type FieldBaseProps } from "./form-field";

export type FormSearchInputProps = FieldBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type" | "value" | "defaultValue" | "onChange"> & {
    defaultValue?: string;
    /** Controlled mode. */
    value?: string;
    onChange?: (value: string) => void;
    clearLabel?: string;
  };

export function FormSearchInput({
  label, hint, error, className, id, defaultValue = "", value, onChange, placeholder, clearLabel = "Clear", ...input
}: FormSearchInputProps) {
  const ids = useFieldIds(id);
  const [inner, setInner] = useState(defaultValue);
  const cur = value ?? inner;
  const set = (v: string) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };
  return (
    <FormField label={label} hint={hint} error={error} className={className} htmlFor={ids.id} ids={ids}>
      <div className="relative">
        <svg className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
        <input
          id={ids.id}
          type="search"
          enterKeyHint="search"
          value={cur}
          onChange={(e) => set(e.target.value)}
          placeholder={placeholder}
          aria-label={label ? undefined : placeholder}
          aria-describedby={describedBy(ids, hint, error)}
          className="field pr-12 pl-10 [&::-webkit-search-cancel-button]:hidden"
          {...input}
        />
        {cur && (
          <button type="button" onClick={() => set("")} aria-label={clearLabel} className="icon-btn absolute top-0 right-0 text-xl">
            ×
          </button>
        )}
      </div>
    </FormField>
  );
}
