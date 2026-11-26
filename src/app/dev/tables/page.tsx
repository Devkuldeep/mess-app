// Dev-only living reference for tables (src/components/ui/tables).
// http://localhost:3000/dev/tables — 404 in production builds.
// This file is a Server Component: it passes plain rows/columns (and JSX cells)
// straight to the client DataTable, exactly like a real page would.
import { notFound } from "next/navigation";
import { DataTable, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, type DataColumn, type DataRow } from "@/components/ui";
import { SelectionDemo } from "./selection-demo";

export const metadata = { title: "Tables · design system", robots: { index: false } };

const people = [
  ["Sana Khan", "Civil Lines", "दोनों", 60, 6720, "2026-11-02"],
  ["Aman Verma", "Sector 5", "दोनों", 59, 3220, "2026-11-20"],
  ["Rahul Gupta", "Sector 7", "दोनों", 59, 3120, "2026-10-28"],
  ["Neha Joshi", "Sector 7", "रात", 30, 0, "2026-11-25"],
  ["Priya Singh", "Sector 5", "दोपहर", 29, 2050, null],
  ["Vikram Patel", "Civil Lines", "दोपहर", 30, -500, "2026-11-01"],
  ["Arjun Mehta", "Sector 5", "दोनों", 20, 1300, "2026-11-10"],
  ["Kavya Rao", "", "दोपहर", 10, 770, "2026-11-18"],
  ["Imran Ali", "Sector 9", "दोनों", 44, 2640, "2026-11-05"],
  ["Pooja Sharma", "Sector 9", "रात", 25, 1750, "2026-11-12"],
] as const;

const rows: DataRow[] = people.map(([name, area, plan, meals, balance, paid], i) => ({
  id: `c${i + 1}`,
  href: `/customers/c${i + 1}`,
  name,
  area,
  plan,
  meals,
  balance: {
    value: balance,
    tone: balance > 0 ? "bad" : balance < 0 ? "ok" : "muted",
    // JSX built on the server is fine as a cell display
    display: balance < 0 ? <span title="एडवांस">+₹{Math.abs(balance)}</span> : undefined,
  },
  paid,
  status: {
    value: balance > 3000 ? "overdue" : balance > 0 ? "due" : "clear",
    display:
      balance > 3000 ? <span className="rounded-full bg-bad-soft px-2 py-0.5 text-xs font-semibold text-bad">ज़्यादा बाकी</span>
      : balance > 0 ? <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">बाकी</span>
      : <span className="rounded-full bg-ok-soft px-2 py-0.5 text-xs font-semibold text-ok">साफ़</span>,
  },
}));

const columns: DataColumn[] = [
  { key: "name", header: "नाम", sortable: true, mobile: "title" },
  { key: "area", header: "एरिया", sortable: true, mobile: "subtitle" },
  { key: "plan", header: "प्लान", mobile: "detail" },
  { key: "meals", header: "टिफ़िन", format: "number", sortable: true, total: true, mobile: "detail" },
  { key: "paid", header: "आखिरी पेमेंट", format: "date", sortable: true, mobile: "detail" },
  { key: "status", header: "स्थिति", mobile: "detail" },
  { key: "balance", header: "बाकी", format: "money", sortable: true, total: true, mobile: "meta" },
];

const labels = {
  search: "ग्राहक खोजें", clear: "हटाएं", showMore: "और दिखाएं", selected: "{n} चुने", selectAll: "सभी चुनें",
  selectRow: "{name} चुनें", empty: "कोई ग्राहक नहीं मिला", total: "कुल",
};

export default function DevTablesPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="mx-auto max-w-3xl space-y-8 p-4 pb-24">
      <header>
        <h1 className="text-2xl font-bold">Tables</h1>
        <p className="text-sm text-muted">src/components/ui/tables · dev only · phone = cards, sm+ = table</p>
      </header>

      <section className="space-y-2">
        <h2 className="section-title">DataTable — sort, search, totals, show more, row links</h2>
        <DataTable lang="hi" columns={columns} rows={rows} searchable searchKeys={["name", "area"]} initialSort={{ key: "balance", dir: "desc" }} pageSize={6} labels={labels} caption="ग्राहकों की बाकी रकम" />
      </section>

      <section className="space-y-2">
        <h2 className="section-title">Selection → form (bulk action)</h2>
        <SelectionDemo rows={rows.map((r) => ({ ...r, href: undefined }))} columns={columns} labels={labels} />
      </section>

      <section className="space-y-2">
        <h2 className="section-title">Primitives (custom server table, compact + striped)</h2>
        <Table density="compact" striped>
          <TableHeader>
            <TableRow>
              <TableHead>चीज़</TableHead>
              <TableHead align="end">बना</TableHead>
              <TableHead align="end">बचा</TableHead>
              <TableHead align="end">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[["Dal", 19.4, 1.89], ["Chawal", 25.9, 2.63], ["Sabzi", 51.8, 10.19], ["Roti", 1294, 122]].map(([n, c, l]) => (
              <TableRow key={n as string}>
                <TableCell>{n}</TableCell>
                <TableCell align="end" numeric>{c}</TableCell>
                <TableCell align="end" numeric>{l}</TableCell>
                <TableCell align="end" numeric tone={(l as number) / (c as number) > 0.15 ? "bad" : "default"}>{Math.round(((l as number) / (c as number)) * 100)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </main>
  );
}
