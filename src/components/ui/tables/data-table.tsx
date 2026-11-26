"use client";
// Responsive data table: cards on phones, a real <table> from `sm` up.
// Sorting (Hindi-aware), search, totals, "show more", row links, and checkbox
// selection that submits as `<input name=… value=rowId>` inside a parent <form>
// (so a Server Action can do bulk work). GSAP Flip glides rows on sort/search.
//
// Columns and rows are plain data (no functions), so a Server Component can
// render <DataTable columns={…} rows={…} />. Custom cell UI: pass
// { value, display: <JSX/>, tone } as the cell.
import Link from "next/link";
import { useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Lang } from "@/lib/i18n";
import {
  cellTone, cellValue, columnTotal, filterRows, formatCell, isCellObject, sortRows,
  type ColumnFormat, type SortDir, type TableRow,
} from "@/lib/table";
import { Flip, gsap, prefersReducedMotion, useGSAP } from "../gsap";
import { FormSearchInput } from "../forms/form-search-input";
import { cellToneVariants, tableCellVariants, tableContainerVariants, tableHeadVariants, tableRowVariants, tableVariants, type TableContainerVariants, type TableVariants } from "./table-variants";

export type DataColumn = {
  key: string;
  header: string;
  format?: ColumnFormat;
  /** Default: "end" for number/money/percent, else "start". */
  align?: "start" | "center" | "end";
  sortable?: boolean;
  /**
   * Role in the phone card:
   *  title (bold first line) · subtitle (grey line under it) · meta (right side, e.g. ₹ amount)
   *  · detail (small "label: value" grid, default) · hidden (table only).
   */
  mobile?: "title" | "subtitle" | "meta" | "detail" | "hidden";
  /** Show a sum of this column in the footer. */
  total?: boolean;
  /** Hide in the wide table (phone card only). */
  tableHidden?: boolean;
  className?: string;
};

export type DataTableLabels = {
  search: string;
  clear: string;
  showMore: string;
  /** "{n} selected" */
  selected: string;
  selectAll: string;
  /** "Select {name}" */
  selectRow: string;
  empty: string;
  total: string;
};

const DEFAULT_LABELS: DataTableLabels = {
  search: "Search",
  clear: "Clear",
  showMore: "Show more",
  selected: "{n} selected",
  selectAll: "Select all",
  selectRow: "Select {name}",
  empty: "Nothing here yet",
  total: "Total",
};

export type DataTableProps = TableContainerVariants &
  TableVariants & {
    columns: DataColumn[];
    rows: TableRow[];
    lang?: Lang;
    /** auto = cards below `sm`, table above. */
    layout?: "auto" | "table" | "cards";
    stickyHeader?: boolean;
    searchable?: boolean;
    /** Columns searched (default: all). */
    searchKeys?: string[];
    initialSort?: { key: string; dir: SortDir };
    /** Show this many rows, then a "show more" button. */
    pageSize?: number;
    /** Enable checkboxes; each checked row submits `name=<row id>` in the surrounding <form>. */
    selectable?: { name: string };
    onSelectionChange?: (ids: string[]) => void;
    /** Shown in the selection bar (e.g. a submit button for a bulk Server Action). */
    selectionActions?: ReactNode;
    /** Replaces the default empty message. */
    empty?: ReactNode;
    caption?: string;
    labels?: Partial<DataTableLabels>;
    /** GSAP entrance + Flip reordering. Default true (off with reduced motion). */
    animate?: boolean;
    className?: string;
  };

const NUMERIC: ColumnFormat[] = ["number", "money", "percent"];
const alignOf = (c: DataColumn) => c.align ?? (c.format && NUMERIC.includes(c.format) ? "end" : "start");
const fmt = (s: string, n: number | string) => s.replace("{n}", String(n)).replace("{name}", String(n));

