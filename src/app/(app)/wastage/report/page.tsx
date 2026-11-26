import Link from "next/link";
import { Suspense } from "react";
import { ConnectivityFallback } from "@/components/sync-bar";
import { PageHeader, WAITING } from "@/components/page-header";
import { WasteChart } from "@/components/waste-chart";
import { requireStaff } from "@/server/auth";
import { getReport } from "@/server/wastage";
import { getT } from "@/server/i18n";
import { todayIn } from "@/lib/dates";
import { fmt, formatDate, formatMoney, type Dict } from "@/lib/i18n";

export const metadata = { title: "Wastage report" };

export default function ReportPage(props: PageProps<"/wastage/report">) {
  return (
    <Suspense fallback={<ConnectivityFallback waiting={WAITING} />}>
      <Report searchParams={props.searchParams} />
    </Suspense>
  );
}

const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)}%`);

async function Report({ searchParams }: { searchParams: PageProps<"/wastage/report">["searchParams"] }) {
  const ctx = await requireStaff();
  const [{ t, lang }, sp] = await Promise.all([getT(), searchParams]);
  const range = sp.range === "30" ? 30 : 7;
  const r = await getReport(ctx, todayIn(ctx.org.timezone), range);
  const target = ctx.org.wastageTargetPct;
  const over = r.pct !== null && r.pct * 100 > target;

  return (
    <>
      <PageHeader title={t.wastageReport} sub={fmt(t.daysLogged, { n: r.daysLogged, d: r.days })} back="/today"
        right={<Link href="/wastage" className="btn-ghost min-h-12 text-sm">{t.wastageEntry}</Link>} />
      <main className="mx-auto max-w-md space-y-4 p-4">
        <div className="flex gap-2">
          {([7, 30] as const).map((n) => (
            <Link key={n} href={`/wastage/report?range=${n}`} replace aria-current={range === n ? "page" : undefined} className="chip flex-1 justify-center">
              {n === 7 ? t.days7 : t.days30}
            </Link>
          ))}
        </div>

        {r.daysLogged === 0 ? (
          <div className="card space-y-4 p-6 text-center">
            <p className="text-muted">{t.noWasteData}</p>
            <Link href="/wastage" className="btn-primary w-full">{t.wastageEntry}</Link>
          </div>
        ) : (
          <>
            <section className="card space-y-3 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted">{t.wasted}</p>
                  <p className={`text-4xl font-bold tabular-nums ${over ? "text-bad" : "text-ok"}`}>{pct(r.pct)}</p>
                  <p className="text-sm text-muted">{over ? "▲" : "✓"} {t.target} {target}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted">{t.loss}</p>
                  <p className="text-4xl font-bold tabular-nums">{formatMoney(r.loss)}</p>
                </div>
              </div>
              <p className="text-sm">
                {fmt(t.wasteSummary, { days: r.daysLogged, kg: r.wastedKg, loss: new Intl.NumberFormat("en-IN").format(r.loss) })}
                {r.byLabel.length > 0 && <> {fmt(t.worstItems, { items: r.byLabel.slice(0, 2).map((b) => `${b.label} (${pct(b.pct)})`).join(", ") })}</>}
              </p>
            </section>

            <section className="card p-4">
              <WasteChart
                targetPct={target}
                days={r.byDay.map((d) => ({ ...d, label: formatDate(d.date, lang, { day: "numeric", month: "short" }) }))}
                labels={{ target: t.target, wasted: t.wasted, loss: t.loss, noEntry: "—", table: t.showTable }}
              />
            </section>

            <section className="space-y-2">
              <h2 className="section-title">{t.byDish}</h2>
              <ul className="card divide-y divide-line">
                {r.byDish.map((d) => (
                  <li key={d.dishId} className="flex min-h-14 items-center gap-3 px-4 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{d.name}</p>
                      <p className="text-sm text-muted tabular-nums">
                        {t.cooked} {d.cooked} · {t.leftover} {d.leftover} {t[`unit_${d.unit}`]}
                      </p>
                    </div>
                    <div className="text-right tabular-nums">
                      <p className={`font-semibold ${d.pct * 100 > target ? "text-bad" : ""}`}>{pct(d.pct)}</p>
                      {d.loss > 0 && <p className="text-sm text-muted">{formatMoney(d.loss)}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {r.byLabel.length > 0 && (
              <section className="space-y-2">
                <h2 className="section-title">{t.byVariety}</h2>
                <ul className="card divide-y divide-line">
                  {r.byLabel.map((b) => (
                    <li key={`${b.dishName}|${b.label}`} className="flex min-h-12 items-center gap-3 px-4 py-2">
                      <span className="flex-1"><b>{b.label}</b> <span className="text-sm text-muted">· {b.dishName} · {fmt(t.times, { n: b.times })}</span></span>
                      <span className={`font-semibold tabular-nums ${b.pct * 100 > target ? "text-bad" : ""}`}>{pct(b.pct)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {r.reasons.length > 0 && (
              <section className="space-y-2">
                <h2 className="section-title">{t.reasonsTitle}</h2>
                <ul className="card divide-y divide-line">
                  {r.reasons.map((x) => (
                    <li key={x.reason} className="flex min-h-12 items-center px-4">
                      <span className="flex-1">{t[`reason_${x.reason}` as keyof Dict]}</span>
                      <span className="text-muted tabular-nums">{fmt(t.times, { n: x.times })}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
