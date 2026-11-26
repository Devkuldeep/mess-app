"use client";
// Submit button that disables itself and shows a spinner while its <form>'s
// Server Action runs (useFormStatus — must be rendered inside the form).
import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type FormSubmitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  children: ReactNode;
  /** Text while submitting (default: keeps children + spinner). */
  pendingText?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** Full-width (default true — easiest to hit with a thumb). */
  block?: boolean;
};

const variants = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn border border-bad/40 bg-bad-soft text-bad",
} as const;

export function FormSubmitButton({ children, pendingText, variant = "primary", block = true, className = "", disabled, ...rest }: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || disabled} aria-busy={pending || undefined} className={`${variants[variant]} ${block ? "w-full" : ""} ${className}`} {...rest}>
      {pending && (
        <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
