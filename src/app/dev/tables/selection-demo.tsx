"use client";
// Checkbox selection inside a <form>: checked rows submit as `ids=<id>`, so a
// Server Action could send WhatsApp reminders to just those customers.
import { useState } from "react";
import { DataTable, FormSubmitButton, type DataColumn, type DataRow, type DataTableLabels } from "@/components/ui";

export function SelectionDemo({ rows, columns, labels }: { rows: DataRow[]; columns: DataColumn[]; labels: Partial<DataTableLabels> }) {
  const [sent, setSent] = useState<string[] | null>(null);
  return (
    <form
      action={async (fd) => {
        await new Promise((r) => setTimeout(r, 500));
        setSent(fd.getAll("ids").map(String));
      }}
      className="space-y-3"
    >
      <DataTable
        lang="hi"
        columns={columns.filter((c) => ["name", "area", "balance"].includes(c.key))}
        rows={rows.filter((r) => typeof r.balance === "object" && r.balance && (r.balance as { value: number }).value > 0)}
        selectable={{ name: "ids" }}
        selectionActions={<FormSubmitButton block={false} className="min-h-10 px-3 text-sm" pendingText="…">रिमाइंडर भेजें</FormSubmitButton>}
        labels={labels}
        variant="card"
      />
      {sent && <p className="card p-3 text-sm" data-test="sent">FormData ids = {JSON.stringify(sent)}</p>}
    </form>
  );
}
