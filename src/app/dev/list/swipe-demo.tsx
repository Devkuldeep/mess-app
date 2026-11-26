"use client";
import { useState } from "react";
import { List, ListAvatar, SwipeItem } from "@/components/ui";
import { toast } from "@/stores/toast-store";

const start = [
  { id: "1", name: "Aman Verma", area: "Sector 5" },
  { id: "2", name: "Sana Khan", area: "Civil Lines" },
  { id: "3", name: "नेहा जोशी", area: "Sector 7" },
];

export function SwipeDemo() {
  const [rows, setRows] = useState(start);
  const [done, setDone] = useState<string[]>([]);
  return (
    <List>
      {rows.map((r) => (
        <SwipeItem
          key={r.id}
          leading={<ListAvatar name={r.name} tone={done.includes(r.id) ? "ok" : "brand"} />}
          title={r.name}
          subtitle={r.area}
          meta={done.includes(r.id) ? "✓" : undefined}
          metaTone="ok"
          onClick={() => toast(`${r.name} खोला`)}
          primary={{ label: "डिलीवर", icon: "✓", tone: "ok", onAction: () => { setDone((d) => [...d, r.id]); toast.success(`${r.name} डिलीवर`); } }}
          actions={[
            { label: "कॉल", icon: "📞", tone: "brand", onAction: () => { toast(`${r.name} को कॉल`); } },
            {
              label: "हटाएं", icon: "🗑", tone: "bad",
              onAction: async () => { await new Promise((res) => setTimeout(res, 300)); setRows((x) => x.filter((y) => y.id !== r.id)); toast.warning(`${r.name} हटाया`); },
            },
          ]}
        />
      ))}
    </List>
  );
}
