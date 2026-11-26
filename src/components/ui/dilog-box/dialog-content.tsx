"use client";
// The dialog box: a native <dialog> (top layer, focus trap, Esc, inert page,
// focus restored on close) with an overlay and a centred (or bottom) panel.
import { useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useDialog } from "./dialog";
import {
  dialogLayoutVariants, dialogOverlayVariants, dialogPanelVariants,
  type DialogLayoutVariants, type DialogOverlayVariants, type DialogPanelVariants,
} from "./dialog-variants";
import { useDialogMotion } from "./use-dialog-motion";

export type DialogContentProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> &
  Omit<DialogPanelVariants, "tone"> &
  DialogLayoutVariants &
  DialogOverlayVariants & {
    children: ReactNode;
    overlayClassName?: string;
    /** Runs after the close animation (e.g. reset a form). */
    onClosed?: () => void;
    /** Accessible name when there is no <DialogTitle>. */
    "aria-label"?: string;
    /** Use role="alertdialog" (confirmations, warnings). */
    alert?: boolean;
  };

export function DialogContent({
  children, size, position, overlay, className, overlayClassName, onClosed, "aria-label": ariaLabel, alert, ...panelProps
}: DialogContentProps) {
  const { open, setOpen, dismissible, tone, titleId, descriptionId } = useDialog();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Mount on first open; stay mounted so closing can animate.
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  const { nudge, onNativeClose } = useDialogMotion({ open: open && mounted, dialogRef, panelRef, overlayRef, onClosed });
  const requestClose = () => (dismissible ? setOpen(false) : nudge());

  if (!mounted) return null;

  return (
    <dialog
      ref={dialogRef}
      role={alert ? "alertdialog" : undefined}
      aria-labelledby={ariaLabel ? undefined : titleId}
      aria-label={ariaLabel}
      aria-describedby={descriptionId}
      // React bubbles cancel/close through the component tree; only handle our own.
      onCancel={(e) => {
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        requestClose();
      }}
      onClose={(e) => {
        if (e.target !== e.currentTarget) return;
        onNativeClose();
        if (open) setOpen(false);
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-transparent p-0 text-ink backdrop:bg-transparent"
    >
      <div ref={overlayRef} aria-hidden className={cn(dialogOverlayVariants({ overlay }), overlayClassName)} />
      {/* Tapping the empty area around the panel = tapping the overlay. */}
      <div
        className={dialogLayoutVariants({ position })}
        onClick={(e) => {
          if (e.target === e.currentTarget) requestClose();
        }}
      >
        <div ref={panelRef} className={cn(dialogPanelVariants({ size, tone }), className)} {...panelProps}>
          {children}
        </div>
      </div>
    </dialog>
  );
}
