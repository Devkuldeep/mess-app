"use client";
// Building blocks inside <DrawerContent>. Elements with data-drawer-stagger
// fade up one after another on open; data-drawer-drag marks where a swipe can start.
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { DrawerClose, useDrawer } from "./drawer";

type DivProps = HTMLAttributes<HTMLDivElement>;

/** Grab bar for bottom/top sheets. Swiping it closes the drawer. */
export function DrawerHandle({ className, ...rest }: DivProps) {
  return (
    <div data-drawer-drag aria-hidden className={cn("flex shrink-0 cursor-grab touch-none justify-center pt-2.5 pb-1 active:cursor-grabbing", className)} {...rest}>
      <span className="h-1.5 w-10 rounded-full bg-line" />
    </div>
  );
}

export function DrawerHeader({
  children, className, showClose = true, closeLabel = "Close", draggable = true, ...rest
}: DivProps & {
  /** Show the × button. Default true. */
  showClose?: boolean;
  closeLabel?: string;
  /** Allow swipe-to-close starting on the header. Default true. */
  draggable?: boolean;
}) {
  const { dismissible } = useDrawer();
  return (
    <div
      data-drawer-drag={draggable || undefined}
      data-drawer-stagger
      className={cn("flex shrink-0 items-start gap-2 px-4 pt-2 pb-3", draggable && "touch-none", className)}
      {...rest}
    >
      <div className="min-w-0 flex-1 pt-1.5">{children}</div>
      {showClose && dismissible && (
        <DrawerClose aria-label={closeLabel} className="icon-btn -mr-2 shrink-0 text-2xl leading-none">
          ×
        </DrawerClose>
      )}
    </div>
  );
}

export function DrawerTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDrawer();
  return <h2 id={titleId} className={cn("text-lg leading-snug font-semibold", className)} {...rest} />;
}

export function DrawerDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  const { descriptionId } = useDrawer();
  return <p id={descriptionId} className={cn("mt-0.5 text-sm text-muted", className)} {...rest} />;
}

/** Scrollable middle. Scrolling here never starts a swipe. */
export function DrawerBody({ className, stagger = true, ...rest }: DivProps & { stagger?: boolean }) {
  return (
    <div
      data-drawer-stagger={stagger || undefined}
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4", className)}
      {...rest}
    />
  );
}

/** Sticky actions at the bottom (primary action on the right / full width). */
export function DrawerFooter({ className, children, ...rest }: DivProps & { children: ReactNode }) {
  return (
    <div data-drawer-stagger className={cn("flex shrink-0 gap-2 border-t border-line px-4 py-3", className)} {...rest}>
      {children}
    </div>
  );
}
