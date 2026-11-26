"use client";
// Base of every form control: label, required mark, hint, error message and
// the ids that tie them to the input for screen readers.
// Rules: .claude/skills/mobile-ui/SKILL.md (48px targets, 16px text, colour + text for errors).
import { useId, type ReactNode } from "react";

export type FieldBaseProps = {
  /** Visible label. Keep it short; Devanagari wraps fine. */
  label?: ReactNode;
  /** Helper text under the control (hidden while an error is shown). */
  hint?: ReactNode;
  /** Error message (e.g. from useActionState). Turns the control red. */
  error?: string | null;
  /** Adds a red * after the label and the native `required`. */
  required?: boolean;
  /** Extra classes for the outer wrapper. */
  className?: string;
};

export type FieldIds = { id: string; hintId: string; errorId: string };

export function useFieldIds(id?: string): FieldIds {
  const auto = useId();
  const base = id ?? `f${auto.replace(/[^a-zA-Z0-9]/g, "")}`;
  return { id: base, hintId: `${base}-hint`, errorId: `${base}-error` };
}

/** aria-describedby value for a control: hint and/or error. */
export function describedBy(ids: Pick<FieldIds, "hintId" | "errorId">, hint?: ReactNode, error?: string | null) {
  return [hint && !error ? ids.hintId : null, error ? ids.errorId : null].filter(Boolean).join(" ") || undefined;
}

/** Classes for a control in error state (add next to `field`). */
export const errorRing = "border-bad focus:border-bad focus:ring-bad/25";

export function FormField({
  label, hint, error, required, className = "", htmlFor, ids, as = "div", children,
}: FieldBaseProps & {
  htmlFor?: string;
  ids: Pick<FieldIds, "hintId" | "errorId">;
  /** "fieldset" for groups (radio groups, date ranges); the label becomes a legend. */
  as?: "div" | "fieldset";
  children: ReactNode;
}) {
  const Wrapper = as;
  const labelNode = label ? (
    <>
      {label}
      {required && <span className="ml-0.5 text-bad" aria-hidden>*</span>}
    </>
  ) : null;
  return (
    <Wrapper className={`block min-w-0 ${className}`}>
      {labelNode &&
        (as === "fieldset" ? (
          <legend className="label">{labelNode}</legend>
        ) : (
          <label htmlFor={htmlFor} className="label">{labelNode}</label>
        ))}
      {children}
      {hint && !error && <p id={ids.hintId} className="mt-1 text-sm text-muted">{hint}</p>}
      {error && (
        <p id={ids.errorId} role="alert" className="mt-1 flex items-start gap-1 text-sm text-bad">
          <span aria-hidden>⚠</span>
          {error}
        </p>
      )}
    </Wrapper>
  );
}
