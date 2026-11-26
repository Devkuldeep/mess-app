"use client";
// Password with a show/hide eye button (people type on small keyboards).
import { useState, type InputHTMLAttributes } from "react";
import { useFieldState } from "./form-context";
import { describedBy, errorRing, FormField, useFieldIds, type FieldBaseProps } from "./form-field";

export type FormPasswordInputProps = FieldBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type"> & {
    /** "new-password" on signup / change, "current-password" on login. */
    autoComplete?: "new-password" | "current-password";
    labels?: { show: string; hide: string };
  };

export function FormPasswordInput({
  label, hint, error, required, className, id, autoComplete = "current-password", labels = { show: "Show password", hide: "Hide password" }, ...input
}: FormPasswordInputProps) {
  const ids = useFieldIds(id);
  const fs = useFieldState(input.name); // never refilled: passwords aren't echoed back
  const err = error ?? fs.error;
  const [visible, setVisible] = useState(false);
  return (
    <FormField label={label} hint={hint} error={err} required={required} className={className} htmlFor={ids.id} ids={ids}>
      <div className="relative">
        <input
          id={ids.id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required={required}
          aria-invalid={err ? true : undefined}
          aria-describedby={describedBy(ids, hint, err)}
          className={`field pr-14 ${err ? errorRing : ""}`}
          {...input}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? labels.hide : labels.show}
          aria-pressed={visible}
          className="icon-btn absolute top-0 right-0"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="m3 3 18 18" />}
          </svg>
        </button>
      </div>
    </FormField>
  );
}
