import Link from "next/link";
import { BUSINESS as B, PLANS, findPlaceholders } from "@/lib/business";

export const metadata = { title: "Pricing", description: `${B.appName} plans and prices.` };

export default function PricingPage() {
  const missing = findPlaceholders().length;
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {missing > 0 && (
        <p role="note" className="rounded-xl border border-warn/40 bg-warn-soft px-4 py-3 text-sm text-warn">
          Draft prices — edit <code>PLANS</code> in <code>src/lib/business.ts</code>.
        </p>
      )}
      <header className="text-center">
        <h1 className="text-2xl font-bold">Simple monthly plans</h1>
        <p className="text-muted">{B.trialDays} दिन फ़्री ट्रायल · कोई कार्ड नहीं चाहिए · कभी भी कैंसिल करें</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((p) => (
          <section key={p.name} className={`card flex flex-col gap-3 p-4 ${p.highlight ? "border-brand ring-2 ring-brand/20" : ""}`}>
            <h2 className="text-lg font-semibold">{p.name}</h2>
            <p>
              <span className="text-3xl font-bold tabular-nums">{p.price}</span>
              <span className="text-muted">{p.period}</span>
            </p>
            <p className="text-sm text-muted">{p.customers}</p>
            <ul className="flex-1 space-y-1 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2"><span className="text-ok" aria-hidden>✓</span>{f}</li>
              ))}
            </ul>
            <Link href="/signup" className={p.highlight ? "btn-primary" : "btn-secondary"}>Start free trial</Link>
          </section>
        ))}
      </div>
      <p className="text-center text-sm text-muted">
        Prices in Indian Rupees{B.gstin ? ", plus GST as applicable" : ""}. See <Link href="/refund" className="underline">Refund &amp; Cancellation</Link>.
      </p>
    </div>
  );
}
