// Table primitives for custom tables (server-renderable, no state).
// For sorting/search/selection and the phone card layout use <DataTable>.
// Phones: prefer DataTable's cards — a 5-column table at 360px is unreadable.
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import {
  tableCellVariants, tableContainerVariants, tableHeadVariants, tableRowVariants, tableVariants,
  type TableCellVariants, type TableContainerVariants, type TableHeadVariants, type TableRowVariants, type TableVariants,
} from "./table-variants";

export function Table({
  className, containerClassName, variant, density, striped, ...rest
}: HTMLAttributes<HTMLTableElement> & TableContainerVariants & TableVariants & { containerClassName?: string }) {
  return (
    <div className={cn(tableContainerVariants({ variant }), containerClassName)}>
      <table className={cn(tableVariants({ density, striped }), className)} {...rest} />
    </div>
  );
}

export function TableHeader({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-card", className)} {...rest} />;
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function TableFooter({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tfoot className={cn("border-t-2 border-line bg-surface/60 font-semibold", className)} {...rest} />;
}

export function TableRow({ className, interactive, selected, ...rest }: HTMLAttributes<HTMLTableRowElement> & TableRowVariants) {
  return <tr className={cn(tableRowVariants({ interactive, selected }), className)} {...rest} />;
}

export function TableHead({ className, align, sticky, ...rest }: Omit<ThHTMLAttributes<HTMLTableCellElement>, "align"> & TableHeadVariants) {
  return <th scope="col" className={cn(tableHeadVariants({ align, sticky }), className)} {...rest} />;
}

export function TableCell({ className, align, numeric, tone, ...rest }: Omit<TdHTMLAttributes<HTMLTableCellElement>, "align"> & TableCellVariants) {
  return <td className={cn(tableCellVariants({ align, numeric, tone }), className)} {...rest} />;
}

export function TableCaption({ className, ...rest }: HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption className={cn("px-4 py-2 text-left text-sm text-muted caption-bottom", className)} {...rest} />;
}
