import type { ReactNode } from "react";
import { BUSINESS, findPlaceholders } from "@/lib/business";

/** Shell for policy pages: title, last-updated, Hindi summary, placeholder warning. */
export function LegalPage({ title, hindiTitle, summary, children }: { title: string; hindiTitle: string; summary: string[]; children: ReactNode }) {
  const missing = findPlaceholders().length;
  return (
    <article className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {missing > 0 && (
        <p role="note" className="rounded-xl border border-warn/40 bg-warn-soft px-4 py-3 text-sm text-warn">
          Draft: {missing} business detail(s) in <code>src/lib/business.ts</code> are still placeholders [IN BRACKETS]. Fill them and get a legal review before launch.
        </p>
      )}
      <header>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted">{hindiTitle} · Last updated: {BUSINESS.effectiveDate}</p>
      </header>
      <section className="card space-y-2 bg-brand-soft/40 p-4" lang="hi" aria-label="सार (Summary in Hindi)">
        <h2 className="font-semibold">सार (आसान भाषा में)</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {summary.map((s) => <li key={s}>{s}</li>)}
        </ul>
        <p className="text-xs text-muted">यह सार सिर्फ़ समझने के लिए है; पूरी शर्तें नीचे अंग्रेज़ी में हैं और वही मान्य हैं।</p>
      </section>
      <div className="legal">{children}</div>
    </article>
  );
}
