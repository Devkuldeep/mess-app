import Link from "next/link";
import { Suspense } from "react";
import { ConnectivityFallback } from "@/components/sync-bar";
import { PageHeader, WAITING } from "@/components/page-header";
import { WastageForm } from "@/components/wastage-form";
import { requireStaff } from "@/server/auth";
import { getEntry, getSuggestions, listDishes, loggedMeals } from "@/server/wastage";
import { getT } from "@/server/i18n";
import { addDays, isISODate, localNow } from "@/lib/dates";
import { fmt, formatDate } from "@/lib/i18n";

export const metadata = { title: "Wastage" };

export default function WastagePage(props: PageProps<"/wastage">) {
  return (
    <Suspense fallback={<ConnectivityFallback waiting={WAITING} />}>
      <Wastage searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Wastage({ searchParams }: { searchParams: PageProps<"/wastage">["searchParams"] }) {
  const ctx = await requireStaff();
  const [{ t, lang }, sp] = await Promise.all([getT(), searchParams]);
  const now = localNow(ctx.org.timezone);
  const days = [now.date, addDays(now.date, -1), addDays(now.date, -2)];
  const date = typeof sp.d === "string" && isISODate(sp.d) && days.includes(sp.d) ? sp.d : now.date;
  // Lunch leftovers are known by afternoon; default to dinner only late in the day.
  const meal = sp.meal === "lunch" || sp.meal === "dinner" ? sp.meal : date === now.date && now.hour < 19 ? "lunch" : "dinner";

  const [dishes, entry, sug, logged] = await Promise.all([
    listDishes(ctx),
    getEntry(ctx, date, meal),
    getSuggestions(ctx, date),
    loggedMeals(ctx, days[2], days[0]),
  ]);
  const suggested = Object.fromEntries(sug[meal].map((s) => [s.dishId, s.qty]));
  const href = (d: string, m: string) => `/wastage?d=${d}&meal=${m}`;

  return (
    <>
      <PageHeader
        title={t.wastageEntry}
        sub={`${formatDate(date, lang, { weekday: "long", day: "numeric", month: "long" })} · ${fmt(t.tiffinsN, { n: entry?.tiffins ?? sug.tiffins[meal] })}`}
        back="/today"
        right={<Link href="/wastage/report" className="btn-ghost min-h-12 text-sm">{t.wastageReport}</Link>}
      />
      <main className="mx-auto max-w-md space-y-4 p-4">
        <div className="flex gap-2 overflow-x-auto">
          {days.map((d) => (
            <Link key={d} href={href(d, meal)} replace aria-current={d === date ? "page" : undefined} className="chip shrink-0">
              {d === now.date ? t.today : formatDate(d, lang)}
            </Link>
          ))}
        </div>
        <div className="flex gap-2">
          {(["lunch", "dinner"] as const).map((m) => (
            <Link key={m} href={href(date, m)} replace aria-current={m === meal ? "page" : undefined} className="chip flex-1 justify-center">
              {t[m]} {logged.has(`${date}|${m}`) && "✓"}
            </Link>
          ))}
        </div>
        <WastageForm
          key={`${date}|${meal}`}
          date={date}
          meal={meal}
          dishes={dishes.map((d) => ({ id: d.id, name: d.name, unit: d.unit, variety: d.variety }))}
          suggested={suggested}
          initial={entry}
          t={t}
        />
      </main>
    </>
  );
}
