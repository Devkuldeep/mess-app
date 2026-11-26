"use client";
// Input for secrets that aren't login passwords: bank account / IFSC, Aadhaar,
// API keys, a UPI PIN-style code. Phones are often shared, so:
//  - typed text is masked (•••) with an eye button; it re-masks itself after
//    `revealFor` ms so it isn't left showing on screen
//  - masked with CSS, not type="password", so browsers/password managers don't
//    offer to "save password" for it (falls back to type="password" where the
//    CSS isn't supported)
//  - never refilled after a failed submit, and never echoed by the server:
//    name the field so it ends in Secret/Token/Pin (or add it to SECRET_FIELDS
//    in src/lib/validation.ts)
//  - `savedMask` (e.g. "•••• 4321"): a value is already stored. Shows it with a
//    "Change" button; until tapped, NO input with this name is submitted, so in
//    the action `fd.has(name) === false` means "keep the stored value".
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type InputHTMLAttributes } from "react";
import { useFieldState } from "./form-context";
import { describedBy, errorRing, FormField, useFieldIds, type FieldBaseProps } from "./form-field";

export type FormSensitiveInputProps = FieldBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type" | "defaultValue" | "value" | "autoComplete"> & {
    name: string;
    /** Masked stored value (e.g. "•••• 4321"). The real value never goes to the browser. */
    savedMask?: string;
    /** Auto-hide after this many ms once revealed. 0 = stay visible. Default 15s. */
    revealFor?: number;
    labels?: { show: string; hide: string; change: string; cancel: string };
  };

const MASK: CSSProperties = { WebkitTextSecurity: "disc" } as CSSProperties;
const subscribe = () => () => {};
const cssMaskSupported = () => typeof CSS !== "undefined" && CSS.supports("-webkit-text-security", "disc");

export function FormSensitiveInput({
  label, hint, error, required, className, id, name, savedMask, revealFor = 15000,
  labels = { show: "Show", hide: "Hide", change: "Change", cancel: "Cancel" }, ...input
}: FormSensitiveInputProps) {
  const ids = useFieldIds(id);
  const fs = useFieldState(name); // error only — never refilled
  const err = error ?? fs.error;
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState(!savedMask || !!err);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusOnEdit = useRef(false);
  // Server render assumes support (text + CSS mask); the client corrects it.
  const cssMask = useSyncExternalStore(subscribe, cssMaskSupported, () => true);

  useEffect(() => {
    if (!visible || !revealFor) return;
    const t = setTimeout(() => setVisible(false), revealFor);
    return () => clearTimeout(t);
  }, [visible, revealFor]);

  useEffect(() => {
    if (editing && focusOnEdit.current) inputRef.current?.focus();
    focusOnEdit.current = false;
  }, [editing]);

  if (!editing && savedMask) {
    return (
      <FormField label={label} hint={hint} error={err} required={required} className={className} ids={ids}>
        <div className="field flex items-center gap-2 pr-1">
          <span id={ids.id} className="flex-1 truncate tracking-widest text-muted tabular-nums">{savedMask}</span>
          <button
            type="button"
            onClick={() => {
              focusOnEdit.current = true;
              setEditing(true);
            }}
            className="btn-ghost min-h-10 px-3 text-sm"
          >
            {labels.change}
          </button>
        </div>
      </FormField>
    );
  }

  const masked = !visible;
  return (
    <FormField label={label} hint={hint} error={err} required={required} className={className} htmlFor={ids.id} ids={ids}>
      <div className="relative">
        <input
          ref={inputRef}
          id={ids.id}
          name={name}
          type={masked && !cssMask ? "password" : "text"}
          style={masked && cssMask ? MASK : undefined}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          data-1p-ignore=""
          data-lpignore="true"
          data-form-type="other"
          required={required}
          aria-invalid={err ? true : undefined}
          aria-describedby={describedBy(ids, hint, err)}
          className={`field tabular-nums ${savedMask ? "pr-28" : "pr-14"} ${err ? errorRing : ""}`}
          {...input}
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {savedMask && (
            <button type="button" onClick={() => { setEditing(false); setVisible(false); }} className="btn-ghost min-h-10 px-2 text-sm">
              {labels.cancel}
            </button>
          )}
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? labels.hide : labels.show}
            aria-pressed={visible}
            aria-controls={ids.id}
            className="icon-btn"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
              {visible && <path d="m3 3 18 18" />}
            </svg>
          </button>
        </div>
      </div>
    </FormField>
  );
}
