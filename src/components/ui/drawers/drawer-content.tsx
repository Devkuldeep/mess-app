"use client";
// The drawer itself: a native <dialog> (top layer, focus trap, Esc, inert page,
// focus restored on close) containing an overlay and the sliding panel.
// Customise with cva variants (side / size / tone / overlay) or className.
import { useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useDrawer } from "./drawer";
import {
  drawerOverlayVariants, drawerPanelVariants, type DrawerOverlayVariants, type DrawerPanelVariants, type DrawerSide,
} from "./drawer-variants";
import { useDrawerMotion } from "./use-drawer-motion";

export type DrawerContentProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> &
  DrawerPanelVariants &
  DrawerOverlayVariants & {
    children: ReactNode;
    /** Extra classes for the overlay. */
    overlayClassName?: string;
    /** Drag the handle/header to close. Default true. */
    swipeToClose?: boolean;
    /** Runs after the close animation finished (e.g. reset a form). */
    onClosed?: () => void;
    /** Accessible name when there is no <DrawerTitle>. */
    "aria-label"?: string;
  };

export function DrawerContent({
  children, side, size, tone, overlay, className, overlayClassName, swipeToClose = true, onClosed, "aria-label": ariaLabel, ...panelProps
}: DrawerContentProps) {
  const { open, setOpen, dismissible, titleId, descriptionId } = useDrawer();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const resolvedSide: DrawerSide = side ?? "bottom";

  // Mount lazily on first open, then keep mounted so closing can animate.
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  const requestClose = () => {
    if (dismissible) setOpen(false);
  };
  const { onNativeClose } = useDrawerMotion({
    open: open && mounted,
    side: resolvedSide,
    swipe: swipeToClose && dismissible,
    dialogRef,
    panelRef,
    overlayRef,
    onRequestClose: requestClose,
    onClosed,
  });

  if (!mounted) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={ariaLabel ? undefined : titleId}
      aria-label={ariaLabel}
      aria-describedby={descriptionId}
      // React bubbles cancel/close through the component tree, so a nested
      // drawer's events would reach this one too — only handle our own dialog's.
      // Esc → animate out instead of the instant native close.
      onCancel={(e) => {
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        requestClose();
      }}
      // Closed by the browser anyway (e.g. Esc pressed twice): sync state.
      onClose={(e) => {
        if (e.target !== e.currentTarget) return;
        onNativeClose();
        if (open) setOpen(false);
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-transparent p-0 text-ink backdrop:bg-transparent"
    >
      <div
        ref={overlayRef}
        aria-hidden
        onClick={requestClose}
        className={cn(drawerOverlayVariants({ overlay }), overlayClassName)}
      />
      <div ref={panelRef} className={cn(drawerPanelVariants({ side: resolvedSide, size, tone }), className)} {...panelProps}>
        {children}
      </div>
    </dialog>
  );
}
