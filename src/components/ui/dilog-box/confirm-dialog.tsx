"use client";
// Ready-made "are you sure?" dialog.
//
//   <ConfirmDialog
//     tone="danger"
//     trigger="हटाएं" triggerClassName="btn-ghost text-bad"
//     title="ग्राहक हटाएं?" description="यह वापस नहीं होगा।"
//     confirmLabel="हाँ, हटाएं" cancelLabel="नहीं"
//     onConfirm={async () => { await deleteCustomer(id); }}   // Server Action is fine
//   />
//
// onConfirm result: nothing / true → close. false or a string → stay open
// (string is shown as the error). A thrown error → stay open with `errorText`.
// While it runs, buttons are disabled and Esc / outside taps don't close it.
import { useState, useTransition, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Dialog, DialogClose, DialogTrigger, useDialog } from "./dialog";
import { DialogContent } from "./dialog-content";
import { DialogDescription, DialogFooter, DialogHeader, DialogIcon, DialogTitle } from "./dialog-parts";
import { dialogActionVariants, type DialogTone } from "./dialog-variants";

export type ConfirmDialogProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Icon inside the round tile (emoji or SVG). Default depends on tone. */
  icon?: ReactNode;
  tone?: DialogTone;
  confirmLabel: string;
  cancelLabel: string;
  /** Shown on the main button while onConfirm runs. Default "…". */
  pendingLabel?: string;
  /** Message when onConfirm throws. */
  errorText?: string;
  onConfirm: () => void | boolean | string | Promise<void | boolean | string>;
  /** Content of the button that opens it (omit when controlling `open` yourself). */
  trigger?: ReactNode;
  triggerClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** After the close animation finished. */
  onClosed?: () => void;
};

const DEFAULT_ICON: Record<DialogTone, string> = { default: "?", danger: "!", success: "✓", warning: "!" };

export function ConfirmDialog({ trigger, triggerClassName, open, onOpenChange, onClosed, tone = "default", ...props }: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} tone={tone} dismissible={!pending}>
      {trigger !== undefined && <DialogTrigger className={triggerClassName}>{trigger}</DialogTrigger>}
      <DialogContent alert size="sm" position="center" onClosed={onClosed}>
        <ConfirmBody tone={tone} onPendingChange={setPending} {...props} />
      </DialogContent>
    </Dialog>
  );
}

function ConfirmBody({
  title, description, icon, tone, confirmLabel, cancelLabel, pendingLabel = "…", errorText = "Something went wrong. Please try again.", onConfirm, onPendingChange,
}: Omit<ConfirmDialogProps, "trigger" | "triggerClassName" | "open" | "onOpenChange" | "onClosed"> & { tone: DialogTone; onPendingChange: (p: boolean) => void }) {
  const { setOpen } = useDialog();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const confirm = () => {
    // Outside the transition so "can't dismiss while working" applies immediately
    // (updates inside a transition wait until it finishes).
    onPendingChange(true);
    setError(null);
    start(async () => {
      try {
        const result = await onConfirm();
        if (result === false) setError(errorText);
        else if (typeof result === "string") setError(result);
        else setOpen(false);
      } catch {
        setError(errorText);
      } finally {
        onPendingChange(false);
      }
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogIcon>{icon ?? DEFAULT_ICON[tone]}</DialogIcon>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      {error && (
        <p role="alert" className="mx-5 mt-2 rounded-xl bg-bad-soft px-3 py-2 text-center text-sm text-bad">
          {error}
        </p>
      )}
      <DialogFooter>
        <DialogClose disabled={pending} className="btn-secondary flex-1">
          {cancelLabel}
        </DialogClose>
        <button type="button" onClick={confirm} disabled={pending} aria-busy={pending || undefined} className={cn(dialogActionVariants({ tone }))}>
          {pending && (
            <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
          {pending ? pendingLabel : confirmLabel}
        </button>
      </DialogFooter>
    </>
  );
}
