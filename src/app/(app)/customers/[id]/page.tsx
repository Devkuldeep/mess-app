import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ConnectivityFallback } from "@/components/sync-bar";
import { PageHeader, WAITING } from "@/components/page-header";
import { PaymentForm } from "@/components/payment-form";
import { CopyButton } from "@/components/copy-button";
import { IconPhone, IconWhatsApp } from "@/components/icons";
import { requireStaff } from "@/server/auth";
import { getCustomer, getCustomerBalance, getCustomerPayments } from "@/server/data";
import { getT } from "@/server/i18n";
import { deletePayment, setCustomerEnd } from "@/app/actions/customers";
import { fromDbDate, todayIn } from "@/lib/dates";
import { formatDate, formatMoney } from "@/lib/i18n";
import { whatsappLink } from "@/lib/links";

export const metadata = { title: "Customer" };

export default function CustomerPage(props: PageProps<"/customers/[id]">) {
  return (
    <Suspense fallback={<ConnectivityFallback waiting={WAITING} />}>
      <Customer params={props.params} />
    </Suspense>
  );
}

async function Customer({ params }: { params: PageProps<"/customers/[id]">["params"] }) {
  const ctx = await requireStaff();
  const { id } = await params;
  const [{ t, lang }, c] = await Promise.all([getT(), getCustomer(ctx, id)]);
  if (!c) notFound();
  const [payments, balance, h] = await Promise.all([getCustomerPayments(ctx, c.id), getCustomerBalance(ctx, c.id), headers()]);
  const today = todayIn(ctx.org.timezone);
  const stopped = !!c.endDate && fromDbDate(c.endDate) < today;
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const link = `${origin}/c/${c.portalToken}`;
  const shareText = `${ctx.org.name}: ${link}`;

  return (
    <>
      <PageHeader
        title={c.name}
        sub={[c.plan?.name ?? t.noPlan, c.area].filter(Boolean).join(" · ")}
        back="/customers"
        right={<Link href={`/customers/${c.id}/edit`} className="btn-ghost min-h-12">{t.edit}</Link>}
      />
      <main className="mx-auto max-w-md space-y-4 p-4">
        {stopped && <p className="rounded-xl bg-warn-soft px-4 py-3 text-warn">{t.stopped} · {formatDate(fromDbDate(c.endDate!), lang)}</p>}

        <section className="card space-y-4 p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-muted">{balance >= 0 ? t.due : t.advance}</p>
              <p className={`text-4xl font-bold tabular-nums ${balance > 0 ? "text-bad" : "text-ok"}`}>{formatMoney(Math.abs(balance))}</p>
            </div>
          </div>
          <PaymentForm
            customerId={c.id}
            today={today}
            suggested={Math.max(0, balance)}
            labels={{ recordPayment: t.recordPayment, amount: t.amount, method: t.method, upi: t.upi, cash: t.cash, other: t.other, save: t.save, saved: t.saved, pendingSync: t.pendingSync }}
          />
        </section>

        {(c.phone || c.address || c.notes) && (
          <section className="card divide-y divide-line">
            {c.phone && (
              <div className="flex items-center gap-2 px-4 py-2">
                <p className="flex-1 tabular-nums">{c.phone}</p>
                <a href={`tel:${c.phone}`} className="icon-btn" aria-label={t.call}><IconPhone /></a>
                <a href={whatsappLink(c.phone, "")} target="_blank" rel="noreferrer" className="icon-btn" aria-label="WhatsApp"><IconWhatsApp /></a>
              </div>
            )}
            {c.address && <p className="px-4 py-3">{c.address}</p>}
            {c.notes && <p className="px-4 py-3 text-warn">{c.notes}</p>}
          </section>
        )}

        <section className="card space-y-3 p-4">
          <h2 className="font-semibold">{t.customerLink}</h2>
          <p className="break-all rounded-xl bg-surface px-3 py-2 text-sm text-muted">{link}</p>
          <div className="flex gap-2">
            <a href={whatsappLink(c.phone, shareText)} target="_blank" rel="noreferrer" className="btn-primary flex-1">
              <IconWhatsApp className="size-5" /> WhatsApp
            </a>
            <CopyButton text={link} label={t.copyLink} done={t.copied} />
          </div>
        </section>

        {payments.length > 0 && (
          <section className="space-y-2">
            <h2 className="section-title">{t.payments}</h2>
            <ul className="card divide-y divide-line">
              {payments.map((p) => (
                <li key={p.id} className="flex min-h-14 items-center gap-3 px-4">
                  <span className="flex-1">
                    <span className="font-semibold tabular-nums">{formatMoney(p.amount)}</span>
                    <span className="ml-2 text-sm text-muted">{t[p.method]}</span>
                  </span>
                  <span className="text-sm text-muted">{formatDate(p.paidOn, lang)}</span>
                  <form action={deletePayment}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="icon-btn text-xl" aria-label={t.delete}>×</button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}

        <form action={setCustomerEnd}>
          <input type="hidden" name="id" value={c.id} />
          <input type="hidden" name="endDate" value={stopped || c.endDate ? "" : today} />
          <button className={stopped || c.endDate ? "btn-secondary w-full" : "btn-ghost w-full text-bad"}>
            {stopped || c.endDate ? t.resume : t.stopService}
          </button>
        </form>
      </main>
    </>
  );
}
