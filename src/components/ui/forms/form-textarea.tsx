"use client";
// Multi-line text with an optional live character counter.
import { useState, type TextareaHTMLAttributes } from "react";
import { useFieldState } from "./form-context";
import { describedBy, errorRing, FormField, useFieldIds, type FieldBaseProps } from "./form-field";

export type FormTextareaProps = FieldBaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & {
    /** Show "12/300" under the box when maxLength is set. Default true. */
    showCount?: boolean;
  };

export function FormTextarea({
  label, hint, error, required, className, showCount = true, id, rows = 3, maxLength, defaultValue, value, onChange, ...rest
}: FormTextareaProps) {
  const ids = useFieldIds(id);
  const fs = useFieldState(rest.name);
  const err = error ?? fs.error;
  const dv = value === undefined ? (fs.value ?? defaultValue) : undefined;
  const [len, setLen] = useState(String(value ?? dv ?? "").length);
  return (
    <FormField label={label} hint={hint} error={err} required={required} className={className} htmlFor={ids.id} ids={ids}>
      <textarea
        id={ids.id}
        rows={rows}
        maxLength={maxLength}
        required={required}
        defaultValue={dv}
        value={value}
        onChange={(e) => {
          setLen(e.target.value.length);
          onChange?.(e);
        }}
        aria-invalid={err ? true : undefined}
        aria-describedby={describedBy(ids, hint, err)}
        className={`field py-3 leading-relaxed ${err ? errorRing : ""}`}
        {...rest}
      />
      {showCount && maxLength ? (
        <p className={`mt-1 text-right text-xs tabular-nums ${len >= maxLength ? "text-bad" : "text-muted"}`} aria-hidden>
          {len}/{maxLength}
        </p>
      ) : null}
    </FormField>
  );
}
