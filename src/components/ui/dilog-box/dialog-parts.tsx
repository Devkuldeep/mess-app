"use client";
// Building blocks inside <DialogContent>. Elements with data-dialog-stagger
// fade up one after another when the dialog opens.
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { DialogClose, useDialog } from "./dialog";
import { dialogIconVariants, type DialogTone } from "./dialog-variants";

type DivProps = HTMLAttributes<HTMLDivElement>;

export function DialogHeader({
  children, className, align = "center", showClose = false, closeLabel = "Close", ...rest
}: DivProps & {
  /** "center" for short alerts, "start" for forms. */
  align?: "center" | "start";
  /** Show a × button (top-right). Default false — dialogs usually have explicit buttons. */
  showClose?: boolean;
  closeLabel?: string;
}) {
  const { dismissible } = useDialog();
  return (
    <div data-dialog-stagger className={cn("relative space-y-2 px-5 pt-6 pb-2", align === "center" ? "text-center" : "pr-12 text-left", className)} {...rest}>
      {children}
      {showClose && dismissible && (
        <DialogClose aria-label={closeLabel} className="icon-btn absolute top-2 right-2 text-2xl leading-none">
          ×
        </DialogClose>
      )}
    </div>
  );
}

/** Round coloured icon above the title. Tone comes from <Dialog tone> unless set here. */
export function DialogIcon({ children, tone, className }: { children: ReactNode; tone?: DialogTone; className?: string }) {
  const ctx = useDialog();
  return (
    <div aria-hidden className={cn(dialogIconVariants({ tone: tone ?? ctx.tone }), "mb-1", className)}>
      {children}
    </div>
  );
}

export function DialogTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialog();
  return <h2 id={titleId} className={cn("text-lg leading-snug font-semibold", className)} {...rest} />;
}

export function DialogDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  const { descriptionId } = useDialog();
  return <p id={descriptionId} className={cn("text-sm leading-relaxed text-muted", className)} {...rest} />;
}

/** Main content; scrolls if it gets tall. */
export function DialogBody({ className, ...rest }: DivProps) {
  return <div data-dialog-stagger className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-3", className)} {...rest} />;
}

/**
 * Action buttons. On phones they stack full-width with the main action on top
 * (easiest to reach); from `sm` up they sit side by side.
 */
export function DialogFooter({ className, children, ...rest }: DivProps & { children: ReactNode }) {
  return (
    <div data-dialog-stagger className={cn("flex flex-col-reverse gap-2 px-5 pt-3 pb-5 sm:flex-row sm:justify-end", className)} {...rest}>
      {children}
    </div>
  );
}
