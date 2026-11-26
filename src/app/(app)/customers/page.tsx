import Link from "next/link";
import { Suspense } from "react";
import { ConnectivityFallback } from "@/components/sync-bar";
import { PageHeader, WAITING } from "@/components/page-header";
import { CustomerSearch } from "@/components/customer-search";
import { IconPlus } from "@/components/icons";
import { requireStaff } from "@/server/auth";
import { listCustomers } from "@/server/data";
import { getT } from "@/server/i18n";
import { fromDbDate, todayIn } from "@/lib/dates";

export const metadata = { title: "Customers" };

export default function CustomersPage() {
  return (
    <Suspense fallback={<ConnectivityFallback waiting={WAITING} />}>
      <Customers />
    </Suspense>
  );
}

async function Customers() {
  const ctx = await requireStaff();
  const [{ t }, rows] = await Promise.all([getT(), listCustomers(ctx)]);
  const today = todayIn(ctx.org.timezone);
  const items = rows.map((c) => ({
    id: c.id, name: c.name, phone: c.phone, area: c.area, diet: c.diet, plan: c.plan?.name ?? null,
    stopped: !!c.endDate && fromDbDate(c.endDate) < today,
  }));
  const active = items.filter((c) => !c.stopped).length;

  return (
    <>
      <PageHeader title={t.customers} sub={`${t.active}: ${active}`} />
      <main className="mx-auto max-w-md p-4">
        {items.length === 0 ? (
          <div className="card space-y-4 p-6 text-center">
            <p className="text-muted">{t.noCustomers}</p>
            <Link href="/customers/new" className="btn-primary w-full">{t.addCustomer}</Link>
          </div>
        ) : (
          <CustomerSearch items={items} labels={{ search: t.search, stopped: t.stopped, noPlan: t.noPlan }} />
        )}
      </main>
      <Link
        href="/customers/new"
        aria-label={t.addCustomer}
        className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 flex size-14 items-center justify-center rounded-2xl bg-brand text-on-brand shadow-lg active:scale-95"
      >
        <IconPlus className="size-7" />
      </Link>
    </>
  );
}
