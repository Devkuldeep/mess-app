"use client";
// Small settings edits (plans, dishes, holidays): the button shows "…" while
// saving and "✓ saved" after — no page-level success banner.
//  - action may return FormState (src/lib/validation.ts) → each Form* control
//    shows its own error by `name`, plus a short note above the button
//  - action may also return nothing (older actions) → treated as saved
//  - never auto-resets on failure (what was typed stays); `resetOnSave` clears
//    "add new" forms only after a successful save
// Needs JS (onSubmit + transition), unlike ActionForm. Fine for in-app settings.
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import type { FormState } from "@/lib/validation";
import { FormStateContext } from "./form-context";

export type QuickFormProps = {
  action: (fd: FormData) => Promise<FormState | void>;
  children: ReactNode;
  submit: string;
  saved: string;
  /** Translations: error key → message (pass `t`). Needed if the action returns errors. */
  errors?: Record<string, string>;
  className?: string;
  buttonClass?: string;
  /** Clear inputs after a successful save (for "add new" forms). */
  resetOnSave?: boolean;
};

export function QuickForm({
  action, children, submit, saved, errors = {}, className = "space-y-3", buttonClass = "btn-secondary w-full", resetOnSave = false,
}: QuickFormProps) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>(undefined);
  const [done, setDone] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const ctx = useMemo(
    () => ({
      errorFor: (name: string) => {
        const key = state?.fieldErrors?.[name];
        return key ? (errors[key] ?? key) : undefined;
      },
      // The form is never reset on failure, so nothing needs refilling.
      valueFor: () => undefined,
    }),
    [state, errors],
  );

  const fieldErrorCount = state?.fieldErrors ? Object.keys(state.fieldErrors).length : 0;

  useEffect(() => {
    if (!fieldErrorCount) return;
    const el = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [state, fieldErrorCount]);

  return (
    <FormStateContext value={ctx}>
      <form
        ref={formRef}
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          setDone(false);
          start(async () => {
            const r = (await action(fd)) ?? { ok: true };
            const failed = !!r.error || (!!r.fieldErrors && Object.keys(r.fieldErrors).length > 0);
            setState(r);
            if (failed) return;
            if (resetOnSave) form.reset();
            setDone(true);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => setDone(false), 1800);
          });
        }}
        onChange={() => setDone(false)}
      >
        {children}
        {(state?.error || fieldErrorCount > 0) && !pending && (
          <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">
            {state?.error ? (errors[state.error] ?? state.error) : (errors.fixFields ?? "Please fix the fields marked in red")}
          </p>
        )}
        <button type="submit" disabled={pending} aria-busy={pending || undefined} className={buttonClass}>
          <span aria-live="polite">{pending ? "…" : done ? `✓ ${saved}` : submit}</span>
        </button>
      </form>
    </FormStateContext>
  );
}
