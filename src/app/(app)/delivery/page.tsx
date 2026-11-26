import Link from "next/link";
import { Suspense } from "react";
import { ConnectivityFallback } from "@/components/sync-bar";
import { PageHeader, WAITING } from "@/components/page-header";
import { DeliveryList } from "@/components/delivery-list";
import { requireMember } from "@/server/auth";
import { getDeliveryList } from "@/server/data";
import { getT } from "@/server/i18n";
import { localNow } from "@/lib/dates";
import { formatDate } from "@/lib/i18n";

export const metadata = { title: "Delivery" };

export default function DeliveryPage(props: PageProps<"/delivery">) {
  return (
    <Suspense fallback={<ConnectivityFallback waiting={WAITING} />}>
      <Delivery searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Delivery({ searchParams }: { searchParams: PageProps<"/delivery">["searchParams"] }) {
  const ctx = await requireMember();
  const [{ t, lang }, sp] = await Promise.all([getT(), searchParams]);
  const now = localNow(ctx.org.timezone);
  const meal = sp.meal === "lunch" || sp.meal === "dinner" ? sp.meal : now.hour >= 16 ? "dinner" : "lunch";
  const rows = await getDeliveryList(ctx, now.date, meal);

  return (
    <>
      <PageHeader title={t.navDelivery} sub={formatDate(now.date, lang, { weekday: "long", day: "numeric", month: "long" })} />
      <main className="mx-auto max-w-md space-y-4 p-4">
        <div className="flex gap-2">
          {(["lunch", "dinner"] as const).map((m) => (
            <Link key={m} href={`/delivery?meal=${m}`} replace aria-current={meal === m ? "page" : undefined} className="chip flex-1 justify-center">
              {t[m]}
            </Link>
          ))}
        </div>
        <DeliveryList
          date={now.date}
          meal={meal}
          rows={rows}
          labels={{
            delivered: t.delivered, pending: t.pending, noArea: t.noArea, call: t.call, directions: t.directions,
            allDone: t.allDone, noMeals: t.noMeals, veg: t.veg, nonveg: t.nonveg, markDelivered: t.markDelivered,
          }}
        />
      </main>
    </>
  );
}
