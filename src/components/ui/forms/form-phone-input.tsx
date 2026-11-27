"use client";
// Indian mobile number: fixed +91, number keypad, shown as "98765 43210".
// Submits the 10 digits (no spaces). Validates on blur with normalizePhone().
import { useRef, useState, type InputHTMLAttributes } from "react";
import { normalizePhone } from "@/lib/links";
import { useFieldState } from "./form-context";
import { describedBy, errorRing, FormField, useFieldIds, type FieldBaseProps, useFormReset } from "./form-field";

export type FormPhoneInputProps = FieldBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type" | "value" | "defaultValue" | "onChange"> & {
    name: string;
    defaultValue?: string | null;
    onChange?: (digits: string) => void;
    /** Message when the number isn't a valid 10-digit mobile (shown after blur). */
    invalidMessage?: string;
  };

const pretty = (d: string) => (d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d);
const digitsOnly = (s: string) => {
  let d = s.replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 10);
};

export function FormPhoneInput({
  label, hint, error, required, className, name, id, defaultValue, onChange, invalidMessage = "Enter a 10-digit mobile number", onBlur, ...input
}: FormPhoneInputProps) {
  const ids = useFieldIds(id);
  const fs = useFieldState(name);
  const [digits, setDigits] = useState(digitsOnly(fs.value ?? defaultValue ?? ""));
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useFormReset(inputRef, () => {
    setDigits(digitsOnly(defaultValue ?? ""));
    setTouched(false);
  });
  const invalid = touched && digits.length > 0 && !normalizePhone(digits);
  const shownError = error ?? (invalid ? invalidMessage : null) ?? fs.error ?? null;

  return (
    <FormField label={label} hint={hint} error={shownError} required={required} className={className} htmlFor={ids.id} ids={ids}>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center border-r border-line pr-2 text-muted">+91</span>
        <input
          ref={inputRef}
          id={ids.id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={pretty(digits)}
          onChange={(e) => {
            const d = digitsOnly(e.target.value);
            setDigits(d);
            onChange?.(d);
          }}
          onBlur={(e) => {
            setTouched(true);
            onBlur?.(e);
          }}
          required={required}
          placeholder="98765 43210"
          aria-invalid={shownError ? true : undefined}
          aria-describedby={describedBy(ids, hint, shownError)}
          className={`field pl-14 tabular-nums tracking-wide ${shownError ? errorRing : ""}`}
          {...input}
        />
        {/* The visible input shows spaces; submit clean digits. */}
        <input type="hidden" name={name} value={digits} />
      </div>
    </FormField>
  );
}
