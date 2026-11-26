// Tables of the Mess Manager design system.
//   DataTable — responsive (cards on phones, table from sm), sort/search/totals/selection, GSAP Flip.
//   Table* primitives — for custom server-rendered tables.
export { DataTable, type DataColumn, type DataTableProps, type DataTableLabels } from "./data-table";
export { DataTableSkeleton } from "./data-table-skeleton";
export { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption } from "./table";
export {
  tableContainerVariants, tableVariants, tableHeadVariants, tableCellVariants, tableRowVariants, cellToneVariants,
  type TableContainerVariants, type TableVariants, type TableHeadVariants, type TableCellVariants, type TableRowVariants,
} from "./table-variants";
export type { TableRow as DataRow, CellObject, CellTone, ColumnFormat, SortDir } from "@/lib/table";
