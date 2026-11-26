"use client";
// Dialog root: open state (controlled or uncontrolled), dismiss rules, ids and
// tone shared with the parts. Visuals + motion live in DialogContent.
//
//   <Dialog>
//     <DialogTrigger className="btn-secondary">Info</DialogTrigger>
//     <DialogContent>
//       <DialogHeader><DialogTitle>…</DialogTitle><DialogDescription>…</DialogDescription></DialogHeader>
//       <DialogFooter><DialogClose className="btn-primary w-full">OK</DialogClose></DialogFooter>
//     </DialogContent>
//   </Dialog>
import { createContext, useCallback, useContext, useId, useMemo, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { DialogTone } from "./dialog-variants";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Overlay tap / Esc may close it. */
  dismissible: boolean;
  tone: DialogTone;
  titleId: string;
  descriptionId: string;
};

const DialogContext = createContext<DialogContextValue | null>(null);

/** Open/close the dialog from any child (e.g. after a form saves). */
export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used inside <Dialog>");
  return ctx;
}

export type DialogProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** false = must answer: Esc / overlay don't close (the panel nudges instead). Default true. */
  dismissible?: boolean;
  /** Colours DialogIcon and ConfirmDialog's main button. */
  tone?: DialogTone;
};

export function Dialog({ children, open: openProp, defaultOpen = false, onOpenChange, dismissible = true, tone = "default" }: DialogProps) {
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
    () => ({ open, setOpen, dismissible, tone, titleId: `${id}-title`, descriptionId: `${id}-desc` }),
    [open, setOpen, dismissible, tone, id],
  );
  return <DialogContext value={value}>{children}</DialogContext>;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function DialogTrigger({ onClick, type = "button", ...rest }: ButtonProps) {
  const { open, setOpen } = useDialog();
  return (
    <button
      type={type}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOpen(true);
      }}
      {...rest}
    />
  );
}

export function DialogClose({ onClick, type = "button", ...rest }: ButtonProps) {
  const { setOpen } = useDialog();
  return (
    <button
      type={type}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOpen(false);
      }}
      {...rest}
    />
  );
}
