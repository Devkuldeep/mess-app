"use client";
// One choice from a few options. Prefer this over a select for 2–5 options:
// everything is visible and it's one tap.
//   variant "chips" → segmented pills (veg/non-veg, lunch/dinner)
//   variant "cards" → stacked cards with description + right-side meta (plans with price)
//   variant "list"  → rows inside one card (longer option lists)
import type { ReactNode } from "react";
import { useFieldState } from "./form-context";
import { describedBy, FormField, useFieldIds, type FieldBaseProps } from "./form-field";

export type RadioOption = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  /** Right side in "cards"/"list" (e.g. "₹60 प्रति टिफ़िन"). */
  meta?: ReactNode;
  /** Small leading visual (e.g. veg/non-veg dot). */
  icon?: ReactNode;
  disabled?: boolean;
};

export type FormRadioGroupProps = FieldBaseProps & {
  name: string;
  options: RadioOption[];
  id?: string;
  defaultValue?: string;
  /** Controlled mode. */
  value?: string;
  onChange?: (value: string) => void;
  variant?: "chips" | "cards" | "list";
  /** Chips only: number of equal columns (default = number of options, max 4). */
  columns?: number;
  disabled?: boolean;
};

export function FormRadioGroup({
  label, hint, error, required, className, name, options, id, defaultValue, value, onChange, variant = "chips", columns, disabled,
}: FormRadioGroupProps) {
  const ids = useFieldIds(id);
  const fs = useFieldState(name);
  const err = error ?? fs.error;
  const initial = fs.value ?? defaultValue;
  const controlled = value !== undefined;
  const common = (o: RadioOption, i: number) => ({
    type: "radio" as const,
    name,
    value: o.value,
    required: required && i === 0 ? true : undefined,
    disabled: disabled || o.disabled,
    ...(controlled ? { checked: value === o.value, onChange: () => onChange?.(o.value) } : { defaultChecked: initial === o.value, onChange: () => onChange?.(o.value) }),
  });
  const cols = Math.min(columns ?? options.length, 4);

  return (
    <FormField as="fieldset" label={label} hint={hint} error={err} required={required} className={className} ids={ids}>
      <div aria-describedby={describedBy(ids, hint, err)}>
        {variant === "chips" && (
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {options.map((o, i) => (
              <label
                key={o.value}
                className={`chip min-h-12 cursor-pointer justify-center px-2 text-center has-checked:border-brand has-checked:bg-brand-soft has-checked:text-brand-ink has-disabled:opacity-40 ${err ? "border-bad" : ""}`}
              >
                <input {...common(o, i)} className="sr-only" />
                {o.icon}
                {o.label}
              </label>
            ))}
          </div>
        )}

        {variant === "cards" && (
          <div className="grid gap-2">
            {options.map((o, i) => (
              <label
                key={o.value}
                className={`card flex min-h-14 cursor-pointer items-center gap-3 px-4 py-3 has-checked:border-brand has-checked:bg-brand-soft has-disabled:opacity-40 ${err ? "border-bad" : ""}`}
              >
                <input {...common(o, i)} className="size-5 shrink-0 accent-brand" />
                {o.icon}
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{o.label}</span>
                  {o.description && <span className="block text-sm text-muted">{o.description}</span>}
                </span>
                {o.meta && <span className="shrink-0 text-sm text-muted">{o.meta}</span>}
              </label>
            ))}
          </div>
        )}

        {variant === "list" && (
          <div className={`card divide-y divide-line overflow-hidden ${err ? "border-bad" : ""}`}>
            {options.map((o, i) => (
              <label key={o.value} className="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2 has-checked:bg-brand-soft has-disabled:opacity-40">
                {o.icon}
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{o.label}</span>
                  {o.description && <span className="block text-sm text-muted">{o.description}</span>}
                </span>
                {o.meta && <span className="shrink-0 text-sm text-muted">{o.meta}</span>}
                <input {...common(o, i)} className="size-5 shrink-0 accent-brand" />
              </label>
            ))}
          </div>
        )}
      </div>
    </FormField>
  );
}
