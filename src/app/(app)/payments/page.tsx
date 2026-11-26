import Link from "next/link";
import { Suspense } from "react";
import { ConnectivityFallback } from "@/components/sync-bar";
import { PageHeader, WAITING } from "@/components/page-header";
import { IconBack, IconChevron, IconWhatsApp } from "@/components/icons";
import { requireStaff } from "@/server/auth";
import { getBilling } from "@/server/data";
import { getT } from "@/server/i18n";
import { addMonths, isISODate, monthStart, todayIn } from "@/lib/dates";
import { fmt, formatDate, formatMoney } from "@/lib/i18n";
import { whatsappLink } from "@/lib/links";

export const metadata = { title: "Payments" };

export default function PaymentsPage(props: PageProps<"/payments">) {
  return (
    <Suspense fallback={<ConnectivityFallback waiting={WAITING} />}>
      <Payments searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Payments({ searchParams }: { searchParams: PageProps<"/payments">["searchParams"] }) {
  const ctx = await requireStaff();
  const [{ t, lang }, sp] = await Promise.all([getT(), searchParams]);
  const thisMonth = monthStart(todayIn(ctx.org.timezone));
  const m = typeof sp.m === "string" && isISODate(`${sp.m}-01`) ? `${sp.m}-01` : thisMonth;
  const rows = await getBilling(ctx, m);
  const monthLabel = formatDate(m, lang, { month: "long", year: "numeric" });
  const billed = rows.reduce((s, r) => s + r.monthAmount, 0);
  const collected = rows.reduce((s, r) => s + r.monthPaid, 0);
  const outstanding = rows.reduce((s, r) => s + Math.max(0, r.balance), 0);
  const shown = rows.filter((r) => !r.stopped || r.monthMeals > 0 || r.balance !== 0);

  return (
    <>
      <PageHeader title={t.payments} sub={monthLabel} />
      <main className="mx-auto max-w-md space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Link href={`/payments?m=${addMonths(m, -1).slice(0, 7)}`} replace className="icon-btn border border-line bg-card" aria-label="Previous month"><IconBack /></Link>
          <p className="flex-1 text-center font-semibold">{monthLabel}</p>
          <Link
            href={`/payments?m=${addMonths(m, 1).slice(0, 7)}`}
            replace
            aria-disabled={m >= thisMonth}
            className="icon-btn border border-line bg-card aria-disabled:pointer-events-none aria-disabled:opacity-40"
            aria-label="Next month"
          ><IconChevron /></Link>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label={t.bill} value={formatMoney(billed)} />
          <Stat label={t.collected} value={formatMoney(collected)} tone="text-ok" />
          <Stat label={t.outstanding} value={formatMoney(outstanding)} tone="text-bad" />
        </div>

        <ul className="card divide-y divide-line overflow-hidden">
          {shown.map((r) => {
            const msg = fmt(t.reminderMsg, { name: r.name, mess: ctx.org.name, month: monthLabel, amount: r.balance, upi: ctx.org.upiId ?? "" });
            return (
              <li key={r.customerId} className="flex items-center gap-1 pr-1">
                <Link href={`/customers/${r.customerId}`} className="flex min-h-16 min-w-0 flex-1 flex-col justify-center px-4 py-2 active:bg-line/60">
                  <span className="truncate font-medium">{r.name}</span>
                  <span className="text-sm text-muted tabular-nums">
                    {r.monthMeals} {t.meals} · {formatMoney(r.monthAmount)}
                  </span>
                </Link>
                <span className={`text-right font-semibold tabular-nums ${r.balance > 0 ? "text-bad" : "text-ok"}`}>
                  {r.balance > 0 ? formatMoney(r.balance) : r.balance < 0 ? `+${formatMoney(-r.balance)}` : "✓"}
                </span>
                {r.balance > 0 && r.phone ? (
                  <a href={whatsappLink(r.phone, msg)} target="_blank" rel="noreferrer" className="icon-btn text-ok" aria-label={`${t.remind}: ${r.name}`}>
                    <IconWhatsApp />
                  </a>
                ) : <span className="w-12" />}
              </li>
            );
          })}
          {shown.length === 0 && <li className="p-6 text-center text-muted">{t.noCustomers}</li>}
        </ul>
      </main>
    </>
  );
}

function Stat({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="card px-2 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-base font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
