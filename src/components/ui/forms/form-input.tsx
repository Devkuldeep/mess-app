"use client";
// Text-like input with optional prefix/suffix inside the field (₹, kg, @okaxis…).
import type { InputHTMLAttributes, ReactNode } from "react";
import { useFieldState } from "./form-context";
import { describedBy, errorRing, FormField, useFieldIds, type FieldBaseProps } from "./form-field";

export type FormInputProps = FieldBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "prefix"> & {
    /** Shown inside the field on the left (e.g. "₹"). */
    prefix?: ReactNode;
    /** Shown inside the field on the right (e.g. "kg"). */
    suffix?: ReactNode;
    inputClassName?: string;
  };

export function FormInput({ label, hint, error, required, className, prefix, suffix, inputClassName = "", id, ...input }: FormInputProps) {
  const ids = useFieldIds(id);
  const fs = useFieldState(input.name);
  const err = error ?? fs.error;
  const dv = input.value === undefined ? (fs.value ?? input.defaultValue) : undefined;
  return (
    <FormField label={label} hint={hint} error={err} required={required} className={className} htmlFor={ids.id} ids={ids}>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">{prefix}</span>}
        <input
          id={ids.id}
          required={required}
          aria-invalid={err ? true : undefined}
          aria-describedby={describedBy(ids, hint, err)}
          className={`field ${prefix ? "pl-8" : ""} ${suffix ? "pr-14" : ""} ${err ? errorRing : ""} ${inputClassName}`}
          {...input}
          defaultValue={dv}
        />
        {suffix && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted">{suffix}</span>}
      </div>
    </FormField>
  );
}
