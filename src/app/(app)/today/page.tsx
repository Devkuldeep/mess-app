import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ConnectivityFallback } from "@/components/sync-bar";
import { PageHeader, WAITING } from "@/components/page-header";
import { requireMember } from "@/server/auth";
import { getDayCount } from "@/server/data";
import { getReport, getSuggestions, loggedMeals } from "@/server/wastage";
import type { Suggestion } from "@/lib/wastage";
import { getT } from "@/server/i18n";
import { addDays, localNow } from "@/lib/dates";
import { fmt, formatDate, formatMoney, type Dict } from "@/lib/i18n";
import type { MealName } from "@/lib/schedule";

export const metadata = { title: "Count" };

export default function TodayPage(props: PageProps<"/today">) {
  return (
    <Suspense fallback={<ConnectivityFallback waiting={WAITING} />}>
      <Today searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Today({ searchParams }: { searchParams: PageProps<"/today">["searchParams"] }) {
  const ctx = await requireMember();
  if (ctx.role === "delivery") redirect("/delivery");
  const [{ t, lang }, sp] = await Promise.all([getT(), searchParams]);
  const now = localNow(ctx.org.timezone);
  // After 3 PM the owner is planning tomorrow; before that, today.
  const which = sp.d === "today" || sp.d === "tomorrow" ? sp.d : now.hour >= 15 ? "tomorrow" : "today";
  const date = which === "today" ? now.date : addDays(now.date, 1);
  const [day, sug, logged, week] = await Promise.all([
    getDayCount(ctx, date),
    getSuggestions(ctx, date),
    loggedMeals(ctx, now.date, now.date),
    getReport(ctx, now.date, 7),
  ]);
  const target = ctx.org.wastageTargetPct;

  return (
    <>
      <PageHeader title={t.cookFor} sub={`${ctx.org.name} · ${formatDate(date, lang, { weekday: "long", day: "numeric", month: "long" })}`} />
      <main className="mx-auto max-w-md space-y-4 p-4">
        <div className="flex gap-2" role="tablist">
          {(["today", "tomorrow"] as const).map((k) => (
            <Link key={k} href={`/today?d=${k}`} replace aria-current={which === k ? "page" : undefined} className="chip flex-1 justify-center">
              {t[k]}
            </Link>
          ))}
        </div>

        {day.holiday !== undefined ? (
          <div className="card bg-warn-soft p-6 text-center">
            <p className="text-2xl font-bold text-warn">{t.closedToday}</p>
            {day.holiday && <p className="mt-1 text-muted">{day.holiday}</p>}
          </div>
        ) : (
          <>
            {(["lunch", "dinner"] as const).map((m) => (
              <MealCard key={m} meal={m} c={day.counts[m]} t={t} suggestions={sug[m]} />
            ))}
            <section className="card space-y-3 p-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">{t.wastage}</h2>
                <Link href="/wastage/report" className="text-sm font-medium text-brand-ink underline">{t.wastageReport}</Link>
              </div>
              {week.pct !== null && (
                <p className="text-sm text-muted">
                  {t.thisWeek}: <b className={week.pct * 100 > target ? "text-bad" : "text-ok"}>{Math.round(week.pct * 100)}%</b> {t.wasted.toLowerCase()} · {formatMoney(week.loss)} · {t.target} {target}%
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {(["lunch", "dinner"] as const).map((m) => {
                  const done = logged.has(`${now.date}|${m}`);
                  return (
                    <Link key={m} href={`/wastage?d=${now.date}&meal=${m}`} className={done ? "btn-secondary" : "btn-primary"}>
                      {t[m]}: {done ? `✓ ${t.logged}` : t.logNow}
                    </Link>
                  );
                })}
              </div>
            </section>
            {day.notes.length > 0 && (
              <section className="space-y-2">
                <h2 className="section-title">{t.specialNotes}</h2>
                <ul className="card divide-y divide-line">
                  {day.notes.map((n) => (
                    <li key={n.id}>
                      <Link href={`/customers/${n.id}`} className="flex min-h-14 items-center gap-3 px-4 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{n.name}</p>
                          <p className="text-sm text-muted">{n.notes}</p>
                        </div>
                        <span className="text-xs text-muted">{n.meals.map((m) => t[m]).join(" + ")}</span>
                      </Link>
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

function MealCard({ meal, c, t, suggestions }: { meal: MealName; c: { veg: number; nonveg: number; total: number; skipped: number }; t: Dict; suggestions: Suggestion[] }) {
  const conf = suggestions.reduce((min, s) => Math.min(min, s.samples), Infinity);
  const confLabel = conf < 3 ? fmt(t.learning, { n: Number.isFinite(conf) ? conf : 0 }) : conf < 10 ? t.confMedium : t.confGood;
  return (
    <section className="card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">{t[meal]}</h2>
        {c.skipped > 0 && <span className="text-sm text-muted">{t.skipped}: {c.skipped}</span>}
      </div>
      {c.total === 0 ? (
        <p className="py-4 text-muted">{t.noMeals}</p>
      ) : (
        <div className="mt-2 flex items-end gap-4">
          <p className="text-5xl font-bold tabular-nums">{c.total}</p>
          <div className="flex flex-1 justify-end gap-2 pb-1">
            <Pill dot="bg-veg" label={t.veg} n={c.veg} />
            <Pill dot="bg-nonveg" label={t.nonveg} n={c.nonveg} />
          </div>
        </div>
      )}
      {c.total > 0 && suggestions.length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="flex items-baseline justify-between text-sm">
            <span className="font-medium">{t.suggestTitle}</span>
            <span className="text-xs text-muted">{confLabel}</span>
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            {suggestions.map((s) => (
              <li key={s.dishId} className="flex justify-between text-sm">
                <span className="text-muted">{s.name}</span>
                <b className="tabular-nums">{s.qty} {t[`unit_${s.unit}`]}</b>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Pill({ dot, label, n }: { dot: string; label: string; n: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-sm">
      <span className={`size-2.5 rounded-sm ${dot}`} aria-hidden />
      {label}
      <b className="tabular-nums">{n}</b>
    </span>
  );
}
