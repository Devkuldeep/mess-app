// Visual variants for tables (class-variance-authority).
import { cva, type VariantProps } from "class-variance-authority";

/** Outer box around a <table>; scrolls sideways if columns don't fit. */
export const tableContainerVariants = cva("w-full overflow-x-auto overscroll-x-contain", {
  variants: {
    variant: {
      card: "card",
      plain: "",
    },
  },
  defaultVariants: { variant: "card" },
});

export const tableVariants = cva("w-full border-collapse text-left text-sm", {
  variants: {
    density: {
      comfortable: "[&_td]:py-3 [&_th]:py-2.5",
      compact: "[&_td]:py-1.5 [&_th]:py-1.5",
    },
    striped: {
      true: "[&_tbody_tr:nth-child(even)]:bg-surface/60",
      false: "",
    },
  },
  defaultVariants: { density: "comfortable", striped: false },
});

export const tableHeadVariants = cva("px-3 text-xs font-semibold tracking-wide whitespace-nowrap text-muted uppercase first:pl-4 last:pr-4", {
  variants: {
    align: { start: "text-left", center: "text-center", end: "text-right" },
    sticky: { true: "sticky top-0 z-10 bg-card", false: "" },
  },
  defaultVariants: { align: "start", sticky: false },
});

export const tableCellVariants = cva("px-3 align-middle first:pl-4 last:pr-4", {
  variants: {
    align: { start: "text-left", center: "text-center", end: "text-right" },
    numeric: { true: "tabular-nums whitespace-nowrap", false: "" },
    tone: {
      default: "",
      ok: "text-ok font-semibold",
      bad: "text-bad font-semibold",
      warn: "text-warn font-semibold",
      muted: "text-muted",
      brand: "text-brand-ink font-semibold",
    },
  },
  defaultVariants: { align: "start", numeric: false, tone: "default" },
});

/** Just the colour/number styling of a value (used in phone cards). */
export const cellToneVariants = cva("", {
  variants: {
    numeric: { true: "tabular-nums whitespace-nowrap", false: "" },
    tone: {
      default: "",
      ok: "text-ok font-semibold",
      bad: "text-bad font-semibold",
      warn: "text-warn font-semibold",
      muted: "text-muted",
      brand: "text-brand-ink font-semibold",
    },
  },
  defaultVariants: { numeric: false, tone: "default" },
});

export const tableRowVariants = cva("border-t border-line transition-colors", {
  variants: {
    interactive: { true: "relative cursor-pointer hover:bg-surface/70 active:bg-line/50", false: "" },
    selected: { true: "bg-brand-soft/60", false: "" },
  },
  defaultVariants: { interactive: false, selected: false },
});

export type TableContainerVariants = VariantProps<typeof tableContainerVariants>;
export type TableVariants = VariantProps<typeof tableVariants>;
export type TableHeadVariants = VariantProps<typeof tableHeadVariants>;
export type TableCellVariants = VariantProps<typeof tableCellVariants>;
export type TableRowVariants = VariantProps<typeof tableRowVariants>;
