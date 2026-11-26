"use client";
// <form> bound to a Server Action that returns FormState (src/lib/validation.ts).
//  - shows each field's error under that field (via FormStateContext)
//  - refills what the user typed after a failed submit (React 19 resets forms)
//  - moves focus to the first invalid field (it may be scrolled off on a phone)
//  - shows a whole-form error / "fix the red fields" note above the button
//  - works before JS loads (plain form post), like any Server Action form
import { useActionState, useEffect, useMemo, useRef, type ReactNode } from "react";
import type { FormState } from "@/lib/validation";
import { FormStateContext } from "./form-context";

export function ActionForm({
  action, errors, submit, savedText, children, className = "space-y-4",
}: {
  action: (s: FormState, fd: FormData) => Promise<FormState>;
  /** Translations: error key → message (pass `t`). */
  errors: Record<string, string>;
  submit: string;
  /** Shown after a successful save (action returns { ok: true }). */
  savedText?: string;
  className?: string;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const ctx = useMemo(
    () => ({
      errorFor: (name: string) => {
        const key = state?.fieldErrors?.[name];
        return key ? (errors[key] ?? key) : undefined;
      },
      valueFor: (name: string) => state?.values?.[name],
    }),
    [state, errors],
  );

  // After a failed submit, focus the first field marked invalid.
  useEffect(() => {
    if (!state?.fieldErrors || Object.keys(state.fieldErrors).length === 0) return;
    const el = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [state]);

  const hasFieldErrors = !!state?.fieldErrors && Object.keys(state.fieldErrors).length > 0;

  return (
    <FormStateContext value={ctx}>
      <form ref={formRef} action={formAction} className={className} noValidate={false}>
        {children}
        {state?.error && (
          <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">
            {errors[state.error] ?? state.error}
          </p>
        )}
        {!state?.error && hasFieldErrors && (
          <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">
            {errors.fixFields ?? "Please fix the fields marked in red"}
          </p>
        )}
        {state?.ok && savedText && !pending && (
          <p role="status" className="rounded-xl bg-ok-soft px-3 py-2 text-sm text-ok">✓ {savedText}</p>
        )}
        <button type="submit" disabled={pending} aria-busy={pending || undefined} className="btn-primary w-full">
          {pending && (
            <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
          {submit}
        </button>
      </form>
    </FormStateContext>
  );
}
