"use client";
// Forms for small settings edits: show "…" while saving and "✓ saved" after,
// and a two-tap confirm for destructive actions (no window.confirm()).
import { useState, useTransition, type ReactNode } from "react";

export function QuickForm({
  action, children, submit, saved, className = "space-y-3", buttonClass = "btn-secondary w-full", resetOnSave = false,
}: {
  action: (fd: FormData) => Promise<void>;
  children: ReactNode;
  submit: string;
  saved: string;
  className?: string;
  buttonClass?: string;
  /** Clear inputs after saving (for "add new" forms). */
  resetOnSave?: boolean;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        start(async () => {
          await action(fd);
          if (resetOnSave) form.reset();
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        });
      }}
      onChange={() => setDone(false)}
    >
      {children}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "…" : done ? `✓ ${saved}` : submit}
      </button>
    </form>
  );
}

/** First tap arms ("Sure? Tap again"), second tap within 4s runs the action. */
export function ConfirmButton({
  action, fields, label, confirm, className = "btn-ghost min-h-10 px-2 text-sm text-bad", icon,
}: {
  action: (fd: FormData) => Promise<void>;
  fields: Record<string, string>;
  label: string;
  confirm: string;
  className?: string;
  icon?: ReactNode;
}) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-live="polite"
      className={`${className} ${armed ? "bg-bad-soft" : ""}`}
      onClick={() => {
        if (!armed) {
          setArmed(true);
          setTimeout(() => setArmed(false), 4000);
          return;
        }
        const fd = new FormData();
        for (const [k, v] of Object.entries(fields)) fd.set(k, v);
        start(() => action(fd));
      }}
    >
      {icon}
      {pending ? "…" : armed ? confirm : label}
    </button>
  );
}
