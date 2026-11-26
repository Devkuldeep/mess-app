import { BUSINESS as B, findPlaceholders } from "@/lib/business";

export const metadata = { title: "Contact Us", description: `Contact ${B.appName} support.` };

export default function ContactPage() {
  const missing = findPlaceholders().length;
  const rows: [string, React.ReactNode][] = [
    ["Business name", <>{B.legalName} <span className="text-muted">({B.entityType})</span></>],
    ["Address", B.address],
    ["Email", <a key="e" href={`mailto:${B.supportEmail}`} className="text-brand-ink underline">{B.supportEmail}</a>],
    ["Phone / WhatsApp", <a key="p" href={`tel:${B.supportPhone.replace(/[^\d+]/g, "")}`} className="text-brand-ink underline">{B.supportPhone}</a>],
    ["Support hours", B.supportHours],
    ...(B.gstin ? ([["GSTIN", B.gstin]] as [string, React.ReactNode][]) : []),
  ];
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {missing > 0 && (
        <p role="note" className="rounded-xl border border-warn/40 bg-warn-soft px-4 py-3 text-sm text-warn">
          Draft: fill business details in <code>src/lib/business.ts</code>.
        </p>
      )}
      <header>
        <h1 className="text-2xl font-bold">Contact Us</h1>
        <p className="text-muted">संपर्क करें — हम हिंदी और English में मदद करते हैं।</p>
      </header>
      <dl className="card divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="text-sm text-muted">{k}</dt>
            <dd className="sm:col-span-2">{v}</dd>
          </div>
        ))}
      </dl>
      <section className="card space-y-1 p-4">
        <h2 className="font-semibold">Grievance Officer (DPDP Act, 2023)</h2>
        <p>{B.grievanceOfficerName}</p>
        <p><a href={`mailto:${B.grievanceEmail}`} className="text-brand-ink underline">{B.grievanceEmail}</a></p>
        <p className="text-sm text-muted">For privacy requests and complaints. We aim to resolve them within {B.grievanceResponseDays} days.</p>
      </section>
      <p className="text-sm text-muted">
        Tiffin customers: for questions about your meals, bills or deliveries, please contact your mess directly.
      </p>
    </div>
  );
}
