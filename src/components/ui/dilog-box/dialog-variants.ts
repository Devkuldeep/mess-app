// Visual variants for dialogs (class-variance-authority).
import { cva, type VariantProps } from "class-variance-authority";

/** Wrapper that positions the panel inside the full-screen <dialog>. */
export const dialogLayoutVariants = cva("absolute inset-0 flex justify-center overflow-y-auto overscroll-contain p-4", {
  variants: {
    position: {
      center: "items-center",
      // thumb-friendly on phones: sits above the bottom edge
      bottom: "items-end pb-[max(1rem,env(safe-area-inset-bottom))]",
    },
  },
  defaultVariants: { position: "center" },
});

export const dialogPanelVariants = cva(
  "relative flex w-full flex-col rounded-3xl bg-card text-ink shadow-2xl outline-none will-change-transform",
  {
    variants: {
      size: {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        full: "h-dvh max-w-none rounded-none",
      },
      tone: {
        default: "",
        danger: "",
        success: "",
        warning: "",
      },
    },
    defaultVariants: { size: "sm", tone: "default" },
  },
);

/** Round icon tile at the top of a dialog (DialogIcon). */
export const dialogIconVariants = cva("mx-auto flex size-14 items-center justify-center rounded-full text-2xl", {
  variants: {
    tone: {
      default: "bg-brand-soft text-brand-ink",
      danger: "bg-bad-soft text-bad",
      success: "bg-ok-soft text-ok",
      warning: "bg-warn-soft text-warn",
    },
  },
  defaultVariants: { tone: "default" },
});

/** Main action button colour per tone (ConfirmDialog). */
export const dialogActionVariants = cva("btn flex-1", {
  variants: {
    tone: {
      default: "bg-brand text-on-brand",
      danger: "bg-bad text-card",
      success: "bg-ok text-card",
      warning: "bg-warn text-card",
    },
  },
  defaultVariants: { tone: "default" },
});

export const dialogOverlayVariants = cva("absolute inset-0", {
  variants: {
    overlay: {
      dim: "bg-black/50",
      blur: "bg-black/35 backdrop-blur-sm",
      none: "bg-transparent",
    },
  },
  defaultVariants: { overlay: "dim" },
});

export type DialogLayoutVariants = VariantProps<typeof dialogLayoutVariants>;
export type DialogPanelVariants = VariantProps<typeof dialogPanelVariants>;
export type DialogOverlayVariants = VariantProps<typeof dialogOverlayVariants>;
export type DialogTone = NonNullable<DialogPanelVariants["tone"]>;