// sm breakpoint (640px) as a store so only ONE layout renders (no duplicate checkboxes).
const SM = "(min-width: 640px)";
const subscribeSm = (cb: () => void) => {
  const mq = window.matchMedia(SM);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useIsWide = () => useSyncExternalStore(subscribeSm, () => window.matchMedia(SM).matches, () => false);

export function DataTable({
  columns, rows, lang = "en", layout = "auto", variant, density, striped, stickyHeader = true, searchable = false, searchKeys,
  initialSort, pageSize, selectable, onSelectionChange, selectionActions, empty, caption, labels: labelsProp, animate = true, className,
}: DataTableProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const wide = useIsWide();
  const asTable = layout === "table" || (layout === "auto" && wide);

  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(initialSort ?? null);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(pageSize ?? Infinity);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const filtered = useMemo(() => filterRows(rows, query, searchKeys), [rows, query, searchKeys]);
  const sorted = useMemo(() => (sort ? sortRows(filtered, sort.key, sort.dir, lang) : filtered), [filtered, sort, lang]);
  const visible = sorted.slice(0, limit);
  const totals = columns.filter((c) => c.total);

  // ── motion ──
  const rootRef = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const motionOn = () => animate && !prefersReducedMotion();
  /** Call right before a change that reorders/filters rows. */
  const captureFlip = () => {
    if (!motionOn() || !rootRef.current) return;
    flipState.current = Flip.getState(rootRef.current.querySelectorAll("[data-flip-id]"));
  };
  useGSAP(
    () => {
      if (!motionOn()) return;
      const els = rootRef.current?.querySelectorAll("[data-flip-id]");
      if (els?.length) gsap.from(Array.from(els).slice(0, 20), { opacity: 0, y: 8, duration: 0.3, stagger: 0.025, ease: "power2.out", clearProps: "opacity,transform" });
    },
    { scope: rootRef, dependencies: [asTable] },
  );
  useGSAP(
    () => {
      const state = flipState.current;
      flipState.current = null;
      if (!state) return;
      Flip.from(state, {
        targets: rootRef.current?.querySelectorAll("[data-flip-id]"),
        duration: 0.4,
        ease: "power2.inOut",
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, clearProps: "opacity,transform" }),
      });
    },
    { scope: rootRef, dependencies: [visible.map((r) => r.id).join(","), asTable] },
  );

  // ── actions ──
  const toggleSort = (key: string) => {
    captureFlip();
    setSort((s) => (!s || s.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));
  };
  const onSearch = (q: string) => {
    captureFlip();
    setQuery(q);
    setLimit(pageSize ?? Infinity);
  };
  const updateSelection = (next: Set<string>) => {
    setSelected(next);
    onSelectionChange?.([...next]);
  };
  const toggleRow = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    updateSelection(next);
  };
  const allSelected = sorted.length > 0 && sorted.every((r) => selected.has(r.id));
  const toggleAll = () => updateSelection(allSelected ? new Set() : new Set(sorted.map((r) => r.id)));

  const titleCol = columns.find((c) => c.mobile === "title") ?? columns[0];
  const rowName = (r: TableRow) => String(cellValue(r[titleCol.key]) ?? r.id);

  const renderCell = (col: DataColumn, row: TableRow): ReactNode => {
    const c = row[col.key];
    if (isCellObject(c) && c.display !== undefined) return c.display as ReactNode;
    return formatCell(cellValue(c), col.format, lang);
  };

  const checkbox = (row: TableRow) =>
    selectable && (
      <input
        type="checkbox"
        name={selectable.name}
        value={row.id}
        checked={selected.has(row.id)}
        onChange={() => toggleRow(row.id)}
        aria-label={fmt(labels.selectRow, rowName(row))}
        className="relative z-10 size-5 shrink-0 accent-brand"
      />
    );

  return (
    <div ref={rootRef} className={cn("space-y-3", className)}>
      {searchable && <FormSearchInput value={query} onChange={onSearch} placeholder={labels.search} clearLabel={labels.clear} />}

      {sorted.length === 0 ? (
        <div className="card p-6 text-center text-muted">{empty ?? labels.empty}</div>
      ) : asTable ? (
        <div className={tableContainerVariants({ variant })}>
          <table className={tableVariants({ density, striped })}>
            {caption && <caption className="sr-only">{caption}</caption>}
            <thead>
              <tr>
                {selectable && (
                  <th scope="col" className={cn(tableHeadVariants({ sticky: stickyHeader }), "w-10")}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={labels.selectAll} className="size-5 accent-brand" />
                  </th>
                )}
                {columns.filter((c) => !c.tableHidden).map((c) => {
                  const active = sort?.key === c.key;
                  const align = alignOf(c);
                  return (
                    <th
                      key={c.key}
                      scope="col"
                      aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : c.sortable ? "none" : undefined}
                      className={cn(tableHeadVariants({ align, sticky: stickyHeader }), c.className)}
                    >
                      {c.sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(c.key)}
                          className={cn("-mx-1 inline-flex min-h-9 items-center gap-1 rounded-md px-1 uppercase hover:text-ink", align === "end" && "flex-row-reverse", active && "text-ink")}
                        >
                          {c.header}
                          <SortIcon dir={active ? sort!.dir : undefined} />
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} data-flip-id={row.id} className={tableRowVariants({ interactive: !!row.href, selected: selected.has(row.id) })}>
                  {selectable && <td className={tableCellVariants({})}>{checkbox(row)}</td>}
                  {columns.filter((c) => !c.tableHidden).map((c) => {
                    const tone = cellTone(row[c.key]);
                    const content = renderCell(c, row);
                    return (
                      <td key={c.key} className={cn(tableCellVariants({ align: alignOf(c), numeric: !!c.format && c.format !== "text", tone }), c.className)}>
                        {/* Whole row is the link (stretched over the row). */}
                        {row.href && c === titleCol ? (
                          <Link href={row.href} className="font-medium after:absolute after:inset-0 focus-visible:outline-none">
                            {content}
                          </Link>
                        ) : (
                          content
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            {totals.length > 0 && (
              <tfoot className="border-t-2 border-line bg-surface/60 font-semibold">
                <tr>
                  {selectable && <td />}
                  {columns.filter((c) => !c.tableHidden).map((c, i) => (
                    <td key={c.key} className={tableCellVariants({ align: alignOf(c), numeric: true })}>
                      {c.total ? formatCell(columnTotal(sorted, c.key), c.format, lang) : i === 0 ? labels.total : ""}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : (
        <>
          {/* Phone: one card per row */}
          {sorted.length > 1 && columns.some((c) => c.sortable) && (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Sort">
              {columns.filter((c) => c.sortable).map((c) => {
                const active = sort?.key === c.key;
                return (
                  <button key={c.key} type="button" aria-pressed={active} onClick={() => toggleSort(c.key)} className="chip shrink-0 gap-1">
                    {c.header}
                    <SortIcon dir={active ? sort!.dir : undefined} />
                  </button>
                );
              })}
            </div>
          )}
          <ul className={cn(tableContainerVariants({ variant }), "divide-y divide-line overflow-hidden")} aria-label={caption}>
            {visible.map((row) => (
              <li key={row.id} data-flip-id={row.id} className={cn("flex items-center gap-3 pl-4", selected.has(row.id) && "bg-brand-soft/60")}>
                {checkbox(row)}
                <RowCard row={row} columns={columns} titleCol={titleCol} renderCell={renderCell} />
              </li>
            ))}
          </ul>
          {totals.length > 0 && (
            <div className="card flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <span className="font-semibold">{labels.total}</span>
              {totals.map((c) => (
                <span key={c.key} className="tabular-nums">
                  <span className="text-muted">{c.header}: </span>
                  <b>{formatCell(columnTotal(sorted, c.key), c.format, lang)}</b>
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {sorted.length > visible.length && (
        <button
          type="button"
          className="btn-secondary w-full"
          onClick={() => {
            captureFlip();
            setLimit((l) => l + (pageSize ?? 20));
          }}
        >
          {labels.showMore} ({sorted.length - visible.length})
        </button>
      )}

      {selectable && selected.size > 0 && (
        <div role="status" className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 flex items-center gap-2 rounded-2xl border border-brand/30 bg-card px-4 py-2 shadow-lg">
          <span className="flex-1 text-sm font-semibold">{fmt(labels.selected, selected.size)}</span>
          <button type="button" className="btn-ghost min-h-10 px-2 text-sm" onClick={() => updateSelection(new Set())}>
            {labels.clear}
          </button>
          {selectionActions}
        </div>
      )}
    </div>
  );
}

function RowCard({
  row, columns, titleCol, renderCell,
}: {
  row: TableRow;
  columns: DataColumn[];
  titleCol: DataColumn;
  renderCell: (c: DataColumn, r: TableRow) => ReactNode;
}) {
  const subtitle = columns.filter((c) => c.mobile === "subtitle");
  const meta = columns.filter((c) => c.mobile === "meta");
  const details = columns.filter((c) => c !== titleCol && (c.mobile ?? "detail") === "detail");
  const toneClass = (c: DataColumn) => cellToneVariants({ tone: cellTone(row[c.key]) ?? "default", numeric: !!c.format && c.format !== "text" });

  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{renderCell(titleCol, row)}</span>
        {subtitle.length > 0 && (
          <span className="block truncate text-sm text-muted">
            {subtitle.map((c, i) => (
              <span key={c.key}>{i > 0 && " · "}{renderCell(c, row)}</span>
            ))}
          </span>
        )}
        {details.length > 0 && (
          <span className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
            {details.map((c) => (
              <span key={c.key} className="min-w-0 truncate">
                <span className="text-muted">{c.header}: </span>
                <span className={toneClass(c)}>{renderCell(c, row)}</span>
              </span>
            ))}
          </span>
        )}
      </span>
      {meta.length > 0 && (
        <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
          {meta.map((c) => (
            <span key={c.key} className={cn("text-base", toneClass(c))}>{renderCell(c, row)}</span>
          ))}
        </span>
      )}
      {row.href && (
        <svg className="size-5 shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </>
  );

  return row.href ? (
    <Link href={row.href} className="flex min-h-16 min-w-0 flex-1 items-center gap-3 py-2 pr-3 active:bg-line/50">
      {body}
    </Link>
  ) : (
    <div className="flex min-h-16 min-w-0 flex-1 items-center gap-3 py-2 pr-4">{body}</div>
  );
}

function SortIcon({ dir }: { dir?: SortDir }) {
  return (
    <svg className={cn("size-3.5 shrink-0", !dir && "opacity-40")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      {dir === "asc" ? <path d="m6 15 6-6 6 6" /> : dir === "desc" ? <path d="m6 9 6 6 6-6" /> : <path d="m8 9 4-4 4 4M8 15l4 4 4-4" />}
    </svg>
  );
}
