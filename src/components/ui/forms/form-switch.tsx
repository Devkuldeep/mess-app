"use client";
// On/off switch (settings rows). It's a real checkbox with role="switch",
// so it submits "on" when on — read with fd.get(name) === "on".
import type { InputHTMLAttributes, ReactNode } from "react";
import { FormField, useFieldIds } from "./form-field";
import { useFieldState } from "./form-context";

export type FormSwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className" | "role"> & {
  label: ReactNode;
  description?: ReactNode;
  error?: string | null;
  className?: string;
};

export function FormSwitch({ label, description, error, className = "", id, ...input }: FormSwitchProps) {
  const ids = useFieldIds(id);
  const fs = useFieldState(input.name);
  const err = error ?? fs.error;
  const defaultChecked = fs.value !== undefined ? fs.value === "on" : input.defaultChecked;
  return (
    <FormField error={err} ids={ids} className={className}>
      <label htmlFor={ids.id} className="flex min-h-14 cursor-pointer items-center gap-3 py-2">
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{label}</span>
          {description && <span id={ids.hintId} className="block text-sm text-muted">{description}</span>}
        </span>
        <span className="relative inline-flex shrink-0">
          <input
            id={ids.id}
            type="checkbox"
            role="switch"
            aria-describedby={description ? ids.hintId : undefined}
            className="peer sr-only"
            {...input}
            {...(input.checked === undefined ? { defaultChecked } : {})}
          />
          {/* track */}
          <span
            aria-hidden
            className="h-8 w-14 rounded-full bg-line transition peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 peer-disabled:opacity-50"
          />
          {/* thumb */}
          <span
            aria-hidden
            className="pointer-events-none absolute top-1 left-1 size-6 rounded-full bg-card shadow transition peer-checked:translate-x-6"
          />
        </span>
      </label>
    </FormField>
  );
}
