"use client";
// Money in ₹: decimal keypad, max 2 decimals, big tabular digits, optional
// one-tap amounts ("पूरा बाकी ₹2,720", ₹500, ₹1000…). Submits a plain number string.
import { useState, type InputHTMLAttributes } from "react";
import { formatMoney } from "@/lib/i18n";
import { useFieldState } from "./form-context";
import { describedBy, errorRing, FormField, useFieldIds, type FieldBaseProps } from "./form-field";

export type AmountShortcut = { label?: string; amount: number };

export type FormAmountInputProps = FieldBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type" | "value" | "defaultValue" | "onChange" | "size"> & {
    name: string;
    defaultValue?: number | string | null;
    /** Controlled mode (string so partial input like "12." works). */
    value?: string;
    onChange?: (value: string) => void;
    shortcuts?: AmountShortcut[];
    /** Large text for the main amount of a screen (payments). */
    size?: "md" | "lg";
  };

const clean = (s: string) => {
  const t = s.replace(/[^\d.]/g, "");
  const [int, ...rest] = t.split(".");
  return rest.length ? `${int}.${rest.join("").slice(0, 2)}` : int;
};

export function FormAmountInput({
  label, hint, error, required, className, name, id, defaultValue, value, onChange, shortcuts = [], size = "md", ...input
}: FormAmountInputProps) {
  const ids = useFieldIds(id);
  const fs = useFieldState(name);
  const err = error ?? fs.error;
  const [inner, setInner] = useState(fs.value ?? (defaultValue != null && defaultValue !== "" ? String(defaultValue) : ""));
  const cur = value ?? inner;
  const set = (v: string) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };
  const big = size === "lg";

  return (
    <FormField label={label} hint={hint} error={err} required={required} className={className} htmlFor={ids.id} ids={ids}>
      <div className="relative">
        <span className={`pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted ${big ? "text-2xl" : "text-lg"}`}>₹</span>
        <input
          id={ids.id}
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={cur}
          onChange={(e) => set(clean(e.target.value))}
          required={required}
          placeholder="0"
          aria-invalid={err ? true : undefined}
          aria-describedby={describedBy(ids, hint, err)}
          className={`field font-semibold tabular-nums ${big ? "min-h-16 pl-10 text-3xl" : "pl-8 text-xl"} ${err ? errorRing : ""}`}
          {...input}
        />
      </div>
      {shortcuts.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {shortcuts.map((s) => (
            <button
              key={`${s.label ?? ""}${s.amount}`}
              type="button"
              aria-pressed={Number(cur) === s.amount}
              onClick={() => set(String(s.amount))}
              className="chip tabular-nums"
            >
              {s.label ? `${s.label} ${formatMoney(s.amount)}` : formatMoney(s.amount)}
            </button>
          ))}
        </div>
      )}
    </FormField>
  );
}
