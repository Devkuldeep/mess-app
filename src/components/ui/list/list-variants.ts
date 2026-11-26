// Visual variants for lists (class-variance-authority).
import { cva, type VariantProps } from "class-variance-authority";

export const listVariants = cva("", {
  variants: {
    variant: {
      /** Rows inside one rounded card (default, like a settings list). */
      inset: "overflow-hidden rounded-2xl border border-line bg-card",
      /** No box; rows separated by lines (inside your own card). */
      plain: "",
      /** Each row its own card with a gap. */
      cards: "space-y-2",
    },
    dividers: { true: "", false: "" },
  },
  compoundVariants: [
    { variant: ["inset", "plain"], dividers: true, class: "divide-y divide-line" },
  ],
  defaultVariants: { variant: "inset", dividers: true },
});

export const listItemVariants = cva("flex w-full items-center gap-3 px-4 text-left", {
  variants: {
    density: {
      comfortable: "min-h-16 py-2",
      compact: "min-h-12 py-1.5",
    },
    interactive: {
      true: "transition-colors active:bg-line/60 focus-visible:bg-surface focus-visible:outline-none",
      false: "",
    },
    card: { true: "rounded-2xl border border-line bg-card", false: "" },
    disabled: { true: "pointer-events-none opacity-50", false: "" },
  },
  defaultVariants: { density: "comfortable", interactive: false, card: false, disabled: false },
});

export const listAvatarVariants = cva("flex shrink-0 items-center justify-center rounded-full font-semibold select-none", {
  variants: {
    tone: {
      brand: "bg-brand-soft text-brand-ink",
      ok: "bg-ok-soft text-ok",
      bad: "bg-bad-soft text-bad",
      warn: "bg-warn-soft text-warn",
      muted: "bg-surface text-muted",
    },
    size: {
      sm: "size-8 text-xs",
      md: "size-10 text-sm",
      lg: "size-12 text-base",
    },
  },
  defaultVariants: { tone: "brand", size: "md" },
});

export const listMetaVariants = cva("shrink-0 text-right", {
  variants: {
    tone: {
      default: "text-ink",
      muted: "text-sm text-muted",
      ok: "font-semibold text-ok",
      bad: "font-semibold text-bad",
      warn: "font-semibold text-warn",
      brand: "font-semibold text-brand-ink",
    },
  },
  defaultVariants: { tone: "default" },
});

export type ListVariants = VariantProps<typeof listVariants>;
export type ListItemVariants = VariantProps<typeof listItemVariants>;
export type ListAvatarVariants = VariantProps<typeof listAvatarVariants>;
export type ListMetaTone = NonNullable<VariantProps<typeof listMetaVariants>["tone"]>;

/** Buttons revealed behind a SwipeItem. */
export const swipeActionVariants = cva(
  "flex h-full flex-col items-center justify-center gap-0.5 px-2 text-xs font-semibold text-white transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-inset disabled:opacity-60",
  {
    variants: {
      tone: {
        brand: "bg-brand",
        ok: "bg-ok",
        bad: "bg-bad",
        warn: "bg-warn",
        muted: "bg-muted",
      },
    },
    defaultVariants: { tone: "brand" },
  },
);

export type SwipeTone = NonNullable<VariantProps<typeof swipeActionVariants>["tone"]>;
