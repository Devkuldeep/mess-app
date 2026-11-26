"use client";
// Two-tap delete: first tap arms ("Sure? Tap again"), a second tap within 4s
// runs the action. Replaces window.confirm(), which is ugly and easy to
// mis-tap on a phone.
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";

export type ConfirmButtonProps = {
  action: (fd: FormData) => Promise<unknown>;
  /** Sent as FormData (e.g. { id }). */
  fields: Record<string, string>;
  label: string;
  /** Text while armed, e.g. "पक्का? फिर दबाएँ". */
  confirm: string;
  className?: string;
  icon?: ReactNode;
};

export function ConfirmButton({
  action, fields, label, confirm, className = "btn-ghost min-h-10 px-2 text-sm text-bad", icon,
}: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      disabled={pending}
      aria-live="polite"
      className={`${className} ${armed ? "bg-bad-soft" : ""}`}
      onClick={() => {
        if (!armed) {
          setArmed(true);
          timer.current = setTimeout(() => setArmed(false), 4000);
          return;
        }
        clearTimeout(timer.current);
        setArmed(false);
        const fd = new FormData();
        for (const [k, v] of Object.entries(fields)) fd.set(k, v);
        start(async () => {
          await action(fd);
        });
      }}
    >
      {icon}
      {pending ? "…" : armed ? confirm : label}
    </button>
  );
}
