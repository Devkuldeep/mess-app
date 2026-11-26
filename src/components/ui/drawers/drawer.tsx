"use client";
// Drawer root: holds open state (controlled or uncontrolled) and the ids that
// link the dialog to its title/description. Visuals + motion live in DrawerContent.
//
//   <Drawer>
//     <DrawerTrigger className="btn-primary">Filter</DrawerTrigger>
//     <DrawerContent side="bottom">
//       <DrawerHandle />
//       <DrawerHeader><DrawerTitle>Filter</DrawerTitle></DrawerHeader>
//       <DrawerBody>…</DrawerBody>
//       <DrawerFooter><DrawerClose className="btn-secondary w-full">Done</DrawerClose></DrawerFooter>
//     </DrawerContent>
//   </Drawer>
import { createContext, useCallback, useContext, useId, useMemo, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type DrawerContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Overlay click / Esc / swipe may close it. */
  dismissible: boolean;
  titleId: string;
  descriptionId: string;
};

const DrawerContext = createContext<DrawerContextValue | null>(null);

/** Open/close a drawer from any child (e.g. close after a form saves). */
export function useDrawer(): DrawerContextValue {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error("useDrawer must be used inside <Drawer>");
  return ctx;
}

export type DrawerProps = {
  children: ReactNode;
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial state. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** If false, only an explicit DrawerClose / setOpen(false) closes it (for "must answer" sheets). Default true. */
  dismissible?: boolean;
};

export function Drawer({ children, open: openProp, defaultOpen = false, onOpenChange, dismissible = true }: DrawerProps) {
  const [inner, setInner] = useState(defaultOpen);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : inner;
  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setInner(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );
  const id = useId();
  const value = useMemo(
    () => ({ open, setOpen, dismissible, titleId: `${id}-title`, descriptionId: `${id}-desc` }),
    [open, setOpen, dismissible, id],
  );
  return <DrawerContext value={value}>{children}</DrawerContext>;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** Button that opens the drawer. Style it like any button (e.g. className="btn-primary"). */
export function DrawerTrigger({ onClick, className, type = "button", ...rest }: ButtonProps) {
  const { open, setOpen } = useDrawer();
  return (
    <button
      type={type}
      aria-haspopup="dialog"
      aria-expanded={open}
      className={className}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOpen(true);
      }}
      {...rest}
    />
  );
}

/** Button that closes the drawer (runs the close animation). */
export function DrawerClose({ onClick, className, type = "button", ...rest }: ButtonProps) {
  const { setOpen } = useDrawer();
  return (
    <button
      type={type}
      className={cn(className)}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOpen(false);
      }}
      {...rest}
    />
  );
}
