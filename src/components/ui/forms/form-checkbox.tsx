"use client";
// Checkbox with a big tap area and optional description.
// variant "card" draws a bordered card that highlights when checked.
// Submits "on" when checked (standard HTML); read with fd.get(name) === "on".
import type { InputHTMLAttributes, ReactNode } from "react";
import { FormField, useFieldIds } from "./form-field";
import { useFieldState } from "./form-context";

export type FormCheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
  label: ReactNode;
  description?: ReactNode;
  error?: string | null;
  variant?: "plain" | "card";
  className?: string;
};

export function FormCheckbox({ label, description, error, variant = "plain", className = "", id, required, ...input }: FormCheckboxProps) {
  const ids = useFieldIds(id);
  const fs = useFieldState(input.name);
  const err = error ?? fs.error;
  const defaultChecked = fs.value !== undefined ? fs.value === "on" : input.defaultChecked;
  const card = variant === "card";
  return (
    <FormField error={err} ids={ids} className={className}>
      <label
        htmlFor={ids.id}
        className={`flex min-h-12 cursor-pointer items-start gap-3 py-2 ${
          card ? "card px-4 has-checked:border-brand has-checked:bg-brand-soft" : ""
        } ${err ? "text-bad" : ""}`}
      >
        <input
          id={ids.id}
          type="checkbox"
          required={required}
          aria-invalid={err ? true : undefined}
          aria-describedby={[description ? ids.hintId : null, err ? ids.errorId : null].filter(Boolean).join(" ") || undefined}
          className="mt-0.5 size-5 shrink-0 accent-brand"
          {...input}
          {...(input.checked === undefined ? { defaultChecked } : {})}
        />
        <span className="min-w-0">
          <span className="block font-medium text-ink">
            {label}
            {required && <span className="ml-0.5 text-bad" aria-hidden>*</span>}
          </span>
          {description && <span id={ids.hintId} className="block text-sm text-muted">{description}</span>}
        </span>
      </label>
    </FormField>
  );
}
