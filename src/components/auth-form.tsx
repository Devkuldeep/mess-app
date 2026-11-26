"use client";
import { useActionState, type ReactNode } from "react";
import type { FormState } from "@/app/actions/auth";

/** Form wired to a Server Action with an error key → message map. */
export function ActionForm({
  action, errors, submit, children,
}: {
  action: (s: FormState, fd: FormData) => Promise<FormState>;
  errors: Record<string, string>;
  submit: string;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-4">
      {children}
      {state?.error && (
        <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">
          {errors[state.error] ?? state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "…" : submit}
      </button>
    </form>
  );
}
