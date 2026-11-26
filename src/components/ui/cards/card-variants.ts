// Visual variants for cards (class-variance-authority).
import { cva, type VariantProps } from "class-variance-authority";

export const cardVariants = cva("relative block rounded-2xl text-ink", {
  variants: {
    variant: {
      default: "border border-line bg-card",
      outline: "border border-line bg-transparent",
      soft: "bg-line/50",
      brand: "border border-brand/25 bg-brand-soft",
      elevated: "bg-card shadow-md shadow-black/5",
      danger: "border border-bad/25 bg-bad-soft",
      success: "border border-ok/25 bg-ok-soft",
      warning: "border border-warn/25 bg-warn-soft",
    },
    padding: {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-5",
    },
    /** Tappable card (link/button): press feedback + focus ring. */
    interactive: {
      true: "transition active:scale-[.99] active:bg-line/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
      false: "",
    },
  },
  defaultVariants: { variant: "default", padding: "md", interactive: false },
});

export const statValueVariants = cva("text-3xl leading-tight font-bold tabular-nums sm:text-4xl", {
  variants: {
    tone: {
      default: "text-ink",
      ok: "text-ok",
      bad: "text-bad",
      warn: "text-warn",
      brand: "text-brand-ink",
    },
  },
  defaultVariants: { tone: "default" },
});

export const trendVariants = cva("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", {
  variants: {
    good: {
      true: "bg-ok-soft text-ok",
      false: "bg-bad-soft text-bad",
      neutral: "bg-surface text-muted",
    },
  },
  defaultVariants: { good: "neutral" },
});

export type CardVariants = VariantProps<typeof cardVariants>;
export type StatTone = NonNullable<VariantProps<typeof statValueVariants>["tone"]>;
