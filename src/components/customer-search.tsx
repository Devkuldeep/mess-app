"use client";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { IconChevron, IconSearch } from "./icons";

export type CustomerItem = { id: string; name: string; phone: string | null; area: string | null; plan: string | null; stopped: boolean; diet: "veg" | "nonveg" };

export function CustomerSearch({ items, labels }: { items: CustomerItem[]; labels: { search: string; stopped: string; noPlan: string } }) {
  const [q, setQ] = useState("");
  const dq = useDeferredValue(q.trim().toLowerCase());
  const list = dq ? items.filter((c) => `${c.name} ${c.phone ?? ""} ${c.area ?? ""}`.toLowerCase().includes(dq)) : items;
  return (
    <div className="space-y-3">
      <label className="relative block">
        <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" />
        <span className="sr-only">{labels.search}</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={labels.search} className="field pl-10" />
      </label>
      <ul className="card divide-y divide-line overflow-hidden">
        {list.map((c) => (
          <li key={c.id}>
            <Link href={`/customers/${c.id}`} className={`flex min-h-16 items-center gap-3 px-4 py-2 active:bg-line/60 ${c.stopped ? "opacity-60" : ""}`}>
              <span className={`size-2.5 shrink-0 rounded-sm ${c.diet === "veg" ? "bg-veg" : "bg-nonveg"}`} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{c.name}</span>
                <span className="block truncate text-sm text-muted">
                  {[c.plan ?? labels.noPlan, c.area].filter(Boolean).join(" · ")}
                  {c.stopped && ` · ${labels.stopped}`}
                </span>
              </span>
              <IconChevron className="size-5 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
