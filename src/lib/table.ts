// Pure table logic (sort, search, totals, formatting) used by <DataTable>.
// Rows and columns are plain serializable data so Server Components can pass
// them straight to the client table.
import { formatDate, formatMoney, type Lang } from "./i18n.ts";

export type CellTone = "default" | "ok" | "bad" | "warn" | "muted" | "brand";
export type CellValue = string | number | boolean | null | undefined;
/** A cell with its raw value (used for sorting/search/totals) and optional custom display. */
export type CellObject = { value: CellValue; display?: unknown; tone?: CellTone };
export type Cell = CellValue | CellObject;

export type TableRow = { id: string; href?: string } & { [key: string]: Cell };

export type ColumnFormat = "text" | "number" | "money" | "date" | "percent";
export type SortDir = "asc" | "desc";

export const isCellObject = (c: unknown): c is CellObject => !!c && typeof c === "object" && "value" in (c as object);
export const cellValue = (c: Cell): CellValue => (isCellObject(c) ? c.value : c);
export const cellTone = (c: Cell): CellTone | undefined => (isCellObject(c) ? c.tone : undefined);

/** Stable sort by a column; empty values always last; Hindi/English-aware text compare. */
export function sortRows<T extends TableRow>(rows: T[], key: string, dir: SortDir, lang: Lang = "en"): T[] {
  const collator = new Intl.Collator(lang === "hi" ? "hi-IN" : "en-IN", { numeric: true, sensitivity: "base" });
  const sign = dir === "asc" ? 1 : -1;
  return rows
    .map((row, i) => ({ row, i, v: cellValue(row[key]) }))
    .sort((a, b) => {
      const ae = a.v === null || a.v === undefined || a.v === "";
      const be = b.v === null || b.v === undefined || b.v === "";
      if (ae || be) return ae === be ? a.i - b.i : ae ? 1 : -1;
      const cmp = typeof a.v === "number" && typeof b.v === "number" ? a.v - b.v : collator.compare(String(a.v), String(b.v));
      return cmp * sign || a.i - b.i;
    })
    .map((x) => x.row);
}

/** Case-insensitive "contains" search over the given columns (all if none given). */
export function filterRows<T extends TableRow>(rows: T[], query: string, keys?: string[]): T[] {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return rows;
  return rows.filter((row) =>
    (keys ?? Object.keys(row)).some((k) => {
      if (k === "id" || k === "href") return false;
      const v = cellValue(row[k]);
      return v !== null && v !== undefined && String(v).toLocaleLowerCase().includes(q);
    }),
  );
}

/** Sum of numeric values in a column (non-numbers ignored), rounded to paise. */
export function columnTotal(rows: TableRow[], key: string): number {
  const sum = rows.reduce((s, r) => {
    const v = cellValue(r[key]);
    return typeof v === "number" && Number.isFinite(v) ? s + v : s;
  }, 0);
  return Math.round(sum * 100) / 100;
}

/** Default text for a value by column format. `percent` expects 0..1. */
export function formatCell(v: CellValue, format: ColumnFormat = "text", lang: Lang = "en"): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "✓" : "—";
  switch (format) {
    case "money":
      return typeof v === "number" ? formatMoney(v) : String(v);
    case "number":
      return typeof v === "number" ? new Intl.NumberFormat("en-IN").format(v) : String(v);
    case "percent":
      return typeof v === "number" ? `${Math.round(v * 100)}%` : String(v);
    case "date":
      return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? formatDate(v, lang, { day: "numeric", month: "short" }) : String(v);
    default:
      return String(v);
  }
}
