import { test } from "node:test";
import assert from "node:assert/strict";
import { columnTotal, filterRows, formatCell, sortRows, type TableRow } from "./table.ts";

const rows: TableRow[] = [
  { id: "1", name: "Rahul", balance: { value: 3120, tone: "bad" }, meals: 59, since: "2026-10-01" },
  { id: "2", name: "aman", balance: 0, meals: 60, since: "2026-11-15" },
  { id: "3", name: "Neha", balance: null, meals: 29, since: "" },
  { id: "4", name: "Priya", balance: -500, meals: 29, since: "2026-09-20" },
];
const ids = (r: TableRow[]) => r.map((x) => x.id).join(",");

test("sortRows: numbers, text (case-insensitive), empties last, stable", () => {
  assert.equal(ids(sortRows(rows, "balance", "desc")), "1,2,4,3");
  assert.equal(ids(sortRows(rows, "balance", "asc")), "4,2,1,3");
  assert.equal(ids(sortRows(rows, "name", "asc")), "2,3,4,1");
  assert.equal(ids(sortRows(rows, "meals", "asc")), "3,4,1,2"); // tie keeps original order
  assert.equal(ids(sortRows(rows, "since", "asc")), "4,1,2,3");
});

test("sortRows: Hindi names", () => {
  const hi: TableRow[] = [{ id: "a", n: "रवि" }, { id: "b", n: "अमन" }, { id: "c", n: "नेहा" }];
  assert.equal(ids(sortRows(hi, "n", "asc", "hi")), "b,c,a");
});

test("filterRows: any column or given ones, ignores id/href", () => {
  assert.equal(ids(filterRows(rows, "H")), "1,3"); // Rahul, Neha (case-insensitive)
  assert.equal(ids(filterRows(rows, "3120")), "1"); // CellObject value
  assert.equal(ids(filterRows(rows, "1", ["name"])), "");
  assert.equal(ids(filterRows(rows, "  ")), "1,2,3,4");
});

test("columnTotal and formatCell", () => {
  assert.equal(columnTotal(rows, "balance"), 3120 - 500);
  assert.equal(columnTotal(rows, "meals"), 177);
  assert.equal(formatCell(2720, "money"), "₹2,720");
  assert.equal(formatCell(0.125, "percent"), "13%");
  assert.equal(formatCell(null, "money"), "—");
  assert.equal(formatCell(123456, "number"), "1,23,456");
});
